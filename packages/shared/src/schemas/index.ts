import { z } from 'zod';
import { FINDING_CATEGORIES, FINDING_SEVERITIES, REVIEW_STATUSES, ORG_ROLES, PLAN_TIERS } from '../constants';

export const FindingSeveritySchema = z.enum(FINDING_SEVERITIES);
export const FindingCategorySchema = z.enum(FINDING_CATEGORIES);
export const ReviewStatusSchema = z.enum(REVIEW_STATUSES);
export const OrgRoleSchema = z.enum(ORG_ROLES);
export const PlanTierSchema = z.enum(PLAN_TIERS);

// Schema for a single Review Finding (validated when parsed from AI or deterministic engine)
export const ReviewFindingSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 11)),
  category: FindingCategorySchema,
  severity: FindingSeveritySchema,
  confidence: z.number().min(0).max(100).default(85),
  filePath: z.string().min(1, 'File path is required'),
  startLine: z.number().int().positive('Start line must be positive'),
  endLine: z.number().int().positive('End line must be positive'),
  title: z.string().min(5, 'Title must be descriptive'),
  explanation: z.string().min(10, 'Explanation must describe the actual risk'),
  evidence: z.string().min(1, 'Evidence from code must be provided'),
  remediation: z.string().min(5, 'Actionable remediation required'),
  suggestedPatch: z.string().optional(),
  ruleId: z.string().optional(),
  source: z.enum(['DETERMINISTIC_STATIC', 'AI_ANALYSIS', 'SECURITY_SCAN']).default('AI_ANALYSIS'),
  dismissed: z.boolean().default(false),
  dismissReason: z.string().optional(),
});

export type ReviewFinding = z.infer<typeof ReviewFindingSchema>;

// Schema for the Overall AI Review Summary
export const ReviewSummarySchema = z.object({
  summary: z.string().min(10, 'Summary is required'),
  overallRisk: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE']),
  riskRationale: z.string(),
  keyStrengths: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  testCoverageAssessment: z.string(),
  estimatedReviewTimeSavedMinutes: z.number().min(0).default(15),
  findings: z.array(ReviewFindingSchema).default([]),
});

export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;

// Policy Schema
export const ReviewPolicySchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().optional(),
  repositoryId: z.string().optional(),
  enabledCategories: z.array(FindingCategorySchema).default([...FINDING_CATEGORIES]),
  severityThreshold: FindingSeveritySchema.default('MEDIUM'),
  blockPrOnCritical: z.boolean().default(true),
  autoPostInlineComments: z.boolean().default(true),
  autoCreateCheckRun: z.boolean().default(true),
  requireTestsForNewCode: z.boolean().default(true),
  maxDiffLines: z.number().int().default(4000),
  customInstructions: z.string().max(2000).optional().default(''),
  excludedPaths: z.array(z.string()).default([]),
});

export type ReviewPolicy = z.infer<typeof ReviewPolicySchema>;

// User Authentication & Profile
export const UserRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// Organization creation & invitation
export const CreateOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: OrgRoleSchema.default('MEMBER'),
});

// Pull Request & Review Triggering
export const TriggerReviewSchema = z.object({
  repositoryId: z.string(),
  pullNumber: z.number().int().positive(),
  commitSha: z.string().min(6),
  forceReReview: z.boolean().optional().default(false),
});

// Finding Dismissal / Feedback
export const FindingFeedbackSchema = z.object({
  findingId: z.string(),
  feedbackType: z.enum(['HELPFUL', 'FALSE_POSITIVE', 'MISLEADING', 'NOT_APPLICABLE']),
  comment: z.string().max(1000).optional(),
});
