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
export declare const DETERMINISTIC_RULES: DeterministicRule[];
export declare function runDeterministicAnalysis(files: ParsedDiffFile[]): ReviewFinding[];
