import { test } from 'node:test';
import assert from 'node:assert';
import {
  isFileEligibleForIndexing,
  detectLanguage,
  chunkSourceCode,
  MAX_INDEXABLE_FILE_SIZE,
} from '../../packages/ai-review/src/indexing/code-chunker';

test('code-chunker: isFileEligibleForIndexing correctly filters excluded directories and binaries', () => {
  // Should allow legitimate source files
  assert.strictEqual(isFileEligibleForIndexing('src/index.ts'), true);
  assert.strictEqual(isFileEligibleForIndexing('packages/api/src/main.py'), true);
  assert.strictEqual(isFileEligibleForIndexing('docs/architecture.md'), true);

  // Should exclude vendored/generated directories
  assert.strictEqual(isFileEligibleForIndexing('node_modules/express/index.js'), false);
  assert.strictEqual(isFileEligibleForIndexing('.git/HEAD'), false);
  assert.strictEqual(isFileEligibleForIndexing('.next/server/pages.js'), false);
  assert.strictEqual(isFileEligibleForIndexing('dist/bundle.js'), false);
  assert.strictEqual(isFileEligibleForIndexing('coverage/lcov.info'), false);

  // Should exclude binaries and lockfiles
  assert.strictEqual(isFileEligibleForIndexing('assets/logo.png'), false);
  assert.strictEqual(isFileEligibleForIndexing('package-lock.json'), false);
  assert.strictEqual(isFileEligibleForIndexing('binary.wasm'), false);

  // Should exclude oversized files
  assert.strictEqual(isFileEligibleForIndexing('big.ts', MAX_INDEXABLE_FILE_SIZE + 1), false);
  assert.strictEqual(isFileEligibleForIndexing('small.ts', 1024), true);
});

test('code-chunker: detectLanguage correctly maps extensions', () => {
  assert.strictEqual(detectLanguage('app/main.ts'), 'typescript');
  assert.strictEqual(detectLanguage('components/Header.tsx'), 'typescriptreact');
  assert.strictEqual(detectLanguage('server.js'), 'javascript');
  assert.strictEqual(detectLanguage('worker.py'), 'python');
  assert.strictEqual(detectLanguage('main.go'), 'go');
  assert.strictEqual(detectLanguage('lib.rs'), 'rust');
  assert.strictEqual(detectLanguage('query.sql'), 'sql');
  assert.strictEqual(detectLanguage('unknown.xyz'), 'plaintext');
});

test('code-chunker: chunkSourceCode creates structured chunks preserving line boundaries and symbols', () => {
  const sampleCode = `export class AuthService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  async login(userId: string) {
    return { token: "sample" };
  }
}
`;

  const chunks = chunkSourceCode('src/auth.service.ts', sampleCode, 5, 2);
  assert.ok(chunks.length > 0);
  assert.strictEqual(chunks[0].filePath, 'src/auth.service.ts');
  assert.strictEqual(chunks[0].language, 'typescript');
  assert.strictEqual(chunks[0].startLine, 1);
  assert.ok(chunks[0].endLine >= chunks[0].startLine);
  assert.ok(chunks[0].content.length > 0);
  assert.ok(chunks[0].tokenCount > 0);
  assert.strictEqual(chunks[0].symbolContext, 'class AuthService');
});
