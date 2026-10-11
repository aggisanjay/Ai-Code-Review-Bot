import { Router, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { CreateOrgSchema, InviteMemberSchema } from '@reviewflow/shared';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../common/auth.middleware';

export const organizationsRouter = Router();
organizationsRouter.use(authenticateToken);

// GET /api/v1/organizations
organizationsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: req.user!.id },
    include: {
      organization: {
        include: {
          _count: {
            select: { members: true, repositories: true },
          },
        },
      },
    },
  });

  const orgs = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    plan: m.organization.plan,
    role: m.role,
    membersCount: m.organization._count.members,
    repositoriesCount: m.organization._count.repositories,
    createdAt: m.organization.createdAt,
  }));

  res.json({ data: orgs });
});

// POST /api/v1/organizations
organizationsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const result = CreateOrgSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: { code: 'VALIDATION_FAILED', details: result.error.flatten() } });
    return;
  }

  const { name, slug } = result.data;

  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    res.status(409).json({ error: { code: 'SLUG_EXISTS', message: 'An organization with this slug already exists.' } });
    return;
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      plan: 'FREE',
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: req.user!.id,
      role: 'OWNER',
    },
  });

  await prisma.reviewPolicy.create({
    data: {
      organizationId: org.id,
    },
  });

  res.status(201).json({ data: { ...org, role: 'OWNER' } });
});

// GET /api/v1/organizations/:id/members
organizationsRouter.get('/:id/members', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.params.id;

  // Verify requester belongs to the org
  const isMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: req.user!.id } },
  });

  if (!isMember) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this organization.' } });
    return;
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  res.json({
    data: members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    })),
  });
});

// POST /api/v1/organizations/:id/invite
organizationsRouter.post(
  '/:id/invite',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.params.id;
    const result = InviteMemberSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ error: { code: 'VALIDATION_FAILED', details: result.error.flatten() } });
      return;
    }

    const { email, role } = result.data;

    let targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      // Create invited user placeholder
      targetUser = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          passwordHash: 'INVITED_PENDING_ACTIVATION',
        },
      });
    }

    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: targetUser.id } },
    });

    if (existingMember) {
      res.status(409).json({ error: { code: 'ALREADY_MEMBER', message: 'User is already a member of this organization.' } });
      return;
    }

    const member = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ data: member });
  }
);
