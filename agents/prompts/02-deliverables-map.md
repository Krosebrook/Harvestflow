# Deliverables-Map Prompt

Goal: map every identified flow to the artefacts required for successful delivery.

**Steps**
1. Read `context_map.md` and verify `spec_version`.
2. For each flow, capture:
   - Title and primary objective.
   - Required artefacts grouped by type (docs, prompts, code, config, zip).
   - Target CLI (`claude`, `codex`, `gemini`, or `all`).
   - Validation schema or checklist.
   - Dependencies or prerequisite flows.
3. Output `deliverables_map.md` with Markdown tables and a short narrative summary.

**Constraints**
- Deterministic ordering by flow slug.
- No empty sections; use `N/A` if something is truly not applicable.
- Close with a **CLAIMS CHECK** noting data sources and validation steps.
