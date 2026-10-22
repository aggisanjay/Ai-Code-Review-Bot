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

export interface GitHubAppInfo {
  id: number;
  slug: string;
  name: string;
  htmlUrl: string;
  installUrl: string;
}

export interface RepositoryTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface FileContentResult {
  content: string;
  encoding: string;
  sha: string;
  size: number;
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
  getAppInfo?(): Promise<GitHubAppInfo>;
  fetchRepositoryTree(
    owner: string,
    repo: string,
    treeSha?: string,
    recursive?: boolean
  ): Promise<RepositoryTreeItem[]>;
  fetchFileContent(
    owner: string,
    repo: string,
    filePath: string,
    ref?: string
  ): Promise<FileContentResult>;
  createBranch?(
    owner: string,
    repo: string,
    branchName: string,
    fromSha: string
  ): Promise<{ ref: string; sha: string }>;
  commitFileChanges?(
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: Array<{ path: string; content: string }>
  ): Promise<{ commitSha: string }>;
  createPullRequest?(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<PullRequestDetails>;
  getLatestCommitSha?(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<string>;
}

