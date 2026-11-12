"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_ASSISTANT_TOOLS = exports.queryReviewFindingsTool = exports.readTestFilesTool = exports.inspectDependenciesTool = exports.findSymbolsTool = exports.getFileContentTool = exports.searchCodeTool = exports.QueryReviewFindingsSchema = exports.ReadTestFilesSchema = exports.GetPullRequestSchema = exports.InspectDependenciesSchema = exports.FindSymbolsSchema = exports.GetFileContentSchema = exports.SearchCodeSchema = void 0;
const zod_1 = require("zod");
const database_1 = require("@reviewflow/database");
const vector_retriever_1 = require("../rag/vector-retriever");
exports.SearchCodeSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(500),
    limit: zod_1.z.number().int().min(1).max(20).default(6),
    pathFilter: zod_1.z.string().optional(),
});
exports.GetFileContentSchema = zod_1.z.object({
    filePath: zod_1.z.string().min(1).max(500),
    startLine: zod_1.z.number().int().min(1).optional(),
    endLine: zod_1.z.number().int().min(1).optional(),
    ref: zod_1.z.string().optional(),
});
exports.FindSymbolsSchema = zod_1.z.object({
    symbolName: zod_1.z.string().min(1).max(100),
    limit: zod_1.z.number().int().min(1).max(20).default(10),
});
exports.InspectDependenciesSchema = zod_1.z.object({
    manifestPath: zod_1.z.string().optional().default('package.json'),
});
exports.GetPullRequestSchema = zod_1.z.object({
    pullNumber: zod_1.z.number().int().min(1),
});
exports.ReadTestFilesSchema = zod_1.z.object({
    targetModule: zod_1.z.string().min(1),
});
exports.QueryReviewFindingsSchema = zod_1.z.object({
    pullRequestId: zod_1.z.string().optional(),
    severity: zod_1.z.string().optional(),
});
exports.searchCodeTool = {
    name: 'search_code',
    description: 'Search indexed repository code chunks using semantic vector and keyword search.',
    parameters: exports.SearchCodeSchema,
    async execute(args, context) {
        const parsed = exports.SearchCodeSchema.parse(args);
        const chunks = await (0, vector_retriever_1.retrieveCodeContext)({
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
exports.getFileContentTool = {
    name: 'get_file_content',
    description: 'Retrieve permitted file content from the authorized repository revision.',
    parameters: exports.GetFileContentSchema,
    async execute(args, context) {
        const parsed = exports.GetFileContentSchema.parse(args);
        const repo = await database_1.prisma.repository.findUnique({
            where: { id: context.repositoryId },
        });
        if (!repo)
            throw new Error('Repository not found');
        const fileResult = await context.githubAdapter.fetchFileContent(repo.owner, repo.name, parsed.filePath, parsed.ref || repo.defaultBranch);
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
exports.findSymbolsTool = {
    name: 'find_symbols',
    description: 'Find function, class, or type declarations in the indexed repository.',
    parameters: exports.FindSymbolsSchema,
    async execute(args, context) {
        const parsed = exports.FindSymbolsSchema.parse(args);
        const chunks = await database_1.prisma.codeChunk.findMany({
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
exports.inspectDependenciesTool = {
    name: 'inspect_dependencies',
    description: 'Inspect dependency relationships by reading project manifests (package.json, etc.).',
    parameters: exports.InspectDependenciesSchema,
    async execute(args, context) {
        const parsed = exports.InspectDependenciesSchema.parse(args);
        const repo = await database_1.prisma.repository.findUnique({
            where: { id: context.repositoryId },
        });
        if (!repo)
            throw new Error('Repository not found');
        try {
            const fileResult = await context.githubAdapter.fetchFileContent(repo.owner, repo.name, parsed.manifestPath, repo.defaultBranch);
            const json = JSON.parse(fileResult.content);
            return {
                manifestPath: parsed.manifestPath,
                dependencies: json.dependencies || {},
                devDependencies: json.devDependencies || {},
            };
        }
        catch {
            return {
                manifestPath: parsed.manifestPath,
                error: `Could not parse manifest at ${parsed.manifestPath}`,
            };
        }
    },
};
exports.readTestFilesTool = {
    name: 'read_test_files',
    description: 'Discover test files covering a specific module or component.',
    parameters: exports.ReadTestFilesSchema,
    async execute(args, context) {
        const parsed = exports.ReadTestFilesSchema.parse(args);
        const testFiles = await database_1.prisma.indexedFile.findMany({
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
exports.queryReviewFindingsTool = {
    name: 'query_review_findings',
    description: 'Query recorded automated review findings and security alerts.',
    parameters: exports.QueryReviewFindingsSchema,
    async execute(args, context) {
        const parsed = exports.QueryReviewFindingsSchema.parse(args);
        const findings = await database_1.prisma.finding.findMany({
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
exports.CODE_ASSISTANT_TOOLS = {
    search_code: exports.searchCodeTool,
    get_file_content: exports.getFileContentTool,
    find_symbols: exports.findSymbolsTool,
    inspect_dependencies: exports.inspectDependenciesTool,
    read_test_files: exports.readTestFilesTool,
    query_review_findings: exports.queryReviewFindingsTool,
};
