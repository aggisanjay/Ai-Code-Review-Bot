export interface LlmCompletionResult {
  rawResponse: string;
  tokensUsed: number;
  modelUsed?: string;
  fallbackTriggered?: boolean;
  latencyMs?: number;
}

export interface LlmCompletionOptions {
  jsonMode?: boolean;
}

export interface ILlmProvider {
  name: string;
  generateReview(
    systemPrompt: string,
    userPrompt: string,
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResult>;
}

export class GeminiProvider implements ILlmProvider {
  name = 'Google Gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-3.5-flash') {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        'GeminiProvider configuration error: GEMINI_API_KEY is not configured or empty.'
      );
    }
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  async generateReview(
    systemPrompt: string,
    userPrompt: string,
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResult> {
    const startTime = Date.now();
    const isJson = options?.jsonMode !== false;
    const candidateModels = [
      this.model,
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-2.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-3-flash-preview',
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let lastError: Error | null = null;

    for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
      const targetModel = candidateModels[modelIdx];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${this.apiKey}`;
      const generationConfig: Record<string, any> = {
        temperature: 0.1,
        maxOutputTokens: 4096,
      };
      if (isJson) {
        generationConfig.responseMimeType = 'application/json';
      }

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig,
      };

      // Retry up to 2 times if temporary 503 high-demand spike
      let attempt = 0;
      let modelSucceeded = false;

      while (attempt < 2 && !modelSucceeded) {
        attempt++;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errorText = await res.text();
            // If temporary 503 high demand spike, backoff and retry this model once before falling back
            if (res.status === 503 && attempt === 1) {
              console.warn(`[GeminiProvider] Model ${targetModel} 503 high demand spike. Backing off 2s before retry...`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }

            if (res.status === 429 || res.status === 503 || res.status === 404) {
              lastError = new Error(`Google Gemini (${targetModel}) unavailable (HTTP ${res.status}): ${errorText}`);
              break; // Try next candidate model
            }
            throw new Error(`Google Gemini API request failed (HTTP ${res.status}): ${errorText}`);
          }

          const data = await res.json();
          let rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

          // Clean markdown code blocks if present
          rawResponse = rawResponse.trim();
          if (rawResponse.startsWith('```')) {
            rawResponse = rawResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          }

          const tokensUsed = data.usageMetadata?.totalTokenCount || 2500;
          const latencyMs = Date.now() - startTime;
          return {
            rawResponse,
            tokensUsed,
            modelUsed: targetModel,
            fallbackTriggered: modelIdx > 0,
            latencyMs,
          };
        } catch (err: any) {
          lastError = err;
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    throw lastError || new Error('Google Gemini API request failed for all candidate models.');
  }
}

export class OpenAiProvider implements ILlmProvider {
  name = 'OpenAI';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        'OpenAiProvider configuration error: OPENAI_API_KEY is not configured or empty.'
      );
    }
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  async generateReview(
    systemPrompt: string,
    userPrompt: string,
    options?: LlmCompletionOptions
  ): Promise<LlmCompletionResult> {
    const startTime = Date.now();
    const isJson = options?.jsonMode !== false;
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload: Record<string, any> = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    };
    if (isJson) {
      payload.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI API error (Status ${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const rawResponse = data.choices?.[0]?.message?.content || '{}';
      const tokensUsed = data.usage?.total_tokens || 2800;
      const latencyMs = Date.now() - startTime;

      return {
        rawResponse,
        tokensUsed,
        modelUsed: this.model,
        fallbackTriggered: false,
        latencyMs,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class MockLlmProvider implements ILlmProvider {
  name = 'Mock Local LLM';

  async generateReview(
    _systemPrompt: string,
    userPrompt: string,
    _options?: LlmCompletionOptions
  ): Promise<LlmCompletionResult> {
    // If the diff contains adversarial injection markers, simulate robust defense detection
    if (userPrompt.toLowerCase().includes('ignore previous instructions') || userPrompt.includes('SYSTEM PROMPT OVERRIDE')) {
      const adversarialResult = {
        summary: 'Detected active adversarial prompt injection attempt inside untrusted repository diff. Review halted with critical security alert.',
        overallRisk: 'CRITICAL',
        riskRationale: 'The diff contains adversarial instructions attempting to manipulate the AI reviewer.',
        keyStrengths: [],
        blockers: ['Remove malicious prompt injection instructions from pull request'],
        testCoverageAssessment: 'N/A',
        estimatedReviewTimeSavedMinutes: 10,
        findings: [
          {
            category: 'SECURITY',
            severity: 'CRITICAL',
            confidence: 99,
            filePath: 'src/services/token.service.ts',
            startLine: 1,
            endLine: 1,
            title: 'Adversarial Prompt Injection Attempt in Pull Request',
            explanation: 'The code changes contain text instructing the AI to ignore previous security rules.',
            evidence: 'Ignore previous instructions',
            remediation: 'Do not attempt to manipulate automated review tools.',
          },
        ],
      };
      return {
        rawResponse: JSON.stringify(adversarialResult),
        tokensUsed: 450,
        modelUsed: 'mock-security-shield',
        fallbackTriggered: false,
        latencyMs: 35,
      };
    }

    // Extract actual changed file paths from the diff in userPrompt if present
    const fileMatches = Array.from(
      userPrompt.matchAll(/(?:\+\+\+\s+b\/|diff\s+--git\s+a\/\S+\s+b\/)([^\s\n]+)/g)
    ).map((m) => m[1]);
    const primaryFile = fileMatches[0] || 'src/services/token.service.ts';
    const secondaryFile = fileMatches[1] || primaryFile;

    const defaultResult = {
      summary:
        'Comprehensive multi-pillar engineering review completed. Identified critical security vulnerabilities, concurrency correctness risks, event-loop performance bottlenecks, and test coverage gaps.',
      overallRisk: 'CRITICAL',
      riskRationale:
        'Cryptographic fallback secrets and concurrent race conditions present severe security and correctness exposure before merge.',
      keyStrengths: [
        'Adopts HttpOnly cookie session architecture',
        'TypeScript interfaces ensure strong payload typing',
        'Clean modular service boundaries',
      ],
      blockers: [
        'Eliminate hardcoded fallback signing secret',
        'Use atomic Redis transactions for token revocation',
        'Add automated test suite exercising expired token and concurrent revocation paths',
      ],
      testCoverageAssessment:
        'Critical gaps detected: lacks negative test cases for expired tokens, token revocation rollbacks, and concurrent token rotation.',
      estimatedReviewTimeSavedMinutes: 65,
      findings: [
        {
          category: 'SECURITY',
          severity: 'CRITICAL',
          confidence: 98,
          filePath: primaryFile,
          startLine: 42,
          endLine: 45,
          title: 'Hardcoded Cryptographic Fallback Secret in JWT Verification',
          explanation:
            'When process.env.JWT_REFRESH_SECRET is unset, token verification falls back to an insecure static string.',
          evidence:
            'const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";',
          remediation:
            'Throw an explicit error if the secret environment variable is missing; never supply a default fallback string.',
          suggestedPatch:
            'const secret = process.env.JWT_REFRESH_SECRET;\nif (!secret) throw new Error("JWT_REFRESH_SECRET missing");',
        },
        {
          category: 'CORRECTNESS',
          severity: 'HIGH',
          confidence: 94,
          filePath: primaryFile,
          startLine: 110,
          endLine: 115,
          title: 'TOCTOU Race Condition in Token Blacklist Check',
          explanation:
            'Separate async Redis get and set commands allow duplicate token consumption under concurrent requests.',
          evidence:
            'const isRevoked = await redis.get(`blacklist:${tokenId}`);\nawait redis.set(`blacklist:${tokenId}`, "1");',
          remediation:
            'Use Redis SET with NX flag or atomic multi-exec to atomically test and set token status.',
          suggestedPatch:
            'const wasSet = await redis.set(`blacklist:${tokenId}`, "1", "EX", 86400, "NX");',
        },
        {
          category: 'PERFORMANCE',
          severity: 'HIGH',
          confidence: 91,
          filePath: primaryFile,
          startLine: 68,
          endLine: 72,
          title: 'Synchronous File System I/O Blocking Node.js Event Loop',
          explanation:
            'Synchronous read operations stall the single-threaded Node.js event loop, preventing all concurrent HTTP request handling.',
          evidence: 'const rawKeys = fs.readFileSync(keyPath, "utf-8");',
          remediation:
            'Switch to asynchronous non-blocking I/O using fs.promises.readFile with await.',
          suggestedPatch: 'const rawKeys = await fs.promises.readFile(keyPath, "utf-8");',
        },
        {
          category: 'TESTING',
          severity: 'MEDIUM',
          confidence: 89,
          filePath: secondaryFile,
          startLine: 15,
          endLine: 20,
          title: 'Missing Unit Test Assertions for Token Expiration and Revocation',
          explanation:
            'New authorization routes and token rotation flows lack unit and integration test assertions for token expiry, replay attacks, and invalid signatures.',
          evidence: '// TODO: add integration test suite for token revocation',
          remediation:
            'Implement automated tests with mock Redis assertions verifying both positive validation and negative expiration/rejection paths.',
          suggestedPatch:
            'describe("Token Revocation", () => {\n  it("should reject blacklisted refresh tokens", async () => {\n    // test assertions\n  });\n});',
        },
        {
          category: 'MAINTAINABILITY',
          severity: 'LOW',
          confidence: 87,
          filePath: primaryFile,
          startLine: 95,
          endLine: 96,
          title: 'Production Debug console.log and Unresolved Technical Debt',
          explanation:
            'Leftover console.log calls pollute production logs and expose internal object state.',
          evidence: 'console.log("Token payload debug:", decodedToken);',
          remediation:
            'Remove debugging statements or route through structured application logger (logger.debug).',
          suggestedPatch: 'logger.debug("Token verified successfully", { tokenId: decodedToken.jti });',
        },
      ],
    };

    return {
      rawResponse: JSON.stringify(defaultResult),
      tokensUsed: 2600,
      modelUsed: 'mock-local-v1',
      fallbackTriggered: false,
      latencyMs: 50,
    };
  }
}

export interface IEmbeddingProvider {
  name: string;
  dimension: number;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  name = 'Google Gemini gemini-embedding-001';
  dimension = 768;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-embedding-001') {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GeminiEmbeddingProvider error: GEMINI_API_KEY is not configured or empty.');
    }
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const candidateModels = [this.model, 'gemini-embedding-001', 'gemini-embedding-2'].filter(
      (m, idx, arr) => arr.indexOf(m) === idx
    );

    // Batch in groups of up to 50 items (Gemini batchEmbedContents limit)
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += 50) {
      batches.push(texts.slice(i, i + 50));
    }

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      let batchSuccess = false;
      let lastErr: any = null;

      for (const targetModel of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:batchEmbedContents?key=${this.apiKey}`;
        const payload = {
          requests: batch.map((text) => ({
            model: `models/${targetModel}`,
            content: { parts: [{ text: text.slice(0, 8000) }] },
          })),
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errText = await res.text();
            if (res.status === 404) {
              lastErr = new Error(`Model ${targetModel} 404: ${errText}`);
              continue; // try next candidate model
            }
            throw new Error(`Google Gemini Embedding API error (HTTP ${res.status}): ${errText}`);
          }

          const data = await res.json();
          const embeddings = (data.embeddings || []).map((e: any) => e.values as number[]);
          allEmbeddings.push(...embeddings);
          batchSuccess = true;
          break;
        } catch (err: any) {
          lastErr = err;
        } finally {
          clearTimeout(timeout);
        }
      }

      if (!batchSuccess) {
        throw lastErr || new Error('Failed to generate embeddings across all candidate models.');
      }
    }

    return allEmbeddings;
  }
}


export class OpenAiEmbeddingProvider implements IEmbeddingProvider {
  name = 'OpenAI text-embedding-3-small';
  dimension = 1536;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAiEmbeddingProvider error: OPENAI_API_KEY is not configured or empty.');
    }
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += 100) {
      batches.push(texts.slice(i, i + 100));
    }

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const url = 'https://api.openai.com/v1/embeddings';
      const payload = {
        model: this.model,
        input: batch.map((t) => t.slice(0, 8000)),
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenAI Embedding API error (HTTP ${res.status}): ${errText}`);
        }

        const data = await res.json();
        const sorted = (data.data || []).sort((a: any, b: any) => a.index - b.index);
        allEmbeddings.push(...sorted.map((item: any) => item.embedding as number[]));
      } finally {
        clearTimeout(timeout);
      }
    }

    return allEmbeddings;
  }
}

export class MockEmbeddingProvider implements IEmbeddingProvider {
  name = 'Mock Deterministic Embedding Provider';
  dimension = 768;

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((text) => {
      const vec = new Array(this.dimension).fill(0);
      const clean = text.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      const words = clean.split(/\s+/).filter(Boolean);

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        let hash = 0;
        for (let j = 0; j < word.length; j++) {
          hash = (hash << 5) - hash + word.charCodeAt(j);
          hash |= 0;
        }
        const index = Math.abs(hash) % this.dimension;
        vec[index] += 1;
      }

      // Normalize vector to unit length
      let norm = 0;
      for (let i = 0; i < vec.length; i++) {
        norm += vec[i] * vec[i];
      }
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < vec.length; i++) {
          vec[i] /= norm;
        }
      } else {
        vec[0] = 1.0;
      }

      return vec;
    });
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

