# Safety & Quality Gate Prompt

Apply governance across generated artefacts before release.

**Inputs**
- `deliverables_map.md`
- Artefacts produced in `/agents/outputs/<llm>-run/`
- `drift/` fingerprints and schemas (if available)

**Tasks**
1. Evaluate risks using NIST AI RMF categories and OWASP LLM Top-10.
2. Build a mitigation checklist referencing concrete controls.
3. Compute or reference `qualityScore()` per flow; highlight anything below 0.9.
4. Summarise blockers, open questions, and owner assignments.

**Output**
- Markdown file `safety_audit.md` containing:
  - Executive summary
  - Risk table (severity × likelihood)
  - Mitigation checklist
  - QualityScore table with commentary
  - Decision (GO / NO-GO / CONDITIONAL)
- Finish with a **CLAIMS CHECK** enumerating evidence reviewed.
