import { ParsedDiffFile } from '@reviewflow/github-client';
import { ReviewFinding } from '@reviewflow/shared';
export declare function validateAndGroundFindings(findings: ReviewFinding[], files: ParsedDiffFile[]): ReviewFinding[];
export declare function deduplicateAndRankFindings(findings: ReviewFinding[]): ReviewFinding[];
