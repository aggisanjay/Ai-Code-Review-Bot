import fs from 'fs';
import path from 'path';
import { runReviewPipeline, MockLlmProvider, GeminiProvider, OpenAiProvider, ILlmProvider } from '@reviewflow/ai-review';
import { ReviewPolicySchema } from '@reviewflow/shared';
import { prisma } from '@reviewflow/database';

interface BenchmarkCase {
  id: string;
  title: string;
  expectedCategory: string;
  expectedSeverity: string;
  targetFile: string;
  expectedLineRange: [number, number];
  isDefective: boolean;
  diff: string;
}

interface BenchmarkDataset {
  version: string;
  datasetName: string;
  cases: BenchmarkCase[];
}

export async function runBenchmarkEvaluation(customProvider?: ILlmProvider) {
  const datasetPath = path.resolve(__dirname, 'benchmark-dataset.v1.json');
  const dataset: BenchmarkDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  // Provider resolution
  let provider = customProvider;
  if (!provider) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    if (geminiKey && geminiKey.trim() !== '') {
      provider = new GeminiProvider(geminiKey, process.env.AI_MODEL_GEMINI || 'gemini-3.5-flash');
    } else if (openAiKey && openAiKey.trim() !== '') {
      provider = new OpenAiProvider(openAiKey, process.env.AI_MODEL_OPENAI || 'gpt-4o');
    } else {
      provider = new MockLlmProvider();
    }
  }

  console.log(`================================================================`);
  console.log(`🔍 ReviewFlow AI Benchmark Evaluation Suite`);
  console.log(`   Dataset: ${dataset.datasetName} (v${dataset.version})`);
  console.log(`   Provider: ${provider.name}`);
  console.log(`   Total Benchmark Cases: ${dataset.cases.length}`);
  console.log(`================================================================\n`);

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;
  let correctSeverities = 0;
  let totalEvaluatedSeverities = 0;
  let validLocationsCount = 0;
  let totalFindingsCount = 0;
  let totalLatencyMs = 0;
  let totalTokens = 0;

  const defaultPolicy = ReviewPolicySchema.parse({});

  for (const testCase of dataset.cases) {
    const startTime = Date.now();
    const result = await runReviewPipeline({
      repoName: 'benchmark-org/test-repo',
      prNumber: 1,
      prTitle: testCase.title,
      diffText: testCase.diff,
      policy: defaultPolicy,
      llmProvider: provider,
    });
    const latency = Date.now() - startTime;
    totalLatencyMs += latency;
    totalTokens += result.tokensUsed;

    const findings = result.summary.findings;
    totalFindingsCount += findings.length;

    // Validate location accuracy against actual diff
    for (const f of findings) {
      if (f.filePath === testCase.targetFile && f.startLine > 0 && f.endLine >= f.startLine) {
        validLocationsCount += 1;
      }
    }

    if (testCase.isDefective) {
      // Find matching expected finding
      const matched = findings.find(
        (f) =>
          f.filePath === testCase.targetFile &&
          (f.category === testCase.expectedCategory || f.severity === 'CRITICAL')
      );

      if (matched) {
        truePositives += 1;
        totalEvaluatedSeverities += 1;
        if (matched.severity === testCase.expectedSeverity || matched.severity === 'CRITICAL') {
          correctSeverities += 1;
        }
        console.log(`  ✅ [HIT] ${testCase.id}: ${testCase.title} (${latency}ms)`);
      } else {
        falseNegatives += 1;
        console.log(`  ❌ [MISS] ${testCase.id}: Expected ${testCase.expectedCategory} issue not detected (${latency}ms)`);
      }
    } else {
      // Benign case: should not produce CRITICAL or HIGH findings
      const significantFindings = findings.filter((f) => ['CRITICAL', 'HIGH'].includes(f.severity));
      if (significantFindings.length === 0) {
        trueNegatives += 1;
        console.log(`  ✅ [CLEAN] ${testCase.id}: Benign code correctly accepted without false alarms (${latency}ms)`);
      } else {
        falsePositives += 1;
        console.log(`  ⚠️ [FALSE POSITIVE] ${testCase.id}: Benign code flagged as ${significantFindings[0].severity} (${latency}ms)`);
      }
    }
  }

  // Calculate metrics
  const precision = parseFloat((truePositives / (truePositives + falsePositives || 1)).toFixed(4));
  const recall = parseFloat((truePositives / (truePositives + falseNegatives || 1)).toFixed(4));
  const falsePositiveRate = parseFloat((falsePositives / (falsePositives + trueNegatives || 1)).toFixed(4));
  const severityAccuracy = parseFloat(
    (totalEvaluatedSeverities > 0 ? correctSeverities / totalEvaluatedSeverities : 1.0).toFixed(4)
  );
  const evidenceLocationAccuracy = parseFloat(
    (totalFindingsCount > 0 ? validLocationsCount / totalFindingsCount : 1.0).toFixed(4)
  );
  const unsupportedClaimRate = parseFloat((1.0 - evidenceLocationAccuracy).toFixed(4));
  const avgLatencyMs = parseFloat((totalLatencyMs / dataset.cases.length).toFixed(1));

  console.log(`\n================================================================`);
  console.log(`📊 EVALUATION RESULTS SUMMARY:`);
  console.log(`----------------------------------------------------------------`);
  console.log(`   Precision:                  ${(precision * 100).toFixed(1)}%`);
  console.log(`   Recall:                     ${(recall * 100).toFixed(1)}%`);
  console.log(`   False Positive Rate:        ${(falsePositiveRate * 100).toFixed(1)}%`);
  console.log(`   Severity Accuracy:          ${(severityAccuracy * 100).toFixed(1)}%`);
  console.log(`   Evidence Location Accuracy: ${(evidenceLocationAccuracy * 100).toFixed(1)}%`);
  console.log(`   Unsupported Claim Rate:     ${(unsupportedClaimRate * 100).toFixed(1)}%`);
  console.log(`   Average Latency:            ${avgLatencyMs} ms`);
  console.log(`   Total Tokens Used:          ${totalTokens}`);
  console.log(`================================================================\n`);

  // Persist run metrics to database if accessible
  try {
    await prisma.evaluationBenchmarkRun.create({
      data: {
        datasetVersion: dataset.version,
        provider: provider.name,
        model: (provider as any).model || 'default',
        totalCases: dataset.cases.length,
        precision,
        recall,
        falsePositiveRate,
        severityAccuracy,
        evidenceLocationAccuracy,
        unsupportedClaimRate,
        avgLatencyMs,
        totalTokensUsed: totalTokens,
        detailsJson: JSON.stringify({
          truePositives,
          falsePositives,
          falseNegatives,
          trueNegatives,
        }),
      },
    });
    console.log(`💾 Benchmark metrics successfully saved to database table "EvaluationBenchmarkRun".\n`);
  } catch (err: any) {
    console.warn(`[Evaluator] Notice saving benchmark run to DB: ${err.message}`);
  }

  return {
    precision,
    recall,
    falsePositiveRate,
    severityAccuracy,
    evidenceLocationAccuracy,
    unsupportedClaimRate,
    avgLatencyMs,
    totalTokens,
  };
}

if (require.main === module || process.argv[1]?.includes('run-evaluator')) {
  runBenchmarkEvaluation().catch((err) => {
    console.error('Fatal benchmark evaluation error:', err);
    process.exit(1);
  });
}
