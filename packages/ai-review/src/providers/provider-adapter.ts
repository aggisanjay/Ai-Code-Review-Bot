export interface LlmCompletionResult {
  rawResponse: string;
  tokensUsed: number;
}

export interface ILlmProvider {
  name: string;
  generateReview(systemPrompt: string, userPrompt: string): Promise<LlmCompletionResult>;
}

export class GeminiProvider implements ILlmProvider {
  name = 'Google Gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-pro-latest') {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        'GeminiProvider configuration error: GEMINI_API_KEY is not configured or empty.'
      );
    }
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  async generateReview(systemPrompt: string, userPrompt: string): Promise<LlmCompletionResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
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
        const errorText = await res.text();
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

      return { rawResponse, tokensUsed };
    } finally {
      clearTimeout(timeout);
    }
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

  async generateReview(systemPrompt: string, userPrompt: string): Promise<LlmCompletionResult> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4096,
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
        const errorText = await res.text();
        throw new Error(`OpenAI API error (Status ${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const rawResponse = data.choices?.[0]?.message?.content || '{}';
      const tokensUsed = data.usage?.total_tokens || 2800;

      return { rawResponse, tokensUsed };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class MockLlmProvider implements ILlmProvider {
  name = 'Mock Local LLM';

  async generateReview(_systemPrompt: string, userPrompt: string): Promise<LlmCompletionResult> {
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
      return { rawResponse: JSON.stringify(adversarialResult), tokensUsed: 450 };
    }

    const defaultResult = {
      summary: 'Automated AI analysis completed for pull request changes. Identified critical security vulnerabilities and concurrency risks.',
      overallRisk: 'CRITICAL',
      riskRationale: 'Hardcoded cryptographic fallback secret and non-atomic Redis blacklist lookup present high risk.',
      keyStrengths: [
        'Adopts HttpOnly cookie session architecture',
        'TypeScript interfaces ensure strong payload typing'
      ],
      blockers: [
        'Eliminate hardcoded fallback signing secret',
        'Use atomic Redis transactions for token revocation'
      ],
      testCoverageAssessment: 'Lacks test coverage for expired tokens and concurrent rotation.',
      estimatedReviewTimeSavedMinutes: 45,
      findings: [
        {
          category: 'SECURITY',
          severity: 'CRITICAL',
          confidence: 98,
          filePath: 'src/services/token.service.ts',
          startLine: 42,
          endLine: 45,
          title: 'Hardcoded Cryptographic Fallback Secret in JWT Verification',
          explanation: 'When process.env.JWT_REFRESH_SECRET is unset, the verification falls back to an insecure static string.',
          evidence: 'const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";',
          remediation: 'Throw an explicit error if the secret environment variable is missing.',
          suggestedPatch: 'const secret = process.env.JWT_REFRESH_SECRET;\nif (!secret) throw new Error("JWT_REFRESH_SECRET missing");'
        },
        {
          category: 'SECURITY',
          severity: 'HIGH',
          confidence: 92,
          filePath: 'src/services/session.service.ts',
          startLine: 110,
          endLine: 115,
          title: 'TOCTOU Race Condition in Token Blacklist Check',
          explanation: 'Separate async Redis get and set commands allow duplicate token consumption under concurrency.',
          evidence: 'const isRevoked = await redis.get(`blacklist:${tokenId}`);\nawait redis.set(`blacklist:${tokenId}`, "1");',
          remediation: 'Use Redis SET with NX flag to atomically check and set.',
          suggestedPatch: 'const wasSet = await redis.set(`blacklist:${tokenId}`, "1", "EX", 86400, "NX");'
        }
      ]
    };

    return {
      rawResponse: JSON.stringify(defaultResult),
      tokensUsed: 2200,
    };
  }
}
