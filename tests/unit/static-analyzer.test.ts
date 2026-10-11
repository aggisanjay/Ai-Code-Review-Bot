import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitDiff } from '../../packages/github-client/src/diff-parser';
import { runDeterministicAnalysis } from '../../packages/ai-review/src/deterministic/static-analyzer';

test('static-analyzer: detects hardcoded cryptographic fallback secret', () => {
  const diff = `diff --git a/src/token.ts b/src/token.ts
new file mode 100644
--- /dev/null
+++ b/src/token.ts
@@ -0,0 +1,5 @@
+export function getSecret() {
+  const secret = process.env.AUTH_SECRET || "default_insecure_fallback";
+  return secret;
+}
`;

  const files = parseGitDiff(diff);
  const findings = runDeterministicAnalysis(files);

  assert.ok(findings.length > 0, 'Should detect fallback secret');
  const fallbackFinding = findings.find((f) => f.ruleId === 'SEC-JWT-FALLBACK');
  assert.ok(fallbackFinding, 'Should have ruleId SEC-JWT-FALLBACK');
  assert.equal(fallbackFinding.severity, 'CRITICAL');
  assert.equal(fallbackFinding.filePath, 'src/token.ts');
});

test('static-analyzer: detects dangerous eval() execution', () => {
  const diff = `diff --git a/src/calc.ts b/src/calc.ts
--- a/src/calc.ts
+++ b/src/calc.ts
@@ -10,3 +10,4 @@
+  const result = eval(userInputExpr);
`;

  const files = parseGitDiff(diff);
  const findings = runDeterministicAnalysis(files);

  const evalFinding = findings.find((f) => f.ruleId === 'SEC-EVAL-002');
  assert.ok(evalFinding, 'Should flag eval() invocation');
  assert.equal(evalFinding.severity, 'CRITICAL');
});
