import { z } from 'zod';
import { prisma } from '@reviewflow/database';
import { IGitHubAdapter } from '@reviewflow/github-client';
import { IEmbeddingProvider } from '../providers/provider-adapter';
import { retrieveCodeContext } from '../rag/vector-retriever';

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

export const SearchCodeSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).default(6),
  pathFilter: z.string().optional(),
});

export const GetFileContentSchema = z.object({
  filePath: z.string().min(1).max(500),
  startLine: z.number().int().min(1).optional(),
  endLine: z.number().int().min(1).optional(),
  ref: z.string().optional(),
});

export const FindSymbolsSchema = z.object({
  symbolName: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(20).default(10),
});

export const InspectDependenciesSchema = z.object({
  manifestPath: z.string().optional().default('package.json'),
});

export const GetPullRequestSchema = z.object({
  pullNumber: z.number().int().min(1),
});

export const ReadTestFilesSchema = z.object({
  targetModule: z.string().min(1),
});

export const QueryReviewFindingsSchema = z.object({
  pullRequestId: z.string().optional(),
  severity: z.string().optional(),
});

export const searchCodeTool: ToolDefinition = {
  name: 'search_code',
  description: 'Search indexed repository code chunks using semantic vector and keyword search.',
  parameters: SearchCodeSchema,
  async execute(args, context) {
    const parsed = SearchCodeSchema.parse(args);
    const chunks = await retrieveCodeContext({
      repositoryId: context.repositoryId,
      query: parsed.query,
      limit: parsed.limit,
      pathFilter: parsed.pathFilter,
      embeddingProvider: context.embeddingProvider,
    });
    return {
      query: parsed.query,
      resultsCount: chunks.length,
      chunks: chunks.map((c) => ({
        filePath: c.filePath,
        startLine: c.startLine,
        endLine: c.endLine,
        symbol: c.symbolContext,
        similarity: c.similarity,
        snippet: c.content,
      })),
    };
  },
};

export const getFileContentTool: ToolDefinition = {
  name: 'get_file_content',
  description: 'Retrieve permitted file content from the authorized repository revision.',
  parameters: GetFileContentSchema,
  async execute(args, context) {
    const parsed = GetFileContentSchema.parse(args);
    const repo = await prisma.repository.findUnique({
      where: { id: context.repositoryId },
    });
    if (!repo) throw new Error('Repository not found');

    const fileResult = await context.githubAdapter.fetchFileContent(
      repo.owner,
      repo.name,
      parsed.filePath,
      parsed.ref || repo.defaultBranch
    );

    const lines = fileResult.content.split(/\r?\n/);
    const start = Math.max(1, parsed.startLine || 1);
    const end = Math.min(lines.length, parsed.endLine || lines.length);
    const sliced = lines.slice(start - 1, end).join('\n');

    return {
      filePath: parsed.filePath,
      totalLines: lines.length,
      startLine: start,
      endLine: end,
      content: sliced,
    };
  },
};

export const findSymbolsTool: ToolDefinition = {
  name: 'find_symbols',
  description: 'Find function, class, or type declarations in the indexed repository.',
  parameters: FindSymbolsSchema,
  async execute(args, context) {
    const parsed = FindSymbolsSchema.parse(args);
    const chunks = await prisma.codeChunk.findMany({
      where: {
        repositoryId: context.repositoryId,
        symbolContext: { contains: parsed.symbolName },
      },
      take: parsed.limit,
      select: {
        filePath: true,
        startLine: true,
        endLine: true,
        symbolContext: true,
        content: true,
      },
    });

    return {
      symbolName: parsed.symbolName,
      matchesCount: chunks.length,
      matches: chunks.map((c) => ({
        filePath: c.filePath,
        startLine: c.startLine,
        endLine: c.endLine,
        symbol: c.symbolContext,
      })),
    };
  },
};

export const inspectDependenciesTool: ToolDefinition = {
  name: 'inspect_dependencies',
  description: 'Inspect dependency relationships by reading project manifests (package.json, etc.).',
  parameters: InspectDependenciesSchema,
  async execute(args, context) {
    const parsed = InspectDependenciesSchema.parse(args);
    const repo = await prisma.repository.findUnique({
      where: { id: context.repositoryId },
    });
    if (!repo) throw new Error('Repository not found');

    try {
      const fileResult = await context.githubAdapter.fetchFileContent(
        repo.owner,
        repo.name,
        parsed.manifestPath,
        repo.defaultBranch
      );

      const json = JSON.parse(fileResult.content);
      return {
        manifestPath: parsed.manifestPath,
        dependencies: json.dependencies || {},
        devDependencies: json.devDependencies || {},
      };
    } catch {
      return {
        manifestPath: parsed.manifestPath,
        error: `Could not parse manifest at ${parsed.manifestPath}`,
      };
    }
  },
};

export const readTestFilesTool: ToolDefinition = {
  name: 'read_test_files',
  description: 'Discover test files covering a specific module or component.',
  parameters: ReadTestFilesSchema,
  async execute(args, context) {
    const parsed = ReadTestFilesSchema.parse(args);
    const testFiles = await prisma.indexedFile.findMany({
      where: {
        repositoryId: context.repositoryId,
        filePath: { contains: 'test' },
      },
      take: 10,
    });

    return {
      targetModule: parsed.targetModule,
      testFilesFound: testFiles.map((t) => ({
        filePath: t.filePath,
        language: t.language,
        sizeBytes: t.sizeBytes,
      })),
    };
  },
};

export const queryReviewFindingsTool: ToolDefinition = {
  name: 'query_review_findings',
  description: 'Query recorded automated review findings and security alerts.',
  parameters: QueryReviewFindingsSchema,
  async execute(args, context) {
    const parsed = QueryReviewFindingsSchema.parse(args);
    const findings = await prisma.finding.findMany({
      where: {
        reviewResult: {
          reviewJob: {
            pullRequest: {
              repositoryId: context.repositoryId,
              ...(parsed.pullRequestId ? { id: parsed.pullRequestId } : {}),
            },
          },
        },
        ...(parsed.severity ? { severity: parsed.severity } : {}),
      },
      take: 15,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        category: true,
        severity: true,
        filePath: true,
        startLine: true,
        endLine: true,
        title: true,
        explanation: true,
        remediation: true,
      },
    });

    return {
      findingsCount: findings.length,
      findings,
    };
  },
};

export const CODE_ASSISTANT_TOOLS: Record<string, ToolDefinition> = {
  search_code: searchCodeTool,
  get_file_content: getFileContentTool,
  find_symbols: findSymbolsTool,
  inspect_dependencies: inspectDependenciesTool,
  read_test_files: readTestFilesTool,
  query_review_findings: queryReviewFindingsTool,
};
