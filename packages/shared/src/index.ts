import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

export const APP_NAME = 'ReviewFlow AI';
export const APP_TAGLINE = 'Every pull request. Reviewed intelligently.';

export const FINDING_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const FINDING_CATEGORIES = [
  'SECURITY',
  'CORRECTNESS',
  'PERFORMANCE',
  'MAINTAINABILITY',
  'TESTING',
  'ARCHITECTURE'
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const REVIEW_STATUSES = [
  'QUEUED',
  'FETCHING_DIFF',
  'ANALYZING',
  'VALIDATING',
  'PUBLISHING',
  'COMPLETED',
  'FAILED',
  'SUPERSEDED'
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const ORG_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PLAN_TIERS = ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export interface PlanLimits {
  name: string;
  maxRepositories: number;
  maxReviewsPerMonth: number;
  maxQnaQueriesPerMonth: number;
  maxMembers: number;
  advancedSecurityChecks: boolean;
  customRules: boolean;
  priorityQueue: boolean;
  inlineCommentsEnabled: boolean;
  priceMonthlyUsd: number;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanLimits> = {
  FREE: {
    name: 'Free Starter',
    maxRepositories: 3,
    maxReviewsPerMonth: 25,
    maxQnaQueriesPerMonth: 100,
    maxMembers: 2,
    advancedSecurityChecks: false,
    customRules: false,
    priorityQueue: false,
    inlineCommentsEnabled: true,
    priceMonthlyUsd: 0,
  },
  PRO: {
    name: 'Pro Developer',
    maxRepositories: 15,
    maxReviewsPerMonth: 500,
    maxQnaQueriesPerMonth: 2500,
    maxMembers: 10,
    advancedSecurityChecks: true,
    customRules: true,
    priorityQueue: true,
    inlineCommentsEnabled: true,
    priceMonthlyUsd: 29,
  },
  TEAM: {
    name: 'Engineering Team',
    maxRepositories: 50,
    maxReviewsPerMonth: 2500,
    maxQnaQueriesPerMonth: 10000,
    maxMembers: 30,
    advancedSecurityChecks: true,
    customRules: true,
    priorityQueue: true,
    inlineCommentsEnabled: true,
    priceMonthlyUsd: 99,
  },
  ENTERPRISE: {
    name: 'Enterprise Scale',
    maxRepositories: 9999,
    maxReviewsPerMonth: 99999,
    maxQnaQueriesPerMonth: 50000,
    maxMembers: 999,
    advancedSecurityChecks: true,
    customRules: true,
    priorityQueue: true,
    inlineCommentsEnabled: true,
    priceMonthlyUsd: 499,
  },
};

export const DEFAULT_FILE_EXCLUSIONS = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '*.min.js',
  '*.min.css',
  '*.map',
  'dist/**',
  'build/**',
  '.next/**',
  'node_modules/**',
  'coverage/**',
  '*.svg',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.webp',
  '*.ico',
  '*.pdf',
  '*.woff',
  '*.woff2'
];

// ============================================================================
// SCHEMAS
// ============================================================================

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

// ============================================================================
// TYPES & DTOS
// ============================================================================

export interface UserSession {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  activeOrganizationId: string;
  role: OrgRole;
}

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  createdAt: string;
  membersCount: number;
  repositoriesCount: number;
}

export interface RepositoryDto {
  id: string;
  organizationId: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  owner: string;
  defaultBranch: string;
  isPrivate: boolean;
  isActive: boolean;
  autoReviewEnabled: boolean;
  lastReviewAt?: string;
  createdAt: string;
}

export interface PullRequestDto {
  id: string;
  repositoryId: string;
  repoFullName: string;
  number: number;
  title: string;
  author: string;
  authorAvatarUrl?: string;
  baseBranch: string;
  headBranch: string;
  headSha: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  latestReviewStatus?: ReviewStatus;
  findingCounts?: Record<FindingSeverity, number>;
  totalFindingsCount?: number;
  updatedAt: string;
  createdAt: string;
}

export interface ReviewJobDto {
  id: string;
  pullRequestId: string;
  commitSha: string;
  status: ReviewStatus;
  progressPercent: number;
  statusMessage?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  tokensUsed?: number;
  estimatedCostUsd?: number;
  summary?: ReviewSummary;
  findings: ReviewFinding[];
  publishedToGitHub: boolean;
  githubCheckRunUrl?: string;
}

export interface AnalyticsOverviewDto {
  totalReviews: number;
  totalFindings: number;
  criticalIssuesPrevented: number;
  averageReviewDurationSeconds: number;
  timeSavedHours: number;
  severityDistribution: Record<FindingSeverity, number>;
  categoryDistribution: Record<FindingCategory, number>;
  reviewsTrend: Array<{ date: string; reviewsCount: number; findingsCount: number }>;
  topVulnerableRepositories: Array<{ repoName: string; criticalCount: number; totalCount: number }>;
}

export interface WebhookEventPayload {
  action: string;
  repository: {
    id: number;
    full_name: string;
    name: string;
    owner: { login: string };
    default_branch: string;
    private: boolean;
  };
  pull_request?: {
    id: number;
    number: number;
    title: string;
    state: string;
    user: { login: string; avatar_url?: string };
    base: { ref: string; sha: string };
    head: { ref: string; sha: string };
    diff_url: string;
  };
  installation?: {
    id: number;
  };
  sender?: {
    login: string;
  };
}
