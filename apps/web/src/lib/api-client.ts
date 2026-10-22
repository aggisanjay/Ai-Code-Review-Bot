const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('reviewflow_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('reviewflow_token', token);
      else localStorage.removeItem('reviewflow_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error?.message || `API request failed with status ${res.status}`);
      }

      return await res.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[ApiClient] Request to ${endpoint} failed: ${message}`);
      throw err;
    }
  }

  // Feature helpers
  async getMe() {
    return this.fetch<any>('/auth/me');
  }

  async getPullRequests(params?: { repositoryId?: string; state?: string; search?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.fetch<any[]>(`/pull-requests${query ? `?${query}` : ''}`);
  }

  async getPullRequest(id: string) {
    return this.fetch<any>(`/pull-requests/${id}`);
  }

  async getReview(id: string) {
    return this.fetch<any>(`/reviews/${id}`);
  }

  async retryReview(id: string) {
    return this.fetch<any>(`/reviews/${id}/retry`, { method: 'POST' });
  }

  async dismissFinding(findingId: string, reason: string) {
    return this.fetch<any>(`/reviews/findings/${findingId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getRepositories() {
    return this.fetch<any[]>('/repositories');
  }

  async getAppInfo() {
    return this.fetch<{
      appSlug: string;
      appName: string;
      appId: number | null;
      installUrl: string;
      isConfigured: boolean;
      aiProvider: string;
      aiModel: string;
      availableInstallations: Array<{ id: number; accountLogin: string; accountType: string }>;
    }>('/repositories/app-info');
  }

  async initiateInstallation() {
    return this.fetch<{
      state: string;
      installUrl: string;
      expiresAt: string;
    }>('/repositories/installations/initiate', {
      method: 'POST',
    });
  }

  async claimInstallation(installationId: number, state?: string) {
    return this.fetch<{
      installation: any;
      availableRepositories?: any[];
      idempotent?: boolean;
    }>('/repositories/installations/claim', {
      method: 'POST',
      body: JSON.stringify({ installationId, state }),
    });
  }

  async getInstallations() {
    return this.fetch<any[]>('/repositories/installations');
  }

  async disconnectInstallation(installationId: number) {
    return this.fetch<{ disconnected: boolean }>(`/repositories/installations/${installationId}`, {
      method: 'DELETE',
    });
  }

  async getAvailableRepositories() {
    return this.fetch<any[]>('/repositories/github-available');
  }

  async toggleRepository(params: {
    githubRepoId: number;
    fullName: string;
    name: string;
    owner?: string;
    defaultBranch?: string;
    isPrivate?: boolean;
    enabled: boolean;
  }) {
    return this.fetch<{ enabled: boolean; repository?: any }>('/repositories/toggle', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getRepositoryPullRequests(repoId: string, state: string = 'open', page: number = 1, limit: number = 20) {
    return this.fetch<{
      pullRequests: any[];
      page: number;
      limit: number;
      hasMore: boolean;
    }>(`/repositories/${repoId}/pull-requests?state=${state}&page=${page}&limit=${limit}`);
  }

  async triggerPrReview(repoId: string, prNumber: number, forceRerun: boolean = false) {
    return this.fetch<{
      reviewJobId: string;
      status: string;
      alreadyReviewed?: boolean;
      overallRisk?: string;
      message?: string;
    }>(`/repositories/${repoId}/pull-requests/${prNumber}/review`, {
      method: 'POST',
      body: JSON.stringify({ forceRerun }),
    });
  }

  async updateRepositoryPolicy(repoId: string, policy: any) {
    return this.fetch<any>(`/repositories/${repoId}/policy`, {
      method: 'PATCH',
      body: JSON.stringify(policy),
    });
  }

  async getAnalytics() {
    return this.fetch<any>('/analytics/overview');
  }

  async getBilling() {
    return this.fetch<any>('/billing/subscription');
  }

  async checkoutPlan(planTier: string) {
    return this.fetch<any>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ planTier }),
    });
  }

  // Repository Indexing
  async triggerIndexing(repoId: string, commitSha?: string, branch?: string, force?: boolean) {
    return this.fetch<{ message: string; indexJob: any }>(`/repositories/${repoId}/index`, {
      method: 'POST',
      body: JSON.stringify({ commitSha, branch, force }),
    });
  }

  async getIndexingStatus(repoId: string) {
    return this.fetch<{
      repositoryId: string;
      fullName: string;
      lastIndexedAt: string | null;
      lastIndexedCommitSha: string | null;
      indexedFilesCount: number;
      totalChunksCount: number;
      latestJob: any;
    }>(`/repositories/${repoId}/index/status`);
  }

  // Codebase Q&A
  async askCodebase(repoId: string, question: string, conversationId?: string) {
    return this.fetch<{
      conversationId: string;
      messageId: string;
      answer: string;
      citations: Array<{ filePath: string; startLine: number; endLine: number; snippet?: string }>;
      tokensUsed: number;
      retrievedChunksCount: number;
      telemetry?: {
        evaluation: {
          groundedScore: number;
          confidence: 'HIGH' | 'MEDIUM' | 'LOW';
          citationsCount: number;
          sourceFilesCount: number;
          antiHallucinationVerified: boolean;
          verdict: string;
        };
        source: {
          files: string[];
          totalChunksRetrieved: number;
          commitSha?: string;
          scopes: string[];
        };
        cost: {
          tokensUsed: number;
          estimatedCostUsd: number;
          ratePer1kTokens: number;
        };
        latency: {
          totalMs: number;
          retrievalMs: number;
          generationMs: number;
        };
        fallback: {
          provider: string;
          model: string;
          fallbackTriggered: boolean;
          status: 'DIRECT' | 'FALLBACK ACTIVE';
        };
      };
    }>(`/repositories/${repoId}/qna`, {
      method: 'POST',
      body: JSON.stringify({ question, conversationId }),
    });
  }

  async getConversations(repoId: string, mineOnly?: boolean) {
    return this.fetch<any[]>(`/repositories/${repoId}/qna/conversations${mineOnly ? '?mine=true' : ''}`);
  }

  async getConversation(repoId: string, convoId: string) {
    return this.fetch<any>(`/repositories/${repoId}/qna/conversations/${convoId}`);
  }

  async deleteConversation(repoId: string, convoId: string) {
    return this.fetch<any>(`/repositories/${repoId}/qna/conversations/${convoId}`, {
      method: 'DELETE',
    });
  }

  // Test Suggestions & Improvements
  async generateTestSuggestion(repoId: string, params: { targetFile: string; diffSnippet?: string; testFramework?: string }) {
    return this.fetch<any>(`/repositories/${repoId}/suggestions/test`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getTestSuggestions(repoId: string) {
    return this.fetch<any[]>(`/repositories/${repoId}/suggestions/tests`);
  }

  // Write Approval Workflow
  async requestApproval(repoId: string, payload: {
    actionType: string;
    targetBranch: string;
    targetCommitSha?: string;
    title: string;
    description: string;
    payload: any;
  }) {
    return this.fetch<{ approvalId: string; nonce: string; expiresAt: string; message: string }>(
      `/repositories/${repoId}/approvals/request`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async executeApproval(repoId: string, approvalId: string, params: { nonce: string; approve: boolean; rejectionReason?: string }) {
    return this.fetch<any>(`/repositories/${repoId}/approvals/${approvalId}/execute`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Finding Feedback
  async submitFindingFeedback(findingId: string, feedbackType: string, comment?: string) {
    return this.fetch<any>(`/reviews/findings/${findingId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedbackType, comment }),
    });
  }
}

export const api = new ApiClient();


