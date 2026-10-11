# ADR 0001: Hybrid Deterministic and LLM Analysis Pipeline

## Context
When conducting automated pull request code reviews, relying solely on an LLM presents challenges:
1. High token latency (5-30s) for simple syntax, secret, or regex-detectable flaws.
2. Risk of non-deterministic false negatives on well-known antipatterns (e.g. hardcoded credentials, empty catch blocks, eval calls).
3. Risk of prompt injection when untrusted diff comments command the model to ignore flaws.

Conversely, relying solely on traditional static analysis misses high-level architectural flaws, semantic bugs, and contextual risk evaluation.

## Decision
We decided on a **hybrid sequential architecture**:
1. Run fast, deterministic regex scanners first (`DETERMINISTIC_RULES`).
2. Feed both the diff and initial context to the LLM with strict prompt isolation.
3. Combine, deduplicate, and rank findings before applying user policies.

## Consequences
### Positive:
- **Instant baseline coverage:** Critical secrets and obvious prompt injections are caught with 100% deterministic reliability.
- **Cost optimization:** Low-severity or skipped diffs can be short-circuited before triggering expensive model inference.
- **Defense in depth:** If the LLM is somehow influenced by adversarial phrasing, the deterministic engine ensures the injection attempt is still flagged as a Critical finding.

### Negative:
- Two finding pipelines must be maintained and harmonized with common schemas (`ReviewFinding`).
