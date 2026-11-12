import { prisma } from '@reviewflow/database';
import {
  indexRepository,
  GeminiEmbeddingProvider,
  OpenAiEmbeddingProvider,
  MockEmbeddingProvider,
  IEmbeddingProvider,
} from '@reviewflow/ai-review';
import {
  IGitHubAdapter,
  GitHubAppClient,
  MockGitHubAdapter,
} from '@reviewflow/github-client';

export interface ProcessIndexJobOptions {
  githubAdapter?: IGitHubAdapter;
  embeddingProvider?: IEmbeddingProvider;
}

export async function processIndexJob(jobId: string, options?: ProcessIndexJobOptions): Promise<void> {
  const job = await prisma.repositoryIndexJob.findUnique({
    where: { id: jobId },
    include: {
      repository: {
        include: {
          organization: {
            include: { installations: true },
          },
        },
      },
    },
  });

  if (!job) {
    console.error(`[Worker] RepositoryIndexJob ${jobId} not found.`);
    return;
  }

  const { repository } = job;
  console.log(`[Worker] Starting repository indexing job ${job.id} for ${repository.fullName}@${job.commitSha.substring(0, 7)}`);

  try {
    // 1. Resolve GitHub Adapter
    let github: IGitHubAdapter;
    if (options?.githubAdapter) {
      github = options.githubAdapter;
    } else {
      const appId = process.env.GITHUB_APP_ID;
      const privateKey = process.env.GITHUB_PRIVATE_KEY;
      const installation =
        repository.organization?.installations?.find(
          (i) => i.accountLogin.toLowerCase() === repository.owner.toLowerCase()
        ) || repository.organization?.installations?.[0];

      if (appId && privateKey) {
        github = new GitHubAppClient({
          appId,
          privateKey,
          installationId: installation?.installationId,
        });
      } else if (process.env.GITHUB_MOCK_MODE !== 'false' && process.env.NODE_ENV !== 'production') {
        github = new MockGitHubAdapter();
      } else {
        throw new Error('Configuration Error: Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY.');
      }
    }

    // 2. Resolve Embedding Provider
    let embeddingProvider: IEmbeddingProvider;
    if (options?.embeddingProvider) {
      embeddingProvider = options.embeddingProvider;
    } else {
      const geminiKey = process.env.GEMINI_API_KEY;
      const openAiKey = process.env.OPENAI_API_KEY;

      if (geminiKey && geminiKey.trim() !== '') {
        embeddingProvider = new GeminiEmbeddingProvider(geminiKey);
      } else if (openAiKey && openAiKey.trim() !== '') {
        embeddingProvider = new OpenAiEmbeddingProvider(openAiKey);
      } else if (process.env.NODE_ENV !== 'production') {
        embeddingProvider = new MockEmbeddingProvider();
      } else {
        throw new Error('Configuration Error: No AI embedding provider configured.');
      }
    }

    // 3. Mark job as started
    await prisma.repositoryIndexJob.update({
      where: { id: job.id },
      data: {
        status: 'CLONING',
        progressPercent: 10,
        statusMessage: 'Scanning repository tree from GitHub...',
        startedAt: new Date(),
      },
    });

    const isForce = job.statusMessage?.includes('FORCE_REINDEX') || false;

    // 4. Run repository indexing pipeline
    const indexResult = await indexRepository({
      repositoryId: repository.id,
      commitSha: job.commitSha,
      branch: job.branch,
      jobId: job.id,
      force: isForce,
      githubAdapter: github,
      embeddingProvider,
      onProgress: async (percent, message) => {
        await prisma.repositoryIndexJob.update({
          where: { id: job.id },
          data: {
            progressPercent: percent,
            statusMessage: message,
            status: percent >= 40 && percent < 90 ? 'EMBEDDING' : 'CHUNKING',
          },
        });
      },
    });

    // 5. Complete job
    await prisma.repositoryIndexJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        progressPercent: 100,
        statusMessage: `Successfully indexed ${indexResult.totalFiles} files (${indexResult.totalChunks} code chunks available).`,
        totalFiles: indexResult.totalFiles,
        indexedFiles: indexResult.indexedFiles,
        totalChunks: indexResult.totalChunks,
        durationSeconds: indexResult.durationSeconds,
        tokensUsed: indexResult.tokensUsed,
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(
      `[Worker] ✅ Finished RepositoryIndexJob ${job.id} in ${indexResult.durationSeconds}s (${indexResult.totalChunks} chunks)`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] ❌ Failed RepositoryIndexJob ${job.id}:`, errorMsg);
    await prisma.repositoryIndexJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        progressPercent: 100,
        errorMessage: errorMsg,
        statusMessage: `Indexing failed: ${errorMsg}`,
        completedAt: new Date(),
      },
    });
  }
}

