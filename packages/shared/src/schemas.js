"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindingFeedbackSchema = exports.TriggerReviewSchema = exports.InviteMemberSchema = exports.CreateOrgSchema = exports.UserLoginSchema = exports.UserRegisterSchema = exports.ReviewPolicySchema = exports.ReviewSummarySchema = exports.ReviewFindingSchema = exports.PlanTierSchema = exports.OrgRoleSchema = exports.ReviewStatusSchema = exports.FindingCategorySchema = exports.FindingSeveritySchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
exports.FindingSeveritySchema = zod_1.z.enum(constants_1.FINDING_SEVERITIES);
exports.FindingCategorySchema = zod_1.z.enum(constants_1.FINDING_CATEGORIES);
exports.ReviewStatusSchema = zod_1.z.enum(constants_1.REVIEW_STATUSES);
exports.OrgRoleSchema = zod_1.z.enum(constants_1.ORG_ROLES);
exports.PlanTierSchema = zod_1.z.enum(constants_1.PLAN_TIERS);
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
    enabledCategories: zod_1.z.array(exports.FindingCategorySchema).default([...constants_1.FINDING_CATEGORIES]),
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
    feedbackType: zod_1.z.enum([
        'HELPFUL',
        'FALSE_POSITIVE',
        'DUPLICATE',
        'NOT_APPLICABLE',
        'ALREADY_KNOWN',
        'MISLEADING',
    ]),
    comment: zod_1.z.string().max(1000).optional(),
});
