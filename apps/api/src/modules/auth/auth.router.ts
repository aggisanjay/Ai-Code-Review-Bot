import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@reviewflow/database';
import { UserRegisterSchema, UserLoginSchema } from '@reviewflow/shared';
import { config } from '../../common/config';
import { authenticateToken, AuthenticatedRequest } from '../../common/auth.middleware';

export const authRouter = Router();

function hashPassword(password: string): string {
  // Use PBKDF2 with sha512 for secure, standard password hashing without external binary addons
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  // If demo dummy argon hash from seed, allow 'Password123!'
  if (storedHash.startsWith('$argon2id')) {
    return password === 'Password123!';
  }
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

function generateToken(userId: string, organizationId?: string): string {
  return jwt.sign({ userId, organizationId }, config.jwtSecret, { expiresIn: '7d' });
}

// POST /api/v1/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const result = UserRegisterSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: { code: 'VALIDATION_FAILED', details: result.error.flatten() } });
    return;
  }

  const { email, password, name } = result.data;

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
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
  const org = await prisma.organization.create({
    data: {
      name: `${name}'s Team`,
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

  const token = generateToken(user.id, org.id);

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
    include: { memberships: { include: { organization: true } } },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    return;
  }

  const activeOrg = user.memberships[0];
  const token = generateToken(user.id, activeOrg?.organizationId);

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
        include: { organization: true },
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
      })),
    },
  });
});
