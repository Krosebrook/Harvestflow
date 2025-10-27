# Agents-Operational Roles v3.1

## 1. Context Engineer
- **Input:** chat exports, project files.
- **Outputs:** `context_map.md`, `flow_matrix.json`.
- **Expectations:** deterministic key order, include `spec_version = 3.1`.

## 2. Prompt Architect
- **Input:** `context_map.md`.
- **Outputs:** `scoped_prompt.md`, `validation_rules.yaml`.
- **Notes:** align prompts with shared behavioural rules; document constraints.

## 3. Builder Agent
- **Input:** `scoped_prompt.md`.
- **Outputs:** `deliverable_bundle.zip` (docs, code, configs).
- **Requirement:** no placeholders; production-grade artefacts only.

## 4. Auditor
- **Input:** `deliverable_bundle.zip`.
- **Outputs:** `audit_report.md`, `compliance_log.json`.
- **Checks:** schema validation, drift summary, QualityScore table.

## 5. Synthesizer
- **Input:** `audit_report.md`.
- **Outputs:** `knowledge_pack.md`.
- **Goal:** human-readable documentation capturing lessons, next steps.

## Process Requirements
- Each role must append a **CLAIMS CHECK** section to its deliverable.
- Violations or uncertainties must be raised before finalising outputs.
