import { z } from 'zod';
import { IGitHubAdapter } from '@reviewflow/github-client';
import { IEmbeddingProvider } from '../providers/provider-adapter';
export interface ToolExecutionContext {
    organizationId: string;
    repositoryId: string;
    githubAdapter: IGitHubAdapter;
    embeddingProvider: IEmbeddingProvider;
}
export interface ToolDefinition<TArgs = any, TResult = any> {
    name: string;
    description: string;
    parameters: z.ZodType<TArgs>;
    execute(args: TArgs, context: ToolExecutionContext): Promise<TResult>;
}
export declare const SearchCodeSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    pathFilter: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    pathFilter?: string | undefined;
}, {
    query: string;
    limit?: number | undefined;
    pathFilter?: string | undefined;
}>;
export declare const GetFileContentSchema: z.ZodObject<{
    filePath: z.ZodString;
    startLine: z.ZodOptional<z.ZodNumber>;
    endLine: z.ZodOptional<z.ZodNumber>;
    ref: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    ref?: string | undefined;
    startLine?: number | undefined;
    endLine?: number | undefined;
}, {
    filePath: string;
    ref?: string | undefined;
    startLine?: number | undefined;
    endLine?: number | undefined;
}>;
export declare const FindSymbolsSchema: z.ZodObject<{
    symbolName: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    symbolName: string;
}, {
    symbolName: string;
    limit?: number | undefined;
}>;
export declare const InspectDependenciesSchema: z.ZodObject<{
    manifestPath: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    manifestPath: string;
}, {
    manifestPath?: string | undefined;
}>;
export declare const GetPullRequestSchema: z.ZodObject<{
    pullNumber: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    pullNumber: number;
}, {
    pullNumber: number;
}>;
export declare const ReadTestFilesSchema: z.ZodObject<{
    targetModule: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetModule: string;
}, {
    targetModule: string;
}>;
export declare const QueryReviewFindingsSchema: z.ZodObject<{
    pullRequestId: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    severity?: string | undefined;
    pullRequestId?: string | undefined;
}, {
    severity?: string | undefined;
    pullRequestId?: string | undefined;
}>;
export declare const searchCodeTool: ToolDefinition;
export declare const getFileContentTool: ToolDefinition;
export declare const findSymbolsTool: ToolDefinition;
export declare const inspectDependenciesTool: ToolDefinition;
export declare const readTestFilesTool: ToolDefinition;
export declare const queryReviewFindingsTool: ToolDefinition;
export declare const CODE_ASSISTANT_TOOLS: Record<string, ToolDefinition>;
