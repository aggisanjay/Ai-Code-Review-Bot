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
    generateReview(systemPrompt: string, userPrompt: string, options?: LlmCompletionOptions): Promise<LlmCompletionResult>;
}
export declare class GeminiProvider implements ILlmProvider {
    name: string;
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateReview(systemPrompt: string, userPrompt: string, options?: LlmCompletionOptions): Promise<LlmCompletionResult>;
}
export declare class OpenAiProvider implements ILlmProvider {
    name: string;
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateReview(systemPrompt: string, userPrompt: string, options?: LlmCompletionOptions): Promise<LlmCompletionResult>;
}
export declare class MockLlmProvider implements ILlmProvider {
    name: string;
    generateReview(_systemPrompt: string, userPrompt: string, _options?: LlmCompletionOptions): Promise<LlmCompletionResult>;
}
export interface IEmbeddingProvider {
    name: string;
    dimension: number;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
export declare class GeminiEmbeddingProvider implements IEmbeddingProvider {
    name: string;
    dimension: number;
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
export declare class OpenAiEmbeddingProvider implements IEmbeddingProvider {
    name: string;
    dimension: number;
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
export declare class MockEmbeddingProvider implements IEmbeddingProvider {
    name: string;
    dimension: number;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}
export declare function cosineSimilarity(vecA: number[], vecB: number[]): number;
