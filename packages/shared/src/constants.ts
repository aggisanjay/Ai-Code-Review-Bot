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
