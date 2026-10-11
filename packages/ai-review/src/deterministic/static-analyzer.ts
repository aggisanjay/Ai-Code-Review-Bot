import { ParsedDiffFile } from '@reviewflow/github-client';
import { ReviewFinding } from '@reviewflow/shared';

export interface DeterministicRule {
  id: string;
  category: ReviewFinding['category'];
  severity: ReviewFinding['severity'];
  title: string;
  pattern: RegExp;
  explanation: string;
  remediation: string;
}

export const DETERMINISTIC_RULES: DeterministicRule[] = [
  {
    id: 'SEC-SECRET-001',
    category: 'SECURITY',
    severity: 'CRITICAL',
    title: 'Potential Hardcoded Secret or API Key Detected',
    pattern: /(?:api[_-]?key|secret|password|bearer|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
    explanation:
      'High-entropy credentials or secrets committed directly in source files can be extracted by attackers or leaked in build artifacts.',
    remediation:
      'Store secrets in an environment variable or secret manager (e.g., Vault, AWS Secrets Manager) and access via process.env.',
  },
  {
    id: 'SEC-EVAL-002',
    category: 'SECURITY',
    severity: 'CRITICAL',
    title: 'Dangerous eval() or Function Constructor Invocation',
    pattern: /\b(?:eval|new\s+Function)\s*\(/,
    explanation:
      'Evaluating arbitrary strings allows remote code execution (RCE) if user input reaches the evaluation context.',
    remediation:
      'Avoid dynamic code evaluation. Use static data structures, JSON parsing, or safe parsers.',
  },
  {
    id: 'SEC-SQL-003',
    category: 'SECURITY',
    severity: 'CRITICAL',
    title: 'Unsanitized Raw SQL String Interpolation',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\$\{.*?\}/i,
    explanation:
      'Directly interpolating variables into SQL strings causes SQL Injection vulnerabilities, allowing unauthorized data access or deletion.',
    remediation:
      'Use parameterized queries, prepared statements, or ORM parameter binding (e.g. $1, ?, Prisma/Drizzle parameters).',
  },
  {
    id: 'SEC-JWT-FALLBACK',
    category: 'SECURITY',
    severity: 'CRITICAL',
    title: 'Hardcoded Cryptographic Fallback Secret',
    pattern: /process\.env\.[A-Z0-9_]*SECRET\s*\|\|\s*['"][^'"]+['"]/,
    explanation:
      'Providing a default fallback secret for cryptographic signing or token verification allows forgery if the environment variable is omitted or misconfigured.',
    remediation:
      'Throw an exception at initialization if the secret environment variable is missing; never supply a default fallback string.',
  },
  {
    id: 'MAINT-EMPTY-CATCH',
    category: 'CORRECTNESS',
    severity: 'MEDIUM',
    title: 'Empty or Silent Exception Catch Block',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
    explanation:
      'Empty catch blocks silently swallow exceptions, causing subtle corruption, silent failure loops, and impossible-to-diagnose production bugs.',
    remediation:
      'Log the error with structured context and re-throw or return an explicit failure result.',
  },
  {
    id: 'SEC-DANGEROUS-HTML',
    category: 'SECURITY',
    severity: 'HIGH',
    title: 'Use of dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML/,
    explanation:
      'Injecting raw HTML directly into the DOM can lead to Cross-Site Scripting (XSS) if the input contains unescaped user content.',
    remediation:
      'Sanitize the HTML using a library like DOMPurify or render text nodes safely using standard React JSX.',
  },
  {
    id: 'SEC-PROMPT-INJECTION',
    category: 'SECURITY',
    severity: 'CRITICAL',
    title: 'Adversarial AI Prompt Injection or Override Attempt',
    pattern: /(?:ignore\s+(?:previous|all)\s+instructions|system\s+prompt\s+override|disregard\s+(?:all\s+)?rules|you\s+are\s+now\s+in\s+developer\s+mode|output\s+overallrisk:\s*['"]?safe['"]?)/i,
    explanation:
      'The diff contains phrasing typical of indirect prompt injection attacks designed to subvert automated AI code reviews or hijack model execution.',
    remediation:
      'Strip adversarial instructions from code comments, documentation, and test fixtures. Enforce human verification for this pull request.',
  },
];

export function runDeterministicAnalysis(files: ParsedDiffFile[]): ReviewFinding[] {
  const findings: ReviewFinding[] = [];

  for (const file of files) {
    if (file.status === 'deleted') continue;

    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type !== 'add') continue;

        const lineNum = line.newLineNumber || 1;
        const lineContent = line.content;

        for (const rule of DETERMINISTIC_RULES) {
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
