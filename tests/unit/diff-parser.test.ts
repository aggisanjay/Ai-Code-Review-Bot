import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitDiff } from '../../packages/github-client/src/diff-parser';
import { SAMPLE_DIFF_JWT_AUTH } from '../../packages/github-client/src/mock-github-adapter';

test('diff-parser: accurately parses unified git diff into files and hunks', () => {
  const files = parseGitDiff(SAMPLE_DIFF_JWT_AUTH);

  assert.equal(files.length, 3, 'Should parse 3 changed files');

  const tokenServiceFile = files[0];
  assert.equal(tokenServiceFile.newPath, 'src/services/token.service.ts');
  assert.ok(tokenServiceFile.hunks.length > 0, 'Should have at least one hunk');

  // Verify added lines and new line numbers
  const addedLines = tokenServiceFile.hunks[0].lines.filter((l) => l.type === 'add');
  assert.equal(addedLines.length, 2, 'Should have 2 added lines');
  assert.equal(addedLines[0].newLineNumber, 41, 'First added line should have line number 41');
  assert.equal(addedLines[1].newLineNumber, 42, 'Second added line should have line number 42');
  assert.match(addedLines[1].content, /JWT_REFRESH_SECRET/, 'Should contain JWT secret line');
});

test('diff-parser: handles empty or invalid diff gracefully', () => {
  const emptyResult = parseGitDiff('');
  assert.deepEqual(emptyResult, [], 'Empty diff should return empty array');

  const invalidResult = parseGitDiff(null as unknown as string);
  assert.deepEqual(invalidResult, [], 'Null diff should return empty array');
});
