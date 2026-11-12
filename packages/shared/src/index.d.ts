import { z } from 'zod';
export declare const APP_NAME = "ReviewFlow AI";
export declare const APP_TAGLINE = "Every pull request. Reviewed intelligently.";
export declare const FINDING_SEVERITIES: readonly ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];
export declare const FINDING_CATEGORIES: readonly ["SECURITY", "CORRECTNESS", "PERFORMANCE", "MAINTAINABILITY", "TESTING", "ARCHITECTURE"];
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];
export declare const REVIEW_STATUSES: readonly ["QUEUED", "FETCHING_DIFF", "ANALYZING", "VALIDATING", "PUBLISHING", "COMPLETED", "FAILED", "SUPERSEDED"];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export declare const ORG_ROLES: readonly ["OWNER", "ADMIN", "MEMBER"];
export type OrgRole = (typeof ORG_ROLES)[number];
export declare const PLAN_TIERS: readonly ["FREE", "PRO", "TEAM", "ENTERPRISE"];
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
export declare const PLAN_CONFIGS: Record<PlanTier, PlanLimits>;
export declare const DEFAULT_FILE_EXCLUSIONS: string[];
export declare const FindingSeveritySchema: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]>;
export declare const FindingCategorySchema: z.ZodEnum<["SECURITY", "CORRECTNESS", "PERFORMANCE", "MAINTAINABILITY", "TESTING", "ARCHITECTURE"]>;
export declare const ReviewStatusSchema: z.ZodEnum<["QUEUED", "FETCHING_DIFF", "ANALYZING", "VALIDATING", "PUBLISHING", "COMPLETED", "FAILED", "SUPERSEDED"]>;
export declare const OrgRoleSchema: z.ZodEnum<["OWNER", "ADMIN", "MEMBER"]>;
export declare const PlanTierSchema: z.ZodEnum<["FREE", "PRO", "TEAM", "ENTERPRISE"]>;
export declare const ReviewFindingSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    category: z.ZodEnum<["SECURITY", "CORRECTNESS", "PERFORMANCE", "MAINTAINABILITY", "TESTING", "ARCHITECTURE"]>;
    severity: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]>;
    confidence: z.ZodDefault<z.ZodNumber>;
    filePath: z.ZodString;
    startLine: z.ZodNumber;
    endLine: z.ZodNumber;
    title: z.ZodString;
    explanation: z.ZodString;
    evidence: z.ZodString;
    remediation: z.ZodString;
    suggestedPatch: z.ZodOptional<z.ZodString>;
    ruleId: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodEnum<["DETERMINISTIC_STATIC", "AI_ANALYSIS", "SECURITY_SCAN"]>>;
    dismissed: z.ZodDefault<z.ZodBoolean>;
    dismissReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    category: "SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE";
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    confidence: number;
    filePath: string;
    startLine: number;
    endLine: number;
    title: string;
    explanation: string;
    evidence: string;
    remediation: string;
    source: "DETERMINISTIC_STATIC" | "AI_ANALYSIS" | "SECURITY_SCAN";
    dismissed: boolean;
    suggestedPatch?: string | undefined;
    ruleId?: string | undefined;
    dismissReason?: string | undefined;
}, {
    category: "SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE";
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    filePath: string;
    startLine: number;
    endLine: number;
    title: string;
    explanation: string;
    evidence: string;
    remediation: string;
    id?: string | undefined;
    confidence?: number | undefined;
    suggestedPatch?: string | undefined;
    ruleId?: string | undefined;
    source?: "DETERMINISTIC_STATIC" | "AI_ANALYSIS" | "SECURITY_SCAN" | undefined;
    dismissed?: boolean | undefined;
    dismissReason?: string | undefined;
}>;
export type ReviewFinding = z.infer<typeof ReviewFindingSchema>;
export declare const ReviewSummarySchema: z.ZodObject<{
    summary: z.ZodString;
    overallRisk: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "SAFE"]>;
    riskRationale: z.ZodString;
    keyStrengths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    blockers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    testCoverageAssessment: z.ZodString;
    estimatedReviewTimeSavedMinutes: z.ZodDefault<z.ZodNumber>;
    findings: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodDefault<z.ZodString>;
        category: z.ZodEnum<["SECURITY", "CORRECTNESS", "PERFORMANCE", "MAINTAINABILITY", "TESTING", "ARCHITECTURE"]>;
        severity: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]>;
        confidence: z.ZodDefault<z.ZodNumber>;
        filePath: z.ZodString;
        startLine: z.ZodNumber;
        endLine: z.ZodNumber;
        title: z.ZodString;
        explanation: z.ZodString;
        evidence: z.ZodString;
        remediation: z.ZodString;
        suggestedPatch: z.ZodOptional<z.ZodString>;
        ruleId: z.ZodOptional<z.ZodString>;
        source: z.ZodDefault<z.ZodEnum<["DETERMINISTIC_STATIC", "AI_ANALYSIS", "SECURITY_SCAN"]>>;
        dismissed: z.ZodDefault<z.ZodBoolean>;
        dismissReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        category: "SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE";
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
        confidence: number;
        filePath: string;
        startLine: number;
        endLine: number;
        title: string;
        explanation: string;
        evidence: string;
        remediation: string;
        source: "DETERMINISTIC_STATIC" | "AI_ANALYSIS" | "SECURITY_SCAN";
        dismissed: boolean;
        suggestedPatch?: string | undefined;
        ruleId?: string | undefined;
        dismissReason?: string | undefined;
    }, {
        category: "SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE";
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
        filePath: string;
        startLine: number;
        endLine: number;
        title: string;
        explanation: string;
        evidence: string;
        remediation: string;
        id?: string | undefined;
        confidence?: number | undefined;
        suggestedPatch?: string | undefined;
        ruleId?: string | undefined;
        source?: "DETERMINISTIC_STATIC" | "AI_ANALYSIS" | "SECURITY_SCAN" | undefined;
        dismissed?: boolean | undefined;
        dismissReason?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    summary: string;
    overallRisk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
    riskRationale: string;
    keyStrengths: string[];
    blockers: string[];
    testCoverageAssessment: string;
    estimatedReviewTimeSavedMinutes: number;
    findings: {
        id: string;
        category: "SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE";
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
        confidence: number;
        filePath: string;
        startLine: number;
        endLine: number;
        title: string;
        explanation: string;
        evidence: string;
        remediation: string;
        source: "DETERMINISTIC_STATIC" | "AI_ANALYSIS" | "SECURITY_SCAN";
        dismissed: boolean;
        suggestedPatch?: string | undefined;
        ruleId?: string | undefined;
        dismissReason?: string | undefined;
    }[];
}, {
    summary: string;
    overallRisk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
    riskRationale: string;
    testCoverageAssessment: string;
    keyStrengths?: string[] | undefined;
    blockers?: string[] | undefined;
    estimatedReviewTimeSavedMinutes?: number | undefined;
    findings?: {
        category: "SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE";
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
        filePath: string;
        startLine: number;
        endLine: number;
        title: string;
        explanation: string;
        evidence: string;
        remediation: string;
        id?: string | undefined;
        confidence?: number | undefined;
        suggestedPatch?: string | undefined;
        ruleId?: string | undefined;
        source?: "DETERMINISTIC_STATIC" | "AI_ANALYSIS" | "SECURITY_SCAN" | undefined;
        dismissed?: boolean | undefined;
        dismissReason?: string | undefined;
    }[] | undefined;
}>;
export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;
export declare const ReviewPolicySchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    repositoryId: z.ZodOptional<z.ZodString>;
    enabledCategories: z.ZodDefault<z.ZodArray<z.ZodEnum<["SECURITY", "CORRECTNESS", "PERFORMANCE", "MAINTAINABILITY", "TESTING", "ARCHITECTURE"]>, "many">>;
    severityThreshold: z.ZodDefault<z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]>>;
    blockPrOnCritical: z.ZodDefault<z.ZodBoolean>;
    autoPostInlineComments: z.ZodDefault<z.ZodBoolean>;
    autoCreateCheckRun: z.ZodDefault<z.ZodBoolean>;
    requireTestsForNewCode: z.ZodDefault<z.ZodBoolean>;
    maxDiffLines: z.ZodDefault<z.ZodNumber>;
    customInstructions: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    excludedPaths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    enabledCategories: ("SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE")[];
    severityThreshold: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    blockPrOnCritical: boolean;
    autoPostInlineComments: boolean;
    autoCreateCheckRun: boolean;
    requireTestsForNewCode: boolean;
    maxDiffLines: number;
    customInstructions: string;
    excludedPaths: string[];
    id?: string | undefined;
    organizationId?: string | undefined;
    repositoryId?: string | undefined;
}, {
    id?: string | undefined;
    organizationId?: string | undefined;
    repositoryId?: string | undefined;
    enabledCategories?: ("SECURITY" | "CORRECTNESS" | "PERFORMANCE" | "MAINTAINABILITY" | "TESTING" | "ARCHITECTURE")[] | undefined;
    severityThreshold?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" | undefined;
    blockPrOnCritical?: boolean | undefined;
    autoPostInlineComments?: boolean | undefined;
    autoCreateCheckRun?: boolean | undefined;
    requireTestsForNewCode?: boolean | undefined;
    maxDiffLines?: number | undefined;
    customInstructions?: string | undefined;
    excludedPaths?: string[] | undefined;
}>;
export type ReviewPolicy = z.infer<typeof ReviewPolicySchema>;
export declare const UserRegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
}, {
    email: string;
    password: string;
    name: string;
}>;
export declare const UserLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const CreateOrgSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
}, {
    name: string;
    slug: string;
}>;
export declare const InviteMemberSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["OWNER", "ADMIN", "MEMBER"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
}, {
    email: string;
    role?: "OWNER" | "ADMIN" | "MEMBER" | undefined;
}>;
export declare const TriggerReviewSchema: z.ZodObject<{
    repositoryId: z.ZodString;
    pullNumber: z.ZodNumber;
    commitSha: z.ZodString;
    forceReReview: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    repositoryId: string;
    pullNumber: number;
    commitSha: string;
    forceReReview: boolean;
}, {
    repositoryId: string;
    pullNumber: number;
    commitSha: string;
    forceReReview?: boolean | undefined;
}>;
export declare const FindingFeedbackSchema: z.ZodObject<{
    findingId: z.ZodString;
    feedbackType: z.ZodEnum<["HELPFUL", "FALSE_POSITIVE", "MISLEADING", "NOT_APPLICABLE"]>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    findingId: string;
    feedbackType: "HELPFUL" | "FALSE_POSITIVE" | "MISLEADING" | "NOT_APPLICABLE";
    comment?: string | undefined;
}, {
    findingId: string;
    feedbackType: "HELPFUL" | "FALSE_POSITIVE" | "MISLEADING" | "NOT_APPLICABLE";
    comment?: string | undefined;
}>;
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
    reviewsTrend: Array<{
        date: string;
        reviewsCount: number;
        findingsCount: number;
    }>;
    topVulnerableRepositories: Array<{
        repoName: string;
        criticalCount: number;
        totalCount: number;
    }>;
}
export interface WebhookEventPayload {
    action: string;
    repository: {
        id: number;
        full_name: string;
        name: string;
        owner: {
            login: string;
        };
        default_branch: string;
        private: boolean;
    };
    pull_request?: {
        id: number;
        number: number;
        title: string;
        state: string;
        user: {
            login: string;
            avatar_url?: string;
        };
        base: {
            ref: string;
            sha: string;
        };
        head: {
            ref: string;
            sha: string;
        };
        diff_url: string;
    };
    installation?: {
        id: number;
    };
    sender?: {
        login: string;
    };
}
