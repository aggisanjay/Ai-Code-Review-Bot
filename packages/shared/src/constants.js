"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FILE_EXCLUSIONS = exports.PLAN_CONFIGS = exports.PLAN_TIERS = exports.ORG_ROLES = exports.REVIEW_STATUSES = exports.FINDING_CATEGORIES = exports.FINDING_SEVERITIES = exports.APP_TAGLINE = exports.APP_NAME = void 0;
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
