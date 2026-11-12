"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexRepository = indexRepository;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("@reviewflow/database");
const code_chunker_1 = require("./code-chunker");
async function indexRepository(params) {
    const startTime = Date.now();
    const { repositoryId, githubAdapter, embeddingProvider, onProgress } = params;
    // 1. Load repository details
    const repository = await database_1.prisma.repository.findUnique({
        where: { id: repositoryId },
    });
    if (!repository) {
        throw new Error(`Repository with ID ${repositoryId} not found.`);
    }
    const branch = params.branch || repository.defaultBranch || 'main';
    // 2. Resolve commit SHA
    let commitSha = params.commitSha;
    if (!commitSha || commitSha === 'HEAD') {
        if (githubAdapter.getLatestCommitSha) {
            commitSha = await githubAdapter.getLatestCommitSha(repository.owner, repository.name, branch);
        }
        else {
            commitSha = 'HEAD';
        }
    }
    await onProgress?.(10, `Resolved target revision @${commitSha.substring(0, 7)} on branch ${branch}...`);
    // 3. Fetch repository tree from GitHub
    const treeItems = await githubAdapter.fetchRepositoryTree(repository.owner, repository.name, commitSha, true);
    // 4. Filter eligible blobs
    const eligibleItems = treeItems.filter((item) => item.type === 'blob' && (0, code_chunker_1.isFileEligibleForIndexing)(item.path, item.size));
    await onProgress?.(25, `Discovered ${eligibleItems.length} eligible source code files.`);
    // 5. Compare with existing IndexedFiles in database for incremental indexing
    const existingFiles = await database_1.prisma.indexedFile.findMany({
        where: { repositoryId },
        select: { id: true, filePath: true, contentHash: true },
    });
    const existingFileMap = new Map(existingFiles.map((f) => [f.filePath, f]));
    const currentPathSet = new Set(eligibleItems.map((item) => item.path));
    // Determine deletions
    const filesToDelete = existingFiles.filter((f) => !currentPathSet.has(f.filePath));
    if (filesToDelete.length > 0) {
        await database_1.prisma.indexedFile.deleteMany({
            where: { id: { in: filesToDelete.map((f) => f.id) } },
        });
    }
    // Determine changed or new files (or all eligible files if force is requested)
    const filesToIndex = params.force
        ? eligibleItems
        : eligibleItems.filter((item) => {
            const existing = existingFileMap.get(item.path);
            // If we have an existing record with the exact git blob sha, skip re-indexing
            return !existing || existing.contentHash !== item.sha;
        });
    const unchangedCount = eligibleItems.length - filesToIndex.length;
    await onProgress?.(40, `Incremental check: ${filesToIndex.length} files to index${params.force ? ' (forced re-index)' : ''}, ${unchangedCount} unchanged, ${filesToDelete.length} removed.`);
    let totalChunksCreated = 0;
    let totalTokensUsed = 0;
    // 6. Process files in concurrent batches of 4
    const BATCH_SIZE = 4;
    for (let i = 0; i < filesToIndex.length; i += BATCH_SIZE) {
        const batch = filesToIndex.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (item) => {
            try {
                // Fetch file content
                const fileRes = await githubAdapter.fetchFileContent(repository.owner, repository.name, item.path, commitSha);
                const content = fileRes.content;
                const language = (0, code_chunker_1.detectLanguage)(item.path);
                const lineCount = content.split(/\r?\n/).length;
                const contentHash = item.sha || crypto_1.default.createHash('sha256').update(content).digest('hex');
                // Chunk file
                const chunks = (0, code_chunker_1.chunkSourceCode)(item.path, content);
                if (chunks.length === 0)
                    return;
                // Generate embeddings for chunks
                const chunkTexts = chunks.map((c) => `${c.filePath}${c.symbolContext ? ` (${c.symbolContext})` : ''}\n${c.content}`);
                const embeddings = await embeddingProvider.generateEmbeddings(chunkTexts);
                // Approximate tokens
                const tokens = chunkTexts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);
                totalTokensUsed += tokens;
                // Upsert IndexedFile record
                const indexedFile = await database_1.prisma.indexedFile.upsert({
                    where: {
                        repositoryId_filePath: {
                            repositoryId,
                            filePath: item.path,
                        },
                    },
                    create: {
                        repositoryId,
                        filePath: item.path,
                        commitSha: commitSha,
                        language,
                        sizeBytes: fileRes.size || Buffer.byteLength(content, 'utf8'),
                        lineCount,
                        contentHash,
                        lastIndexedAt: new Date(),
                    },
                    update: {
                        commitSha: commitSha,
                        language,
                        sizeBytes: fileRes.size || Buffer.byteLength(content, 'utf8'),
                        lineCount,
                        contentHash,
                        lastIndexedAt: new Date(),
                    },
                });
                // Delete prior chunks for this file
                await database_1.prisma.codeChunk.deleteMany({
                    where: { fileId: indexedFile.id },
                });
                // Insert fresh chunks with embeddings
                await database_1.prisma.codeChunk.createMany({
                    data: chunks.map((chunk, idx) => ({
                        fileId: indexedFile.id,
                        repositoryId,
                        filePath: chunk.filePath,
                        startLine: chunk.startLine,
                        endLine: chunk.endLine,
                        content: chunk.content,
                        tokenCount: chunk.tokenCount,
                        embeddingJson: embeddings[idx] ? JSON.stringify(embeddings[idx]) : null,
                        symbolContext: chunk.symbolContext || null,
                        commitSha: commitSha,
                    })),
                });
                totalChunksCreated += chunks.length;
            }
            catch (err) {
                console.warn(`[Indexer] Notice indexing ${item.path}: ${err?.message}`);
            }
        }));
        const percent = Math.min(90, Math.round(40 + ((i + batch.length) / (filesToIndex.length || 1)) * 50));
        await onProgress?.(percent, `Indexed ${Math.min(i + batch.length, filesToIndex.length)}/${filesToIndex.length} files (${totalChunksCreated} chunks)...`);
    }
    // 7. Update repository record with last indexed commit
    await database_1.prisma.repository.update({
        where: { id: repositoryId },
        data: {
            lastIndexedAt: new Date(),
            lastIndexedCommitSha: commitSha,
        },
    });
    // Count cumulative code chunks currently stored in database for this repository
    const totalChunksInRepo = await database_1.prisma.codeChunk.count({
        where: { repositoryId },
    });
    const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    await onProgress?.(100, `Successfully completed indexing ${eligibleItems.length} files (${totalChunksInRepo} total code chunks available, ${totalChunksCreated} newly created).`);
    return {
        commitSha: commitSha,
        totalFiles: eligibleItems.length,
        indexedFiles: filesToIndex.length,
        unchangedFiles: unchangedCount,
        deletedFiles: filesToDelete.length,
        totalChunks: totalChunksInRepo,
        chunksCreated: totalChunksCreated,
        durationSeconds,
        tokensUsed: totalTokensUsed,
    };
}
