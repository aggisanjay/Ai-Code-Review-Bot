import { ILlmProvider, IEmbeddingProvider } from '../providers/provider-adapter';
export interface CodebaseCitation {
    filePath: string;
    startLine: number;
    endLine: number;
    commitSha?: string;
    snippet?: string;
}
export interface TelemetryEvaluation {
    groundedScore: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    citationsCount: number;
    sourceFilesCount: number;
    antiHallucinationVerified: boolean;
    verdict: string;
}
export interface TelemetrySource {
    files: string[];
    totalChunksRetrieved: number;
    commitSha?: string;
    scopes: string[];
}
export interface TelemetryCost {
    tokensUsed: number;
    estimatedCostUsd: number;
    ratePer1kTokens: number;
}
export interface TelemetryLatency {
    totalMs: number;
    retrievalMs: number;
    generationMs: number;
}
export interface TelemetryFallback {
    provider: string;
    model: string;
    fallbackTriggered: boolean;
    status: 'DIRECT' | 'FALLBACK ACTIVE';
}
export interface QnATelemetry {
    evaluation: TelemetryEvaluation;
    source: TelemetrySource;
    cost: TelemetryCost;
    latency: TelemetryLatency;
    fallback: TelemetryFallback;
}
export interface CodebaseQnAResult {
    answer: string;
    citations: CodebaseCitation[];
    tokensUsed: number;
    retrievedChunksCount: number;
    telemetry: QnATelemetry;
}
export interface AskCodebaseParams {
    repositoryId: string;
    repoFullName: string;
    question: string;
    history?: Array<{
        role: 'USER' | 'ASSISTANT';
        content: string;
    }>;
    llmProvider: ILlmProvider;
    embeddingProvider: IEmbeddingProvider;
}
export declare function askCodebaseQuestion(params: AskCodebaseParams): Promise<CodebaseQnAResult>;
