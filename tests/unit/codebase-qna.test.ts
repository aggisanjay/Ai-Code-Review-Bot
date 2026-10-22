import { test } from 'node:test';
import assert from 'node:assert';
import {
  askCodebaseQuestion,
  MockLlmProvider,
  MockEmbeddingProvider,
} from '../../packages/ai-review/src';

test('codebase-qna: returns clear guidance when repository has zero indexed code files', async () => {
  const result = await askCodebaseQuestion({
    repositoryId: 'non-existent-repo-id',
    repoFullName: 'test-org/empty-repo',
    question: 'How does authentication work in this repository?',
    llmProvider: new MockLlmProvider(),
    embeddingProvider: new MockEmbeddingProvider(),
  });

  assert.ok(result.answer.includes('does not have any indexed code files yet'));
  assert.strictEqual(result.citations.length, 0);
  assert.strictEqual(result.retrievedChunksCount, 0);
});
