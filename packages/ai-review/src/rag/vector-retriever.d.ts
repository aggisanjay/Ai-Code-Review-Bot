import { IEmbeddingProvider } from '../providers/provider-adapter';
export interface RetrievedChunk {
    chunkId: string;
    filePath: string;
    startLine: number;
    endLine: number;
    content: string;
    symbolContext?: string;
    similarity: number;
    commitSha: string;
}
export interface RetrieveContextParams {
    repositoryId: string;
    query: string;
    limit?: number;
    pathFilter?: string;
    embeddingProvider: IEmbeddingProvider;
}
export declare function retrieveCodeContext(params: RetrieveContextParams): Promise<RetrievedChunk[]>;
