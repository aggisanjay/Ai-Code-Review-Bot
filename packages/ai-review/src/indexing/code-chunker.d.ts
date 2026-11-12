export interface ChunkDefinition {
    filePath: string;
    startLine: number;
    endLine: number;
    content: string;
    tokenCount: number;
    symbolContext?: string;
    language: string;
}
export declare const MAX_INDEXABLE_FILE_SIZE: number;
export declare const MAX_INDEXABLE_LINE_COUNT = 3000;
export declare function isFileEligibleForIndexing(filePath: string, sizeBytes?: number): boolean;
export declare function detectLanguage(filePath: string): string;
export declare function chunkSourceCode(filePath: string, content: string, targetChunkLines?: number, overlapLines?: number): ChunkDefinition[];
