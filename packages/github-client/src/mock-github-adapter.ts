import {
  IGitHubAdapter,
  PullRequestDetails,
  ReviewCommentPayload,
  CheckRunUpdateParams,
  GitHubPullRequestSummary,
  GitHubAppInfo,
  RepositoryTreeItem,
  FileContentResult,
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

  async fetchRepositoryTree(
    _owner: string,
    _repo: string,
    _treeSha: string = 'HEAD',
    _recursive: boolean = true
  ): Promise<RepositoryTreeItem[]> {
    return [
      { path: 'src/main.ts', mode: '100644', type: 'blob', sha: 'sha_main_ts_1', size: 1200 },
      { path: 'src/services/token.service.ts', mode: '100644', type: 'blob', sha: 'sha_token_ts_1', size: 2400 },
      { path: 'src/services/session.service.ts', mode: '100644', type: 'blob', sha: 'sha_session_ts_1', size: 1800 },
      { path: 'src/controllers/auth.controller.ts', mode: '100644', type: 'blob', sha: 'sha_auth_ts_1', size: 3100 },
      { path: 'tests/unit/token.service.test.ts', mode: '100644', type: 'blob', sha: 'sha_test_ts_1', size: 1500 },
      { path: 'README.md', mode: '100644', type: 'blob', sha: 'sha_readme_1', size: 850 },
    ];
  }

  async fetchFileContent(
    _owner: string,
    _repo: string,
    filePath: string,
    _ref?: string
  ): Promise<FileContentResult> {
    const mockFiles: Record<string, string> = {
      'src/main.ts': `import express from 'express';\nimport { authRouter } from './controllers/auth.controller';\n\nconst app = express();\napp.use(express.json());\napp.use('/auth', authRouter);\napp.listen(4000);\n`,
      'src/services/token.service.ts': `import jwt from 'jsonwebtoken';\n\nexport class TokenService {\n  signAccessToken(userId: string) {\n    return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });\n  }\n\n  verifyRefreshToken(token: string) {\n    const secret = process.env.JWT_REFRESH_SECRET || 'default-secret-do-not-use-in-prod';\n    return jwt.verify(token, secret);\n  }\n}\n`,
      'src/services/session.service.ts': `import Redis from 'ioredis';\nconst redis = new Redis();\n\nexport class SessionService {\n  async revokeSession(tokenId: string) {\n    const isRevoked = await redis.get(\`blacklist:\${tokenId}\`);\n    if (isRevoked) throw new Error('Revoked');\n    await redis.set(\`blacklist:\${tokenId}\`, '1');\n  }\n}\n`,
      'src/controllers/auth.controller.ts': `import { TokenService } from '../services/token.service';\nconst tokenService = new TokenService();\n\nexport async function handleLogin(req: any, res: any) {\n  const token = tokenService.signAccessToken(req.body.userId);\n  res.json({ token });\n}\n`,
      'tests/unit/token.service.test.ts': `import { describe, it } from 'node:test';\nimport assert from 'node:assert';\nimport { TokenService } from '../../src/services/token.service';\n\ndescribe('TokenService', () => {\n  it('generates token for user', () => {\n    const service = new TokenService();\n    const token = service.signAccessToken('user-1');\n    assert.ok(token);\n  });\n});\n`,
      'README.md': `# Mock Service\nSample repository for ReviewFlow AI verification.\n`,
    };

    const content = mockFiles[filePath] || `// Source code for ${filePath}\nexport const placeholder = true;\n`;
    return {
      content,
      encoding: 'utf8',
      sha: `sha_${Buffer.from(filePath).toString('hex').slice(0, 10)}`,
      size: content.length,
    };
  }

  async getLatestCommitSha(_owner: string, _repo: string, _branch: string = 'HEAD'): Promise<string> {
    return '8f7a1c3e90b2d4f8a1e2c3b4a5d6e7f8a9b0c1d2';
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromSha: string
  ): Promise<{ ref: string; sha: string }> {
    console.log(`[MockGitHub] Created branch ${branchName} on ${owner}/${repo} from ${fromSha.substring(0, 7)}`);
    return { ref: `refs/heads/${branchName}`, sha: fromSha };
  }

  async commitFileChanges(
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: Array<{ path: string; content: string }>
  ): Promise<{ commitSha: string }> {
    const commitSha = `mock_commit_${Date.now().toString(16)}`;
    console.log(`[MockGitHub] Committed ${files.length} files to ${owner}/${repo}@${branch} ("${message}"): ${commitSha}`);
    return { commitSha };
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<PullRequestDetails> {
    const prNumber = Math.floor(Math.random() * 800) + 200;
    console.log(`[MockGitHub] Created Pull Request #${prNumber} on ${owner}/${repo}: "${title}" (${head} -> ${base})`);
    return {
      id: 992000 + prNumber,
      number: prNumber,
      title,
      body,
      state: 'open',
      user: { login: 'reviewflow-ai[bot]', avatarUrl: 'https://github.com/identicons/reviewflow.png' },
      head: { ref: head, sha: '8f7a1c3e90b2d4f8a1e2c3b4a5d6e7f8a9b0c1d2' },
      base: { ref: base, sha: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' },
    };
  }

  getHistory() {
    return {
      postedReviews: this.postedReviews,
      checkRuns: Array.from(this.checkRuns.entries()),
    };
  }
}
