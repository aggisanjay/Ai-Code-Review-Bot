import {
  FindingSeverity,
  FindingCategory,
  ReviewStatus,
  OrgRole,
  PlanTier,
  PlanLimits,
} from '../constants';
import { ReviewFinding, ReviewSummary, ReviewPolicy } from '../schemas';

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
