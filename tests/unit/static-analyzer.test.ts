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

test('static-analyzer: detects CORRECTNESS flaw (NaN direct comparison)', () => {
  const diff = `diff --git a/src/validator.ts b/src/validator.ts
--- a/src/validator.ts
+++ b/src/validator.ts
@@ -5,3 +5,4 @@
+  if (val === NaN) { throw new Error("invalid"); }
`;

  const files = parseGitDiff(diff);
  const findings = runDeterministicAnalysis(files);

  const nanFinding = findings.find((f) => f.ruleId === 'CORR-NAN-COMPARE');
  assert.ok(nanFinding, 'Should detect direct NaN comparison');
  assert.equal(nanFinding.category, 'CORRECTNESS');
  assert.equal(nanFinding.severity, 'HIGH');
});

test('static-analyzer: detects PERFORMANCE flaw (synchronous file I/O)', () => {
  const diff = `diff --git a/src/handler.ts b/src/handler.ts
--- a/src/handler.ts
+++ b/src/handler.ts
@@ -12,3 +12,4 @@
+  const config = fs.readFileSync("/etc/config.json", "utf-8");
`;

  const files = parseGitDiff(diff);
  const findings = runDeterministicAnalysis(files);

  const ioFinding = findings.find((f) => f.ruleId === 'PERF-BLOCKING-SYNC-IO');
  assert.ok(ioFinding, 'Should detect blocking synchronous fs call');
  assert.equal(ioFinding.category, 'PERFORMANCE');
  assert.equal(ioFinding.severity, 'HIGH');
});

test('static-analyzer: detects TESTING flaw (skipped test suite)', () => {
  const diff = `diff --git a/test/auth.test.ts b/test/auth.test.ts
--- a/test/auth.test.ts
+++ b/test/auth.test.ts
@@ -1,3 +1,4 @@
+it.skip("should verify token expiration", async () => {
`;

  const files = parseGitDiff(diff);
  const findings = runDeterministicAnalysis(files);

  const skipFinding = findings.find((f) => f.ruleId === 'TEST-SKIPPED-SUITE');
  assert.ok(skipFinding, 'Should detect it.skip test omission');
  assert.equal(skipFinding.category, 'TESTING');
});

test('static-analyzer: detects MAINTAINABILITY flaw (production console.log)', () => {
  const diff = `diff --git a/src/server.ts b/src/server.ts
--- a/src/server.ts
+++ b/src/server.ts
@@ -20,3 +20,4 @@
+  console.log("Processing user request:", req.user);
`;

  const files = parseGitDiff(diff);
  const findings = runDeterministicAnalysis(files);

  const logFinding = findings.find((f) => f.ruleId === 'MAINT-CONSOLE-LOG');
  assert.ok(logFinding, 'Should flag production console.log statement');
  assert.equal(logFinding.category, 'MAINTAINABILITY');
});

