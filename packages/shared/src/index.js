"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindingFeedbackSchema = exports.TriggerReviewSchema = exports.InviteMemberSchema = exports.CreateOrgSchema = exports.UserLoginSchema = exports.UserRegisterSchema = exports.ReviewPolicySchema = exports.ReviewSummarySchema = exports.ReviewFindingSchema = exports.PlanTierSchema = exports.OrgRoleSchema = exports.ReviewStatusSchema = exports.FindingCategorySchema = exports.FindingSeveritySchema = exports.DEFAULT_FILE_EXCLUSIONS = exports.PLAN_CONFIGS = exports.PLAN_TIERS = exports.ORG_ROLES = exports.REVIEW_STATUSES = exports.FINDING_CATEGORIES = exports.FINDING_SEVERITIES = exports.APP_TAGLINE = exports.APP_NAME = void 0;
const zod_1 = require("zod");
// ============================================================================
// CONSTANTS
// ============================================================================
exports.APP_NAME = 'ReviewFlow AI';
exports.APP_TAGLINE = 'Every pull request. Reviewed intelligently.';
exports.FINDING_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
exports.FINDING_CATEGORIES = [
    'SECURITY',
    'CORRECTNESS',
    'PERFORMANCE',
    'MAINTAINABILITY',
    'TESTING',
    'ARCHITECTURE'
];
exports.REVIEW_STATUSES = [
    'QUEUED',
    'FETCHING_DIFF',
    'ANALYZING',
    'VALIDATING',
    'PUBLISHING',
    'COMPLETED',
    'FAILED',
    'SUPERSEDED'
];
exports.ORG_ROLES = ['OWNER', 'ADMIN', 'MEMBER'];
exports.PLAN_TIERS = ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'];
exports.PLAN_CONFIGS = {
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
exports.DEFAULT_FILE_EXCLUSIONS = [
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
exports.FindingSeveritySchema = zod_1.z.enum(exports.FINDING_SEVERITIES);
exports.FindingCategorySchema = zod_1.z.enum(exports.FINDING_CATEGORIES);
exports.ReviewStatusSchema = zod_1.z.enum(exports.REVIEW_STATUSES);
exports.OrgRoleSchema = zod_1.z.enum(exports.ORG_ROLES);
exports.PlanTierSchema = zod_1.z.enum(exports.PLAN_TIERS);
// Schema for a single Review Finding (validated when parsed from AI or deterministic engine)
exports.ReviewFindingSchema = zod_1.z.object({
    id: zod_1.z.string().default(() => Math.random().toString(36).substring(2, 11)),
    category: exports.FindingCategorySchema,
    severity: exports.FindingSeveritySchema,
    confidence: zod_1.z.number().min(0).max(100).default(85),
    filePath: zod_1.z.string().min(1, 'File path is required'),
    startLine: zod_1.z.number().int().positive('Start line must be positive'),
    endLine: zod_1.z.number().int().positive('End line must be positive'),
    title: zod_1.z.string().min(5, 'Title must be descriptive'),
    explanation: zod_1.z.string().min(10, 'Explanation must describe the actual risk'),
    evidence: zod_1.z.string().min(1, 'Evidence from code must be provided'),
    remediation: zod_1.z.string().min(5, 'Actionable remediation required'),
    suggestedPatch: zod_1.z.string().optional(),
    ruleId: zod_1.z.string().optional(),
    source: zod_1.z.enum(['DETERMINISTIC_STATIC', 'AI_ANALYSIS', 'SECURITY_SCAN']).default('AI_ANALYSIS'),
    dismissed: zod_1.z.boolean().default(false),
    dismissReason: zod_1.z.string().optional(),
});
// Schema for the Overall AI Review Summary
exports.ReviewSummarySchema = zod_1.z.object({
    summary: zod_1.z.string().min(10, 'Summary is required'),
    overallRisk: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE']),
    riskRationale: zod_1.z.string(),
    keyStrengths: zod_1.z.array(zod_1.z.string()).default([]),
    blockers: zod_1.z.array(zod_1.z.string()).default([]),
    testCoverageAssessment: zod_1.z.string(),
    estimatedReviewTimeSavedMinutes: zod_1.z.number().min(0).default(15),
    findings: zod_1.z.array(exports.ReviewFindingSchema).default([]),
});
// Policy Schema
exports.ReviewPolicySchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().optional(),
    repositoryId: zod_1.z.string().optional(),
    enabledCategories: zod_1.z.array(exports.FindingCategorySchema).default([...exports.FINDING_CATEGORIES]),
    severityThreshold: exports.FindingSeveritySchema.default('MEDIUM'),
    blockPrOnCritical: zod_1.z.boolean().default(true),
    autoPostInlineComments: zod_1.z.boolean().default(true),
    autoCreateCheckRun: zod_1.z.boolean().default(true),
    requireTestsForNewCode: zod_1.z.boolean().default(true),
    maxDiffLines: zod_1.z.number().int().default(25000),
    customInstructions: zod_1.z.string().max(2000).optional().default(''),
    excludedPaths: zod_1.z.array(zod_1.z.string()).default([]),
});
// User Authentication & Profile
exports.UserRegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
});
exports.UserLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Organization creation & invitation
exports.CreateOrgSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Organization name must be at least 2 characters'),
    slug: zod_1.z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});
exports.InviteMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    role: exports.OrgRoleSchema.default('MEMBER'),
});
// Pull Request & Review Triggering
exports.TriggerReviewSchema = zod_1.z.object({
    repositoryId: zod_1.z.string(),
    pullNumber: zod_1.z.number().int().positive(),
    commitSha: zod_1.z.string().min(6),
    forceReReview: zod_1.z.boolean().optional().default(false),
});
// Finding Dismissal / Feedback
exports.FindingFeedbackSchema = zod_1.z.object({
    findingId: zod_1.z.string(),
    feedbackType: zod_1.z.enum(['HELPFUL', 'FALSE_POSITIVE', 'MISLEADING', 'NOT_APPLICABLE']),
    comment: zod_1.z.string().max(1000).optional(),
});
