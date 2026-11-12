import { z } from 'zod';
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
    feedbackType: z.ZodEnum<["HELPFUL", "FALSE_POSITIVE", "DUPLICATE", "NOT_APPLICABLE", "ALREADY_KNOWN", "MISLEADING"]>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    findingId: string;
    feedbackType: "HELPFUL" | "FALSE_POSITIVE" | "MISLEADING" | "NOT_APPLICABLE" | "DUPLICATE" | "ALREADY_KNOWN";
    comment?: string | undefined;
}, {
    findingId: string;
    feedbackType: "HELPFUL" | "FALSE_POSITIVE" | "MISLEADING" | "NOT_APPLICABLE" | "DUPLICATE" | "ALREADY_KNOWN";
    comment?: string | undefined;
}>;
