import { ReviewSummary, ReviewPolicy } from '@reviewflow/shared';
import { ILlmProvider } from '../providers/provider-adapter';
export interface RunReviewPipelineParams {
    repoName: string;
    prNumber: number;
    prTitle: string;
    diffText: string;
    policy: ReviewPolicy;
    llmProvider?: ILlmProvider;
}
export interface ReviewPipelineResult {
    summary: ReviewSummary;
    tokensUsed: number;
    estimatedCostUsd: number;
    durationSeconds: number;
}
export declare function runReviewPipeline(params: RunReviewPipelineParams): Promise<ReviewPipelineResult>;
