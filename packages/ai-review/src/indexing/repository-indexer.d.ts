import { IGitHubAdapter } from '@reviewflow/github-client';
import { IEmbeddingProvider } from '../providers/provider-adapter';
export interface IndexRepositoryParams {
    repositoryId: string;
    commitSha?: string;
    branch?: string;
    jobId?: string;
    force?: boolean;
    githubAdapter: IGitHubAdapter;
    embeddingProvider: IEmbeddingProvider;
    onProgress?: (percent: number, message: string) => Promise<void>;
}
export interface IndexingResult {
    commitSha: string;
    totalFiles: number;
    indexedFiles: number;
    unchangedFiles: number;
    deletedFiles: number;
    totalChunks: number;
    chunksCreated: number;
    durationSeconds: number;
    tokensUsed: number;
}
export declare function indexRepository(params: IndexRepositoryParams): Promise<IndexingResult>;
