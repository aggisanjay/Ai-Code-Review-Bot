import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import {
  IGitHubAdapter,
  PullRequestDetails,
  CheckRunUpdateParams,
  ReviewCommentPayload,
} from './github-adapter';

export interface GitHubAppClientOptions {
  appId: string | number;
  privateKey: string;
  installationId?: number;
}

export class GitHubAppClient implements IGitHubAdapter {
  private appId: string | number;
  private privateKey: string;
  private installationId?: number;

  constructor(options: GitHubAppClientOptions) {
    if (!options.appId || !options.privateKey) {
      throw new Error(
        'GitHubAppClient configuration error: GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be specified in real mode.'
      );
    }

    // Clean escaped newlines if passed through environment variables
    const formattedPrivateKey = options.privateKey.includes('\\n')
      ? options.privateKey.replace(/\\n/g, '\n')
      : options.privateKey;

    if (!formattedPrivateKey.includes('BEGIN') || !formattedPrivateKey.includes('PRIVATE KEY')) {
      throw new Error(
        'GitHubAppClient configuration error: GITHUB_PRIVATE_KEY is not a valid RSA Private Key (PEM format required).'
      );
    }

    this.appId = options.appId;
    this.privateKey = formattedPrivateKey;
    this.installationId = options.installationId;
  }

  /**
   * Instantiate an authenticated Octokit instance for a specific installation
   */
  public getInstallationOctokit(installationId?: number): Octokit {
    const targetInstallationId = installationId || this.installationId;
    if (!targetInstallationId) {
      throw new Error(
        'GitHubAppClient error: installationId is required to perform repository operations.'
      );
    }

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId: targetInstallationId,
      },
    });
  }

  /**
   * Instantiate an authenticated Octokit instance as the GitHub App itself (JWT)
   */
  public getAppOctokit(): Octokit {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
      },
    });
  }

  /**
   * Fetch an installation token directly
   */
  public async getInstallationToken(installationId?: number): Promise<string> {
    const targetId = installationId || this.installationId;
    if (!targetId) {
      throw new Error('installationId is required to generate an installation token.');
    }

    const auth = createAppAuth({
      appId: this.appId,
      privateKey: this.privateKey,
      installationId: targetId,
    });

    const installationAuth = await auth({ type: 'installation' });
    return installationAuth.token;
  }

  /**
   * Fetch repository metadata and pull request details
   */
  public async fetchPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    installationId?: number
  ): Promise<PullRequestDetails> {
    const octokit = this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      body: data.body || undefined,
      state: data.state as 'open' | 'closed',
      user: {
        login: data.user?.login || 'unknown',
        avatarUrl: data.user?.avatar_url,
      },
      head: {
        ref: data.head.ref,
        sha: data.head.sha,
      },
      base: {
        ref: data.base.ref,
        sha: data.base.sha,
      },
    };
  }

  /**
   * Fetch the actual raw unified diff for a pull request
   */
  public async fetchPullRequestDiff(
    owner: string,
    repo: string,
    pullNumber: number,
    installationId?: number
  ): Promise<string> {
    const octokit = this.getInstallationOctokit(installationId);
    const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: pullNumber,
      headers: {
        accept: 'application/vnd.github.v3.diff',
      },
    });

    if (typeof response.data !== 'string') {
      throw new Error(`Expected text diff from GitHub, received ${typeof response.data}`);
    }

    return response.data;
  }

  /**
   * Create a GitHub Check Run on the commit SHA
   */
  public async createCheckRun(
    owner: string,
    repo: string,
    commitSha: string,
    name: string = 'ReviewFlow AI',
    installationId?: number
  ): Promise<string> {
    const octokit = this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.checks.create({
      owner,
      repo,
      name,
      head_sha: commitSha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    return String(data.id);
  }

  /**
   * Update the status and conclusion of an existing Check Run
   */
  public async updateCheckRun(
    owner: string,
    repo: string,
    checkRunId: string,
    params: CheckRunUpdateParams,
    installationId?: number
  ): Promise<void> {
    const octokit = this.getInstallationOctokit(installationId);
    await octokit.rest.checks.update({
      owner,
      repo,
      check_run_id: parseInt(checkRunId, 10),
      status: params.status,
      conclusion: params.conclusion,
      completed_at: params.status === 'completed' ? new Date().toISOString() : undefined,
      output: {
        title: params.title,
        summary: params.summary,
        text: params.text,
      },
    });
  }

  /**
   * Post inline review comments and summary directly to the Pull Request
   */
  public async postReview(
    owner: string,
    repo: string,
    pullNumber: number,
    commitSha: string,
    summaryBody: string,
    comments: ReviewCommentPayload[],
    installationId?: number
  ): Promise<{ reviewId: string; commentsCount: number }> {
    const octokit = this.getInstallationOctokit(installationId);

    // Format inline comments for GitHub API
    const formattedComments = comments
      .filter((c) => c.line > 0 && c.path)
      .map((c) => ({
        path: c.path,
        line: c.line,
        body: c.body,
      }));

    const response = await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitSha,
      body: summaryBody,
      event: 'COMMENT',
      comments: formattedComments.length > 0 ? formattedComments : undefined,
    });

    return {
      reviewId: String(response.data.id),
      commentsCount: formattedComments.length,
    };
  }

  /**
   * List repositories accessible to this installation
   */
  public async listInstallationRepositories(installationId?: number): Promise<
    Array<{
      id: number;
      name: string;
      fullName: string;
      private: boolean;
      defaultBranch: string;
    }>
  > {
    const octokit = this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    return data.repositories.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      defaultBranch: r.default_branch,
    }));
  }

  /**
   * Check installation details & permissions
   */
  public async getInstallationDetails(installationId?: number) {
    const octokit = this.getAppOctokit();
    const targetId = installationId || this.installationId;
    if (!targetId) {
      throw new Error('installationId is required to retrieve installation details.');
    }

    const { data } = await octokit.rest.apps.getInstallation({
      installation_id: targetId,
    });

    return {
      id: data.id,
      account: data.account,
      permissions: data.permissions,
      events: data.events,
      createdAt: data.created_at,
    };
  }
}
