import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@reviewflow/database';
import { UserRegisterSchema, UserLoginSchema } from '@reviewflow/shared';
import { config } from '../../common/config';
import { authenticateToken, AuthenticatedRequest } from '../../common/auth.middleware';

export const authRouter = Router();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

function generateToken(userId: string, organizationId?: string, sessionId?: string): string {
  return jwt.sign(
    { userId, organizationId, sessionId },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
}

// POST /api/v1/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const result = UserRegisterSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: { code: 'VALIDATION_FAILED', details: result.error.flatten() } });
    return;
  }

  const { email, password, name } = result.data;
  const requestedOrgName = req.body.orgName || `${name}'s Team`;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' } });
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(password),
    },
  });

  // Automatically create user's initial organization
  const slug = `${requestedOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
  const org = await prisma.organization.create({
    data: {
      name: requestedOrgName,
      slug,
      plan: 'FREE',
    },
  });

  // Assign user as OWNER
  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // Create default review policy
  await prisma.reviewPolicy.create({
    data: {
      organizationId: org.id,
      repositoryId: null,
    },
  });

  // Create persistent session in database
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
    },
  });

  const token = generateToken(user.id, org.id, session.id);

  res.status(201).json({
    data: {
      user: { id: user.id, email: user.email, name: user.name },
      organization: { id: org.id, name: org.name, slug: org.slug, role: 'OWNER' },
      token,
    },
  });
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const result = UserLoginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: { code: 'VALIDATION_FAILED', details: result.error.flatten() } });
    return;
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              _count: {
                select: { installations: true, repositories: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    return;
  }

  // Prioritize organization that holds active GitHub installations or repositories
  const sortedMemberships = [...user.memberships].sort((a, b) => {
    const aCount = (a.organization._count?.installations ?? 0) * 100 + (a.organization._count?.repositories ?? 0);
    const bCount = (b.organization._count?.installations ?? 0) * 100 + (b.organization._count?.repositories ?? 0);
    if (bCount !== aCount) return bCount - aCount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const activeOrg = sortedMemberships[0];

  // Create durable session in database
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  const token = generateToken(user.id, activeOrg?.organizationId, session.id);

  res.json({
    data: {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      organization: activeOrg
        ? {
            id: activeOrg.organization.id,
            name: activeOrg.organization.name,
            slug: activeOrg.organization.slug,
            plan: activeOrg.organization.plan,
            role: activeOrg.role,
          }
        : null,
      token,
    },
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.sessionId) {
    await prisma.session.deleteMany({
      where: { id: req.user.sessionId },
    });
  }

  res.json({
    data: { success: true, message: 'Logged out successfully.' },
  });
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'Valid email required.' } });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent user enumeration attacks
  if (!user) {
    res.json({ data: { message: 'If an account exists, a password reset link has been dispatched.' } });
    return;
  }

  // Create reset session token
  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      userId: user.id,
      token: `reset_${resetToken}`,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour expiration
    },
  });

  res.json({
    data: {
      message: 'If an account exists, a password reset link has been dispatched.',
      // In development mode, provide token for testing reset flow
      ...(config.nodeEnv !== 'production' ? { devResetToken: resetToken } : {}),
    },
  });
});

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'Valid token and password of at least 8 characters required.' },
    });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { token: `reset_${token}` },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    res.status(400).json({ error: { code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Reset token is invalid or has expired.' } });
    return;
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: hashPassword(newPassword) },
  });

  // Invalidate reset session
  await prisma.session.delete({ where: { id: session.id } });

  res.json({
    data: { success: true, message: 'Password has been reset successfully. You may now log in.' },
  });
});

// POST /api/v1/auth/switch-org
authRouter.post('/switch-org', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.body;
  if (!organizationId || typeof organizationId !== 'string') {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'organizationId is required.' } });
    return;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: req.user!.id,
      },
    },
    include: { organization: true },
  });

  if (!membership) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You are not a member of this organization.' } });
    return;
  }

  const token = generateToken(req.user!.id, membership.organizationId, req.user!.sessionId);

  res.json({
    data: {
      token,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        plan: membership.organization.plan,
        role: membership.role,
      },
    },
  });
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              _count: {
                select: { installations: true, repositories: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });
    return;
  }

  const activeMembership = user.memberships.find((m) => m.organizationId === req.user?.organizationId) || user.memberships[0];

  res.json({
    data: {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      activeOrganization: activeMembership
        ? {
            id: activeMembership.organization.id,
            name: activeMembership.organization.name,
            slug: activeMembership.organization.slug,
            plan: activeMembership.organization.plan,
            role: activeMembership.role,
          }
        : null,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        plan: m.organization.plan,
        role: m.role,
        installationsCount: m.organization._count?.installations ?? 0,
        repositoriesCount: m.organization._count?.repositories ?? 0,
      })),
    },
  });
});
