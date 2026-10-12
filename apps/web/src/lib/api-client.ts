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
}

export const api = new ApiClient();

