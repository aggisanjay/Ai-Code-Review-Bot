import {
  IGitHubAdapter,
  PullRequestDetails,
  ReviewCommentPayload,
  CheckRunUpdateParams,
  GitHubPullRequestSummary,
  GitHubAppInfo,
} from './github-adapter';

export const SAMPLE_DIFF_JWT_AUTH = `diff --git a/src/services/token.service.ts b/src/services/token.service.ts
index 1029384..5647382 100644
--- a/src/services/token.service.ts
+++ b/src/services/token.service.ts
@@ -38,10 +38,13 @@ export class TokenService {
   }

   verifyRefreshToken(token: string) {
-    const secret = process.env.JWT_REFRESH_SECRET;
-    if (!secret) throw new Error("Missing secret");
+    // Fallback secret for staging tests
+    const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";
     return jwt.verify(token, secret);
   }
 }
diff --git a/src/services/session.service.ts b/src/services/session.service.ts
index 7891234..8912345 100644
--- a/src/services/session.service.ts
+++ b/src/services/session.service.ts
@@ -108,12 +108,18 @@ export class SessionService {
   async revokeSession(tokenId: string) {
+    const isRevoked = await redis.get(\`blacklist:\${tokenId}\`);
+    if (isRevoked) throw new UnauthorizedException();
+    // TOCTOU vulnerability here
+    await redis.set(\`blacklist:\${tokenId}\`, "1");
   }
 }
diff --git a/src/controllers/auth.controller.ts b/src/controllers/auth.controller.ts
index 3456789..4567890 100644
--- a/src/controllers/auth.controller.ts
+++ b/src/controllers/auth.controller.ts
@@ -75,6 +75,12 @@ export class AuthController {
+  @Post("refresh")
+  async refreshToken(@Req() req: Request, @Res() res: Response) {
+    const { token } = req.body;
+    return this.tokenService.verifyRefreshToken(token);
+  }
 }
`;

export class MockGitHubAdapter implements IGitHubAdapter {
  private postedReviews: Array<{ pullNumber: number; summary: string; comments: ReviewCommentPayload[] }> = [];
  private checkRuns: Map<string, { name: string; status: string; conclusion?: string }> = new Map();
  private mockPullRequests: Map<number, GitHubPullRequestSummary> = new Map();

  constructor() {
    this.addMockPullRequest({
      id: 991142,
      number: 142,
      title: 'feat(auth): Add JWT refresh token rotation and cookie session handler',
      author: 'sarah-dev',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      sourceBranch: 'feat/refresh-tokens',
      targetBranch: 'main',
      headSha: '8f7a1c3e90b2d4f8a1e2c3b4a5d6e7f8a9b0c1d2',
      state: 'open',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    });
  }

  public addMockPullRequest(pr: GitHubPullRequestSummary) {
    this.mockPullRequests.set(pr.number, pr);
  }

  async listPullRequests(
    _owner: string,
    _repo: string,
    state: 'open' | 'closed' | 'all' = 'open',
    _page: number = 1,
    _perPage: number = 30
  ): Promise<GitHubPullRequestSummary[]> {
    const list = Array.from(this.mockPullRequests.values());
    if (state === 'all') return list;
    return list.filter((p) => p.state === state);
  }

  async fetchPullRequest(owner: string, repo: string, pullNumber: number): Promise<PullRequestDetails> {
    const mock = this.mockPullRequests.get(pullNumber);
    if (mock) {
      return {
        id: mock.id,
        number: mock.number,
        title: mock.title,
        body: 'Automated pull request imported for ReviewFlow AI verification.',
        state: mock.state,
        user: { login: mock.author, avatarUrl: mock.authorAvatarUrl },
        head: { ref: mock.sourceBranch, sha: mock.headSha },
        base: { ref: mock.targetBranch, sha: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' },
      };
    }
    return {
      id: 991000 + pullNumber,
      number: pullNumber,
      title: pullNumber === 142
        ? 'feat(auth): Add JWT refresh token rotation and cookie session handler'
        : `Sample Pull Request #${pullNumber}`,
      body: 'Automated pull request imported for ReviewFlow AI verification.',
      state: 'open',
      user: { login: 'sarah-dev', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      head: { ref: 'feat/refresh-tokens', sha: '8f7a1c3e90b2d4f8a1e2c3b4a5d6e7f8a9b0c1d2' },
      base: { ref: 'main', sha: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' },
    };
  }

  async fetchPullRequestDiff(_owner: string, _repo: string, _pullNumber: number): Promise<string> {
    return SAMPLE_DIFF_JWT_AUTH;
  }

  async createCheckRun(owner: string, repo: string, commitSha: string, name: string): Promise<string> {
    const checkRunId = `mock_check_${Date.now()}`;
    this.checkRuns.set(checkRunId, { name, status: 'in_progress' });
    console.log(`[MockGitHub] Created check run "${name}" for ${owner}/${repo}@${commitSha.substring(0, 7)} (ID: ${checkRunId})`);
    return checkRunId;
  }

  async updateCheckRun(owner: string, repo: string, checkRunId: string, params: CheckRunUpdateParams): Promise<void> {
    const check = this.checkRuns.get(checkRunId) || { name: 'ReviewFlow AI', status: 'queued' };
    check.status = params.status;
    check.conclusion = params.conclusion;
    this.checkRuns.set(checkRunId, check);
    console.log(`[MockGitHub] Updated check run ${checkRunId} -> ${params.status} (${params.conclusion || 'pending'}): ${params.title}`);
  }

  async postReview(
    owner: string,
    repo: string,
    pullNumber: number,
    commitSha: string,
    summaryBody: string,
    comments: ReviewCommentPayload[]
  ): Promise<{ reviewId: string; commentsCount: number }> {
    const reviewId = `mock_review_${Date.now()}`;
    this.postedReviews.push({ pullNumber, summary: summaryBody, comments });
    console.log(`[MockGitHub] Posted review ${reviewId} on ${owner}/${repo}#${pullNumber} with ${comments.length} inline comments.`);
    return { reviewId, commentsCount: comments.length };
  }

  async getAppInfo(): Promise<GitHubAppInfo> {
    return {
      id: 5282602,
      slug: 'reviewflow-ai',
      name: 'ReviewFlow AI',
      htmlUrl: 'https://github.com/apps/reviewflow-ai',
      installUrl: 'https://github.com/apps/reviewflow-ai/installations/new',
    };
  }

  getHistory() {
    return {
      postedReviews: this.postedReviews,
      checkRuns: Array.from(this.checkRuns.entries()),
    };
  }
}
