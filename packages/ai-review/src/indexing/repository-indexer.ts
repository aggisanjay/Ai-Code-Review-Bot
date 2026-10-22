import crypto from 'crypto';
import { prisma } from '@reviewflow/database';
import { IGitHubAdapter } from '@reviewflow/github-client';
import { IEmbeddingProvider } from '../providers/provider-adapter';
import { isFileEligibleForIndexing, chunkSourceCode, detectLanguage } from './code-chunker';

export interface IndexRepositoryParams {
  repositoryId: string;
  commitSha?: string;
  branch?: string;
  jobId?: string;
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
  durationSeconds: number;
  tokensUsed: number;
}

export async function indexRepository(params: IndexRepositoryParams): Promise<IndexingResult> {
  const startTime = Date.now();
  const { repositoryId, githubAdapter, embeddingProvider, onProgress } = params;

  // 1. Load repository details
  const repository = await prisma.repository.findUnique({
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
    } else {
      commitSha = 'HEAD';
    }
  }

  await onProgress?.(10, `Resolved target revision @${commitSha.substring(0, 7)} on branch ${branch}...`);

  // 3. Fetch repository tree from GitHub
  const treeItems = await githubAdapter.fetchRepositoryTree(
    repository.owner,
    repository.name,
    commitSha,
    true
  );

  // 4. Filter eligible blobs
  const eligibleItems = treeItems.filter(
    (item) => item.type === 'blob' && isFileEligibleForIndexing(item.path, item.size)
  );

  await onProgress?.(25, `Discovered ${eligibleItems.length} eligible source code files.`);

  // 5. Compare with existing IndexedFiles in database for incremental indexing
  const existingFiles = await prisma.indexedFile.findMany({
    where: { repositoryId },
    select: { id: true, filePath: true, contentHash: true },
  });

  const existingFileMap = new Map(existingFiles.map((f) => [f.filePath, f]));
  const currentPathSet = new Set(eligibleItems.map((item) => item.path));

  // Determine deletions
  const filesToDelete = existingFiles.filter((f) => !currentPathSet.has(f.filePath));
  if (filesToDelete.length > 0) {
    await prisma.indexedFile.deleteMany({
      where: { id: { in: filesToDelete.map((f) => f.id) } },
    });
  }

  // Determine changed or new files
  const filesToIndex = eligibleItems.filter((item) => {
    const existing = existingFileMap.get(item.path);
    // If we have an existing record with the exact git blob sha, skip re-indexing
    return !existing || existing.contentHash !== item.sha;
  });

  const unchangedCount = eligibleItems.length - filesToIndex.length;
  await onProgress?.(
    40,
    `Incremental check: ${filesToIndex.length} modified/new files to index, ${unchangedCount} unchanged, ${filesToDelete.length} removed.`
  );

  let totalChunksCreated = 0;
  let totalTokensUsed = 0;

  // 6. Process files in concurrent batches of 4
  const BATCH_SIZE = 4;
  for (let i = 0; i < filesToIndex.length; i += BATCH_SIZE) {
    const batch = filesToIndex.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (item) => {
        try {
          // Fetch file content
          const fileRes = await githubAdapter.fetchFileContent(
            repository.owner,
            repository.name,
            item.path,
            commitSha
          );

          const content = fileRes.content;
          const language = detectLanguage(item.path);
          const lineCount = content.split(/\r?\n/).length;
          const contentHash = item.sha || crypto.createHash('sha256').update(content).digest('hex');

          // Chunk file
          const chunks = chunkSourceCode(item.path, content);
          if (chunks.length === 0) return;

          // Generate embeddings for chunks
          const chunkTexts = chunks.map(
            (c) => `${c.filePath}${c.symbolContext ? ` (${c.symbolContext})` : ''}\n${c.content}`
          );
          const embeddings = await embeddingProvider.generateEmbeddings(chunkTexts);

          // Approximate tokens
          const tokens = chunkTexts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);
          totalTokensUsed += tokens;

          // Upsert IndexedFile record
          const indexedFile = await prisma.indexedFile.upsert({
            where: {
              repositoryId_filePath: {
                repositoryId,
                filePath: item.path,
              },
            },
            create: {
              repositoryId,
              filePath: item.path,
              commitSha: commitSha!,
              language,
              sizeBytes: fileRes.size || Buffer.byteLength(content, 'utf8'),
              lineCount,
              contentHash,
              lastIndexedAt: new Date(),
            },
            update: {
              commitSha: commitSha!,
              language,
              sizeBytes: fileRes.size || Buffer.byteLength(content, 'utf8'),
              lineCount,
              contentHash,
              lastIndexedAt: new Date(),
            },
          });

          // Delete prior chunks for this file
          await prisma.codeChunk.deleteMany({
            where: { fileId: indexedFile.id },
          });

          // Insert fresh chunks with embeddings
          await prisma.codeChunk.createMany({
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
              commitSha: commitSha!,
            })),
          });

          totalChunksCreated += chunks.length;
        } catch (err: any) {
          console.warn(`[Indexer] Notice indexing ${item.path}: ${err?.message}`);
        }
      })
    );

    const percent = Math.min(90, Math.round(40 + ((i + batch.length) / (filesToIndex.length || 1)) * 50));
    await onProgress?.(
      percent,
      `Indexed ${Math.min(i + batch.length, filesToIndex.length)}/${filesToIndex.length} files (${totalChunksCreated} chunks)...`
    );
  }

  // 7. Update repository record with last indexed commit
  await prisma.repository.update({
    where: { id: repositoryId },
    data: {
      lastIndexedAt: new Date(),
      lastIndexedCommitSha: commitSha,
    },
  });

  const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
  await onProgress?.(100, `Successfully completed indexing ${eligibleItems.length} files (${totalChunksCreated} chunks created).`);

  return {
    commitSha: commitSha!,
    totalFiles: eligibleItems.length,
    indexedFiles: filesToIndex.length,
    unchangedFiles: unchangedCount,
    deletedFiles: filesToDelete.length,
    totalChunks: totalChunksCreated,
    durationSeconds,
    tokensUsed: totalTokensUsed,
  };
}
