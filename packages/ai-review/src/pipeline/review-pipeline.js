"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReviewPipeline = runReviewPipeline;
const github_client_1 = require("@reviewflow/github-client");
const shared_1 = require("@reviewflow/shared");
const static_analyzer_1 = require("../deterministic/static-analyzer");
const review_prompt_1 = require("../prompts/review-prompt");
const provider_adapter_1 = require("../providers/provider-adapter");
const evidence_validator_1 = require("./evidence-validator");
const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
function parseAndRepairLlmJson(rawResponse) {
    let cleanJsonStr = rawResponse.trim();
    if (cleanJsonStr.startsWith('```')) {
        cleanJsonStr = cleanJsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    // 1. Direct parse attempt
    try {
        return JSON.parse(cleanJsonStr);
    }
    catch (initialErr) {
        // 2. Fix unescaped control characters (literal newlines or tabs inside JSON strings)
        try {
            const sanitized = cleanJsonStr.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match) => {
                return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
            });
            return JSON.parse(sanitized);
        }
        catch { }
        // 3. Salvage truncated JSON (e.g. Unterminated string or cut-off finding object)
        const findingsIdx = cleanJsonStr.indexOf('"findings"');
        if (findingsIdx !== -1) {
            let searchPos = cleanJsonStr.length;
            while (searchPos > findingsIdx) {
                const lastBrace = cleanJsonStr.lastIndexOf('}', searchPos);
                if (lastBrace === -1 || lastBrace <= findingsIdx)
                    break;
                const candidateSlice = cleanJsonStr.slice(0, lastBrace + 1);
                const openBrackets = (candidateSlice.match(/\[/g) || []).length;
                const closeBrackets = (candidateSlice.match(/\]/g) || []).length;
                const openBraces = (candidateSlice.match(/\{/g) || []).length;
                const closeBraces = (candidateSlice.match(/\}/g) || []).length;
                let suffix = '';
                for (let i = 0; i < openBrackets - closeBrackets; i++)
                    suffix += ']';
                for (let i = 0; i < openBraces - closeBraces; i++)
                    suffix += '}';
                try {
                    const repaired = JSON.parse(candidateSlice + suffix);
                    console.warn('⚠️ Successfully salvaged truncated LLM JSON response (repaired truncated findings array).');
                    return repaired;
                }
                catch {
                    searchPos = lastBrace - 1;
                }
            }
            // If salvaging inside findings failed, attempt salvaging everything before findings
            const beforeFindings = cleanJsonStr.slice(0, findingsIdx);
            const lastComma = beforeFindings.lastIndexOf(',');
            if (lastComma !== -1) {
                try {
                    const fallbackSlice = beforeFindings.slice(0, lastComma) + ', "findings": []}';
                    const repaired = JSON.parse(fallbackSlice);
                    console.warn('⚠️ Successfully salvaged top-level LLM summary; truncated findings array was safely closed.');
                    return repaired;
                }
                catch { }
            }
        }
        throw initialErr;
    }
}
async function runReviewPipeline(params) {
    const startTime = Date.now();
    const provider = params.llmProvider || new provider_adapter_1.MockLlmProvider();
    // 1. Parse unified diff
    const parsedFiles = (0, github_client_1.parseGitDiff)(params.diffText);
    // 2. Run deterministic static analysis
    const deterministicFindings = (0, static_analyzer_1.runDeterministicAnalysis)(parsedFiles);
    // 3. Build prompts for LLM
    const userPrompt = (0, review_prompt_1.buildUserPrompt)({
        repoName: params.repoName,
        prNumber: params.prNumber,
        prTitle: params.prTitle,
        diffText: params.diffText,
        customInstructions: params.policy.customInstructions,
    });
    // 4. Invoke LLM provider
    const llmResult = await provider.generateReview(review_prompt_1.SYSTEM_REVIEW_PROMPT, userPrompt);
    // 5. Validate and normalize LLM response
    let parsedLlmSummary;
    try {
        const rawJson = parseAndRepairLlmJson(llmResult.rawResponse);
        const parseResult = shared_1.ReviewSummarySchema.safeParse(rawJson);
        if (parseResult.success) {
            parsedLlmSummary = parseResult.data;
        }
        else {
            console.warn('⚠️ Strict LLM output schema validation failed, applying defensive field normalization...');
            const rawFindings = Array.isArray(rawJson?.findings) ? rawJson.findings : [];
            const validFindings = rawFindings
                .filter((f) => f && typeof f.title === 'string' && typeof f.filePath === 'string')
                .map((f) => ({
                category: ['CORRECTNESS', 'PERFORMANCE', 'TESTING', 'MAINTAINABILITY', 'SECURITY', 'ARCHITECTURE'].includes(f.category)
                    ? f.category
                    : 'MAINTAINABILITY',
                severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(f.severity)
                    ? f.severity
                    : 'MEDIUM',
                confidence: typeof f.confidence === 'number' ? Math.min(Math.max(f.confidence, 0), 100) : 85,
                filePath: String(f.filePath),
                startLine: Number(f.startLine) || 1,
                endLine: Number(f.endLine) || Number(f.startLine) || 1,
                title: String(f.title),
                explanation: String(f.explanation || f.title),
                evidence: String(f.evidence || ''),
                remediation: String(f.remediation || 'Please review this code change.'),
                suggestedPatch: f.suggestedPatch ? String(f.suggestedPatch) : undefined,
                ruleId: f.ruleId ? String(f.ruleId) : undefined,
                source: 'llm',
            }));
            parsedLlmSummary = {
                summary: typeof rawJson?.summary === 'string' ? rawJson.summary : 'Automated code review completed with partial findings.',
                overallRisk: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE'].includes(rawJson?.overallRisk)
                    ? rawJson.overallRisk
                    : (validFindings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'HIGH' : 'LOW'),
                riskRationale: typeof rawJson?.riskRationale === 'string' ? rawJson.riskRationale : 'Evaluated by AI analysis.',
                keyStrengths: Array.isArray(rawJson?.keyStrengths) ? rawJson.keyStrengths.map(String) : [],
                blockers: Array.isArray(rawJson?.blockers) ? rawJson.blockers.map(String) : [],
                testCoverageAssessment: typeof rawJson?.testCoverageAssessment === 'string' ? rawJson.testCoverageAssessment : 'Unverified',
                estimatedReviewTimeSavedMinutes: Number(rawJson?.estimatedReviewTimeSavedMinutes) || 15,
                findings: validFindings,
            };
        }
    }
    catch (err) {
        console.error('❌ Failed to parse LLM JSON response:', err?.message || err);
        parsedLlmSummary = {
            summary: 'Code review completed with deterministic static analysis only.',
            overallRisk: deterministicFindings.length > 0 ? 'HIGH' : 'SAFE',
            riskRationale: 'LLM response was unparseable; fell back to deterministic static rules.',
            keyStrengths: [],
            blockers: [],
            testCoverageAssessment: 'Unable to evaluate',
            estimatedReviewTimeSavedMinutes: 10,
            findings: [],
        };
    }
    // 6. Merge deterministic and LLM findings
    const allFindings = [...deterministicFindings, ...parsedLlmSummary.findings];
    // 7. Filter by enabled policy categories and severity threshold
    const minSeverityIndex = SEVERITY_ORDER.indexOf(params.policy.severityThreshold);
    const filteredFindings = allFindings.filter((finding) => {
        // Category check
        if (!params.policy.enabledCategories.includes(finding.category)) {
            return false;
        }
        // Severity threshold check
        const findingSevIndex = SEVERITY_ORDER.indexOf(finding.severity);
        if (findingSevIndex > minSeverityIndex) {
            return false; // Lower severity than threshold
        }
        return true;
    });
    // 8. Ground findings in parsed files and deduplicate
    const groundedFindings = (0, evidence_validator_1.validateAndGroundFindings)(filteredFindings, parsedFiles);
    const dedupedFindings = (0, evidence_validator_1.deduplicateAndRankFindings)(groundedFindings);
    // 9. Recalculate overall risk based on highest severity finding
    let calculatedRisk = parsedLlmSummary.overallRisk;
    const hasCritical = dedupedFindings.some((f) => f.severity === 'CRITICAL');
    const hasHigh = dedupedFindings.some((f) => f.severity === 'HIGH');
    if (hasCritical)
        calculatedRisk = 'CRITICAL';
    else if (hasHigh && calculatedRisk !== 'CRITICAL')
        calculatedRisk = 'HIGH';
    const finalSummary = {
        ...parsedLlmSummary,
        overallRisk: calculatedRisk,
        findings: dedupedFindings,
    };
    const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    // Blended rate ~$0.005 per 1K tokens
    const estimatedCostUsd = parseFloat(((llmResult.tokensUsed / 1000) * 0.005).toFixed(4));
    return {
        summary: finalSummary,
        tokensUsed: llmResult.tokensUsed,
        estimatedCostUsd,
        durationSeconds,
    };
}
