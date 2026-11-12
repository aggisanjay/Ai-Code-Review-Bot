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
