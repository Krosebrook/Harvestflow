# Parallel Execution Prompt

**Objective**
Run the generation workflow end-to-end using shared context files and produce the complete deliverable bundle for this flow.

**Process**
1. Load `/agents/claude.md`, `/agents/agents.md`, and all prompts in `/agents/prompts/`.
2. Follow the roles sequentially:
   - Context Engineer → emit `context_map.md`, `flow_matrix.json`.
   - Prompt Architect → emit `scoped_prompt.md`, `validation_rules.yaml`.
   - Builder Agent → assemble artefacts into `deliverable_bundle.zip` (or Markdown manifest if ZIP unsupported).
   - Auditor → create `audit_report.md`, `compliance_log.json`.
   - Synthesizer → craft `knowledge_pack.md`.
3. Each artefact must be written under `/agents/outputs/<llm>-run/`.
4. After completing all deliverables, run the Drift Guardian prompt (05) to self-audit.

**Requirements**
- Deterministic order of generation.
- Every document ends with a **CLAIMS CHECK** section.
- Emit warnings if schema validation fails; stop if critical outputs are missing.
