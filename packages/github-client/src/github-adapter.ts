export interface PullRequestDetails {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  user: { login: string; avatarUrl?: string };
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
}

export interface ReviewCommentPayload {
  path: string;
  line: number;
  body: string;
}

export interface CheckRunUpdateParams {
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'action_required';
  title: string;
  summary: string;
  text?: string;
}

export interface GitHubPullRequestSummary {
  id: number;
  number: number;
  title: string;
  author: string;
  authorAvatarUrl?: string;
  sourceBranch: string;
  targetBranch: string;
  headSha: string;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface IGitHubAdapter {
  fetchPullRequest(owner: string, repo: string, pullNumber: number): Promise<PullRequestDetails>;
  fetchPullRequestDiff(owner: string, repo: string, pullNumber: number): Promise<string>;
  createCheckRun(owner: string, repo: string, commitSha: string, name: string): Promise<string>;
  updateCheckRun(owner: string, repo: string, checkRunId: string, params: CheckRunUpdateParams): Promise<void>;
  postReview(
    owner: string,
    repo: string,
    pullNumber: number,
    commitSha: string,
    summaryBody: string,
    comments: ReviewCommentPayload[]
  ): Promise<{ reviewId: string; commentsCount: number }>;
  listPullRequests(
    owner: string,
    repo: string,
    state?: 'open' | 'closed' | 'all',
    page?: number,
    perPage?: number
  ): Promise<GitHubPullRequestSummary[]>;
}
