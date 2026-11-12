"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETERMINISTIC_RULES = void 0;
exports.runDeterministicAnalysis = runDeterministicAnalysis;
exports.DETERMINISTIC_RULES = [
    // --- SECURITY ---
    {
        id: 'SEC-SECRET-001',
        category: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Potential Hardcoded Secret or API Key Detected',
        pattern: /(?:api[_-]?key|secret|password|bearer|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
        explanation: 'High-entropy credentials or secrets committed directly in source files can be extracted by attackers or leaked in build artifacts.',
        remediation: 'Store secrets in an environment variable or secret manager (e.g., Vault, AWS Secrets Manager) and access via process.env.',
    },
    {
        id: 'SEC-EVAL-002',
        category: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Dangerous eval() or Function Constructor Invocation',
        pattern: /\b(?:eval|new\s+Function)\s*\(/,
        explanation: 'Evaluating arbitrary strings allows remote code execution (RCE) if user input reaches the evaluation context.',
        remediation: 'Avoid dynamic code evaluation. Use static data structures, JSON parsing, or safe parsers.',
    },
    {
        id: 'SEC-SQL-003',
        category: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Unsanitized Raw SQL String Interpolation',
        pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\$\{.*?\}/i,
        explanation: 'Directly interpolating variables into SQL strings causes SQL Injection vulnerabilities, allowing unauthorized data access or deletion.',
        remediation: 'Use parameterized queries, prepared statements, or ORM parameter binding (e.g. $1, ?, Prisma/Drizzle parameters).',
    },
    {
        id: 'SEC-JWT-FALLBACK',
        category: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Hardcoded Cryptographic Fallback Secret',
        pattern: /process\.env\.[A-Z0-9_]*SECRET\s*\|\|\s*['"][^'"]+['"]/,
        explanation: 'Providing a default fallback secret for cryptographic signing or token verification allows forgery if the environment variable is omitted or misconfigured.',
        remediation: 'Throw an exception at initialization if the secret environment variable is missing; never supply a default fallback string.',
    },
    {
        id: 'SEC-DANGEROUS-HTML',
        category: 'SECURITY',
        severity: 'HIGH',
        title: 'Use of dangerouslySetInnerHTML',
        pattern: /dangerouslySetInnerHTML/,
        explanation: 'Injecting raw HTML directly into the DOM can lead to Cross-Site Scripting (XSS) if the input contains unescaped user content.',
        remediation: 'Sanitize the HTML using a library like DOMPurify or render text nodes safely using standard React JSX.',
    },
    {
        id: 'SEC-PROMPT-INJECTION',
        category: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Adversarial AI Prompt Injection or Override Attempt',
        pattern: /(?:ignore\s+(?:previous|all)\s+instructions|system\s+prompt\s+override|disregard\s+(?:all\s+)?rules|you\s+are\s+now\s+in\s+developer\s+mode|output\s+overallrisk:\s*['"]?safe['"]?)/i,
        explanation: 'The diff contains phrasing typical of indirect prompt injection attacks designed to subvert automated AI code reviews or hijack model execution.',
        remediation: 'Strip adversarial instructions from code comments, documentation, and test fixtures. Enforce human verification for this pull request.',
    },
    // --- CORRECTNESS ---
    {
        id: 'CORR-EMPTY-CATCH',
        category: 'CORRECTNESS',
        severity: 'MEDIUM',
        title: 'Empty or Silent Exception Catch Block',
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
        explanation: 'Empty catch blocks silently swallow exceptions, causing subtle state corruption, silent failure loops, and impossible-to-diagnose production bugs.',
        remediation: 'Log the error with structured context and re-throw or return an explicit failure result.',
    },
    {
        id: 'CORR-NAN-COMPARE',
        category: 'CORRECTNESS',
        severity: 'HIGH',
        title: 'Invalid Direct Comparison with NaN',
        pattern: /(?:===|!==|==|!=)\s*NaN\b|\bNaN\s*(?:===|!==|==|!=)/,
        explanation: 'In JavaScript/TypeScript, NaN is not equal to anything, including NaN (NaN === NaN is always false). Direct comparisons are logically incorrect.',
        remediation: 'Use Number.isNaN(value) to reliably check for NaN values.',
    },
    {
        id: 'CORR-ASYNC-FOR-EACH',
        category: 'CORRECTNESS',
        severity: 'HIGH',
        title: 'Async Callback in Array.prototype.forEach',
        pattern: /\.(?:forEach)\s*\(\s*async\b/,
        explanation: 'Array.prototype.forEach does not wait for async promises to resolve, leading to unhandled rejections, race conditions, and out-of-order execution.',
        remediation: 'Use a for...of loop with await, or Promise.all(items.map(async ...)) to properly await asynchronous operations.',
    },
    // --- PERFORMANCE ---
    {
        id: 'PERF-BLOCKING-SYNC-IO',
        category: 'PERFORMANCE',
        severity: 'HIGH',
        title: 'Synchronous File System I/O on Event Loop',
        pattern: /\b(?:fs)\.(?:readFileSync|writeFileSync|appendFileSync|existsSync|statSync)\s*\(/,
        explanation: 'Synchronous fs methods block the Node.js single-threaded event loop, stalling all concurrent HTTP requests and degrading server throughput.',
        remediation: 'Migrate to asynchronous non-blocking alternatives using fs.promises (e.g. await fs.promises.readFile).',
    },
    {
        id: 'PERF-JSON-CLONE',
        category: 'PERFORMANCE',
        severity: 'MEDIUM',
        title: 'Costly JSON Serialization for Deep Cloning',
        pattern: /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/,
        explanation: 'Using JSON.parse(JSON.stringify(obj)) has high CPU overhead, destroys Map/Set/Date types, and drops undefined properties.',
        remediation: 'Use native structuredClone(obj) for performant and spec-compliant deep cloning.',
    },
    {
        id: 'PERF-QUADRATIC-FIND',
        category: 'PERFORMANCE',
        severity: 'MEDIUM',
        title: 'Potential Quadratic O(N^2) Array Lookup in Loop',
        pattern: /\.(?:filter|map)\s*\([^)]*\)\s*\.\s*(?:includes|indexOf|find)\s*\(/,
        explanation: 'Chaining array search functions produces redundant intermediate allocations and quadratic time complexity on larger datasets.',
        remediation: 'Convert the lookup array to a Set for O(1) membership lookups before executing the transformation.',
    },
    // --- TESTING ---
    {
        id: 'TEST-SKIPPED-SUITE',
        category: 'TESTING',
        severity: 'HIGH',
        title: 'Skipped Test Suite or Test Case in Source',
        pattern: /\b(?:it|test|describe)\.skip\s*\(/,
        explanation: 'Skipping tests leaves code paths unverified and weakens CI regression prevention.',
        remediation: 'Fix the underlying failing test or mock dependency instead of committing .skip to the repository.',
    },
    {
        id: 'TEST-EXCLUSIVE-RUN',
        category: 'TESTING',
        severity: 'HIGH',
        title: 'Exclusive .only Test Modifier Left in Branch',
        pattern: /\b(?:it|test|describe)\.only\s*\(/,
        explanation: 'Leaving .only causes the test runner to skip all other tests in the repository during CI runs, masking regressions.',
        remediation: 'Remove .only before pushing or merging pull request changes.',
    },
    {
        id: 'TEST-EMPTY-BODY',
        category: 'TESTING',
        severity: 'MEDIUM',
        title: 'Empty Test Function Without Assertions',
        pattern: /\b(?:it|test)\s*\([^,]+,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{\s*\}\s*\)/,
        explanation: 'Test functions with empty bodies pass automatically without exercising code logic or asserting post-conditions.',
        remediation: 'Implement genuine assertions (e.g. expect(result).toBe(...)) verifying expected behavior and error states.',
    },
    // --- MAINTAINABILITY ---
    {
        id: 'MAINT-CONSOLE-LOG',
        category: 'MAINTAINABILITY',
        severity: 'LOW',
        title: 'Production Debug console.log Statement',
        pattern: /\bconsole\.(?:log|debug|dir)\s*\(/,
        explanation: 'Unstructured console.log calls clutter production logs and can inadvertently print sensitive memory or PII into standard output.',
        remediation: 'Remove ephemeral debug statements or replace with structured application logger (e.g., logger.info / logger.debug).',
    },
    {
        id: 'MAINT-UNRESOLVED-TODO',
        category: 'MAINTAINABILITY',
        severity: 'LOW',
        title: 'Unresolved Technical Debt Marker (TODO / FIXME)',
        pattern: /\/\/\s*(?:TODO|FIXME|HACK|XXX)\b/i,
        explanation: 'Unresolved inline debt markers indicate incomplete logic or known bugs that are not tracked in issue tracking systems.',
        remediation: 'Resolve the comment before merge or link to an official tracked issue ticket.',
    },
    {
        id: 'MAINT-EXPLICIT-ANY',
        category: 'MAINTAINABILITY',
        severity: 'LOW',
        title: 'Unsafe Explicit : any Type Annotation',
        pattern: /:\s*any\b/,
        explanation: 'Using the "any" escape hatch disables TypeScript type checking for all downstream accesses and propagates untyped contracts.',
        remediation: 'Specify an explicit interface, generic type, or use "unknown" with type narrowing guards.',
    },
];
function runDeterministicAnalysis(files) {
    const findings = [];
    for (const file of files) {
        if (file.status === 'deleted')
            continue;
        for (const hunk of file.hunks) {
            for (const line of hunk.lines) {
                if (line.type !== 'add')
                    continue;
                const lineNum = line.newLineNumber || 1;
                const lineContent = line.content;
                for (const rule of exports.DETERMINISTIC_RULES) {
                    if (rule.pattern.test(lineContent)) {
                        findings.push({
                            id: `det-${rule.id}-${file.newPath}-${lineNum}`,
                            category: rule.category,
                            severity: rule.severity,
                            confidence: 96,
                            filePath: file.newPath,
                            startLine: lineNum,
                            endLine: lineNum,
                            title: rule.title,
                            explanation: rule.explanation,
                            evidence: lineContent.trim(),
                            remediation: rule.remediation,
                            ruleId: rule.id,
                            source: 'DETERMINISTIC_STATIC',
                            dismissed: false,
                        });
                    }
                }
            }
        }
    }
    return findings;
}
