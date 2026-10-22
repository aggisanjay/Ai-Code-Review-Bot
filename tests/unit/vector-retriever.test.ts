import { test } from 'node:test';
import assert from 'node:assert';
import {
  MockEmbeddingProvider,
  cosineSimilarity,
} from '../../packages/ai-review/src/providers/provider-adapter';

test('vector-retriever: cosineSimilarity calculates exact vector angles', () => {
  // Identical vectors -> similarity = 1.0
  const vecA = [1, 0, 0];
  const vecB = [1, 0, 0];
  assert.strictEqual(Math.round(cosineSimilarity(vecA, vecB) * 1000) / 1000, 1.0);

  // Orthogonal vectors -> similarity = 0.0
  const vecC = [0, 1, 0];
  assert.strictEqual(cosineSimilarity(vecA, vecC), 0.0);

  // Opposite vectors -> similarity = -1.0
  const vecD = [-1, 0, 0];
  assert.strictEqual(Math.round(cosineSimilarity(vecA, vecD) * 1000) / 1000, -1.0);

  // Empty or invalid vector length handles safely
  assert.strictEqual(cosineSimilarity([], []), 0);
  assert.strictEqual(cosineSimilarity([1, 2], [1]), 0);
});

test('vector-retriever: MockEmbeddingProvider generates normalized vectors deterministically', async () => {
  const provider = new MockEmbeddingProvider();
  assert.strictEqual(provider.dimension, 768);

  const [embA, embB] = await provider.generateEmbeddings([
    'authentication token signing',
    'authentication token signing',
  ]);

  // Determinism check
  assert.deepStrictEqual(embA, embB);
  assert.strictEqual(embA.length, 768);

  // Unit length norm check
  let norm = 0;
  for (let i = 0; i < embA.length; i++) {
    norm += embA[i] * embA[i];
  }
  assert.ok(Math.abs(norm - 1.0) < 0.001);

  // Semantic discrimination check
  const [embC] = await provider.generateEmbeddings(['database postgresql migration schema']);
  const simIdentical = cosineSimilarity(embA, embB);
  const simDifferent = cosineSimilarity(embA, embC);

  assert.ok(simIdentical > simDifferent);
});
