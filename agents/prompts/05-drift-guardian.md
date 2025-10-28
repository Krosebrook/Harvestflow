# Drift Guardian Prompt

**Purpose**
Detect prompt, schema, snapshot, or semantic drift before finalising deliverables.

**Checklist**
1. Verify `spec_version === "3.1"` across all generated JSON/Markdown headers.
2. Re-run schema validation locally; if any file fails, emit `SCHEMA_FAIL` with details.
3. Compare current fingerprints against `drift/fingerprint.baseline.json`; list files that changed.
4. Summarise snapshot and semantic similarity outcomes (pass/fail, scores).
5. Decide: `PASS`, `FAIL`, or `NEEDS-REVIEW` and provide remediation steps.

**Output**
- Write `drift_report.md` under the active `/agents/outputs/<llm>-run/` directory.
- Include sections for Fingerprint Summary, Schema Status, Snapshot Summary, Semantic Similarity, Decision, and Next Actions.
- Conclude with a **CLAIMS CHECK** referencing evidence reviewed.
