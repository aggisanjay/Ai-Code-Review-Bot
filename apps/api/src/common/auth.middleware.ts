import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@reviewflow/database';
import { OrgRole } from '@reviewflow/shared';
import { config } from './config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: OrgRole;
  sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
    (req.query.token as string) ||
    null;

  if (!token) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. No bearer token provided.' },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      organizationId?: string;
      sessionId?: string;
    };

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { memberships: true },
    });

    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'User account not found or deactivated.' },
      });
      return;
    }

    // Verify session in database if sessionId was embedded
    if (payload.sessionId) {
      const dbSession = await prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!dbSession || dbSession.expiresAt < new Date()) {
        res.status(401).json({
          error: { code: 'SESSION_EXPIRED', message: 'Session has expired or been revoked. Please sign in again.' },
        });
        return;
      }
    }

    // Determine active organization tenant boundary
    let orgId = payload.organizationId;
    let memberRole: OrgRole = 'MEMBER';

    if (orgId) {
      const mem = user.memberships.find((m) => m.organizationId === orgId);
      if (mem) {
        memberRole = mem.role as OrgRole;
      } else if (user.memberships.length > 0) {
        orgId = user.memberships[0].organizationId;
        memberRole = user.memberships[0].role as OrgRole;
      }
    } else if (user.memberships.length > 0) {
      orgId = user.memberships[0].organizationId;
      memberRole = user.memberships[0].role as OrgRole;
    } else {
      orgId = '';
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: orgId,
      role: memberRole,
      sessionId: payload.sessionId,
    };

    next();
  } catch (_err) {
    res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' },
    });
  }
}

export function requireRole(allowedRoles: OrgRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Action requires one of: [${allowedRoles.join(', ')}]`,
        },
      });
      return;
    }

    next();
  };
}
