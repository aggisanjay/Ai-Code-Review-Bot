import { prisma } from '@reviewflow/database';
import { PLAN_CONFIGS, PlanTier } from '@reviewflow/shared';
import { logger } from '../../common/logger';

export interface QuotaCheckResult {
  allowed: boolean;
  currentUsage: number;
  reviewsUsed: number;
  limit: number;
  reviewsLimit: number;
  remaining: number;
  reviewsRemaining: number;
  plan: PlanTier;
  resetDate: Date;
  message?: string;
  reason?: string;
  percentage: number;
}

/**
 * Computes the UTC calendar month parameters and the next monthly reset timestamp.
 */
export function getCalendarMonthPeriod(date: Date = new Date()) {
  const periodYear = date.getUTCFullYear();
  const periodMonth = date.getUTCMonth() + 1; // 1-indexed

  // Reset timestamp is 00:00:00 UTC on the 1st day of the next calendar month
  const nextMonthYear = periodMonth === 12 ? periodYear + 1 : periodYear;
  const nextMonth = periodMonth === 12 ? 1 : periodMonth + 1;
  const resetDate = new Date(Date.UTC(nextMonthYear, nextMonth - 1, 1, 0, 0, 0));

  return { periodYear, periodMonth, resetDate };
}

/**
 * Authoritative, atomic server-side review quota enforcement.
 * Checks whether an organization is within its monthly review limits and, if billable,
 * atomically increments the review count in a single transaction.
 */
export async function checkAndIncrementReviewQuota(
  organizationId: string,
  options: { isBillable?: boolean; dbClient?: any } = { isBillable: true }
): Promise<QuotaCheckResult> {
  const { periodYear, periodMonth, resetDate } = getCalendarMonthPeriod();
  const client = options.dbClient || prisma;

  return await client.$transaction(async (tx: any) => {
    // 1. Fetch organization to determine authoritative plan tier
    const org = await tx.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, plan: true, name: true },
    });

    if (!org) {
      throw new Error(`Organization ${organizationId} not found during quota check.`);
    }

    const plan = ((org.plan || 'FREE').toUpperCase() as PlanTier) in PLAN_CONFIGS
      ? ((org.plan || 'FREE').toUpperCase() as PlanTier)
      : 'FREE';

    const planLimits = PLAN_CONFIGS[plan] || PLAN_CONFIGS.FREE;
    const limit = planLimits.maxReviewsPerMonth;

    // 2. Query current usage record for this organization and calendar month
    const existingUsage = await tx.usageRecord.findUnique({
      where: {
        organizationId_periodYear_periodMonth: {
          organizationId,
          periodYear,
          periodMonth,
        },
      },
    });

    const currentUsage = existingUsage?.reviewCount || 0;
    const isAtOrExceedingLimit = currentUsage >= limit;

    if (isAtOrExceedingLimit) {
      const resetDateFormatted = resetDate.toISOString().split('T')[0];
      const message = `Monthly review quota of ${limit} reviews reached for organization on ${planLimits.name} (${currentUsage}/${limit} used). Quota resets on ${resetDateFormatted}. Upgrade to a higher tier to increase your quota.`;

      logger.warn('Organization reached monthly review quota', {
        organizationId,
        plan,
        currentUsage,
        limit,
        resetDate: resetDateFormatted,
      });

      // Record audit log for visibility
      try {
        await tx.auditLog.create({
          data: {
            organizationId,
            action: 'QUOTA_EXCEEDED',
            resourceType: 'BILLING_QUOTA',
            resourceId: `${periodYear}-${periodMonth}`,
            detailsJson: JSON.stringify({
              plan,
              currentUsage,
              limit,
              resetDate: resetDateFormatted,
            }),
          },
        });
      } catch {}

      return {
        allowed: false,
        currentUsage,
        reviewsUsed: currentUsage,
        limit,
        reviewsLimit: limit,
        remaining: 0,
        reviewsRemaining: 0,
        plan,
        resetDate,
        message,
        reason: 'QUOTA_EXCEEDED',
        percentage: 100,
      };
    }

    // 3. If billable, atomically increment the review counter
    let updatedUsageCount = currentUsage;
    if (options.isBillable !== false) {
      const updated = await tx.usageRecord.upsert({
        where: {
          organizationId_periodYear_periodMonth: {
            organizationId,
            periodYear,
            periodMonth,
          },
        },
        create: {
          organizationId,
          periodYear,
          periodMonth,
          reviewCount: 1,
        },
        update: {
          reviewCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      updatedUsageCount = updated.reviewCount;
    }

    const remaining = Math.max(0, limit - updatedUsageCount);
    const percentage = Math.min(100, Math.round((updatedUsageCount / limit) * 100));

    return {
      allowed: true,
      currentUsage: updatedUsageCount,
      reviewsUsed: updatedUsageCount,
      limit,
      reviewsLimit: limit,
      remaining,
      reviewsRemaining: remaining,
      plan,
      resetDate,
      percentage,
    };
  });
}

/**
 * Non-mutating read of current monthly quota usage for telemetry & dashboards.
 */
export async function getQuotaStatus(
  organizationId: string,
  dbClient?: any
): Promise<QuotaCheckResult> {
  const client = dbClient || prisma;
  const { periodYear, periodMonth, resetDate } = getCalendarMonthPeriod();

  const org = await client.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  });

  const plan = ((org?.plan || 'FREE').toUpperCase() as PlanTier) in PLAN_CONFIGS
    ? ((org?.plan || 'FREE').toUpperCase() as PlanTier)
    : 'FREE';

  const planLimits = PLAN_CONFIGS[plan] || PLAN_CONFIGS.FREE;
  const limit = planLimits.maxReviewsPerMonth;

  const usage = await client.usageRecord.findUnique({
    where: {
      organizationId_periodYear_periodMonth: {
        organizationId,
        periodYear,
        periodMonth,
      },
    },
  });

  const currentUsage = usage?.reviewCount || 0;
  const allowed = currentUsage < limit;
  const remaining = Math.max(0, limit - currentUsage);
  const percentage = Math.min(100, Math.round((currentUsage / limit) * 100));

  return {
    allowed,
    currentUsage,
    reviewsUsed: currentUsage,
    limit,
    reviewsLimit: limit,
    remaining,
    reviewsRemaining: remaining,
    plan,
    resetDate,
    percentage,
  };
}
