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
export declare const TestSuggestionSchema: z.ZodObject<{
    behaviorTested: z.ZodString;
    rationale: z.ZodString;
    targetFile: z.ZodString;
    testFramework: z.ZodDefault<z.ZodString>;
    proposedCode: z.ZodString;
    edgeCases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    existingCoverageNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    behaviorTested: string;
    rationale: string;
    targetFile: string;
    testFramework: string;
    proposedCode: string;
    edgeCases: string[];
    existingCoverageNotes?: string | undefined;
}, {
    behaviorTested: string;
    rationale: string;
    targetFile: string;
    proposedCode: string;
    testFramework?: string | undefined;
    edgeCases?: string[] | undefined;
    existingCoverageNotes?: string | undefined;
}>;
export declare function generateTestSuggestion(params: {
    targetFile: string;
    fileContent: string;
    diffSnippet?: string;
    testFramework?: string;
    llmProvider: ILlmProvider;
}): Promise<TestSuggestionProposal>;
