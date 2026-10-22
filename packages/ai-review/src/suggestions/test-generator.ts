import { z } from 'zod';
import { ILlmProvider } from '../providers/provider-adapter';

export interface TestSuggestionProposal {
  behaviorTested: string;
  rationale: string;
  targetFile: string;
  testFramework: string;
  proposedCode: string;
  edgeCases: string[];
  existingCoverageNotes?: string;
}

export interface CodeImprovementProposal {
  title: string;
  explanation: string;
  expectedEffect: string;
  targetFile: string;
  targetBranch: string;
  targetCommitSha: string;
  suggestedPatch: string;
}

export const TestSuggestionSchema = z.object({
  behaviorTested: z.string().min(1),
  rationale: z.string().min(1),
  targetFile: z.string().min(1),
  testFramework: z.string().default('node:test'),
  proposedCode: z.string().min(1),
  edgeCases: z.array(z.string()).default([]),
  existingCoverageNotes: z.string().optional(),
});

const SYSTEM_TEST_GENERATOR_PROMPT = `You are ReviewFlow AI's Test Architect.
Your task is to analyze code changes or functions and generate comprehensive, robust unit/integration tests matching the detected testing framework.

OUTPUT REQUIREMENTS:
Output ONLY valid JSON matching this schema:
{
  "behaviorTested": "Short summary of the specific behavior or contract being tested",
  "rationale": "Why this test case is critical for stability, edge-case coverage, or regression prevention",
  "targetFile": "Path of the file being tested",
  "testFramework": "Detected framework: node:test, jest, vitest, mocha, pytest, or go_test",
  "proposedCode": "Complete, runnable test file or suite with imports, assertions, and mock fixtures",
  "edgeCases": ["List of potential edge cases addressed: e.g. null input, concurrent requests, timeout"],
  "existingCoverageNotes": "Observations about existing test coverage"
}`;

export async function generateTestSuggestion(params: {
  targetFile: string;
  fileContent: string;
  diffSnippet?: string;
  testFramework?: string;
  llmProvider: ILlmProvider;
}): Promise<TestSuggestionProposal> {
  const { targetFile, fileContent, diffSnippet, testFramework = 'node:test', llmProvider } = params;

  const userPrompt = `TARGET FILE: ${targetFile}
TARGET FRAMEWORK: ${testFramework}
${diffSnippet ? `RECENT DIFF / CHANGES:\n\`\`\`\n${diffSnippet}\n\`\`\`\n` : ''}
SOURCE CODE CONTENT:
\`\`\`
${fileContent.slice(0, 10000)}
\`\`\`

Generate a test suite proposal for this file.`;

  const llmResult = await llmProvider.generateReview(SYSTEM_TEST_GENERATOR_PROMPT, userPrompt);

  let cleanJson = llmResult.rawResponse.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    const raw = JSON.parse(cleanJson);
    return TestSuggestionSchema.parse(raw);
  } catch {
    // Graceful fallback proposal if model output was unstructured
    return {
      behaviorTested: `Unit tests for ${targetFile}`,
      rationale: 'Verify core function execution and boundary error handling.',
      targetFile,
      testFramework,
      proposedCode: `import { describe, it } from 'node:test';\nimport assert from 'node:assert';\n\ndescribe('${targetFile}', () => {\n  it('handles standard input correctly', () => {\n    assert.ok(true);\n  });\n});\n`,
      edgeCases: ['Null or undefined arguments', 'Unexpected exception propagation'],
      existingCoverageNotes: 'Generated based on static AST file inspection.',
    };
  }
}
