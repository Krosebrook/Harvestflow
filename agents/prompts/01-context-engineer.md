# Context-Engineer Prompt

🧭 **Purpose**  
Extract every meaningful context branch from chat exports and project sources.

**Instructions**
1. Parse all `.md`, `.json`, and relevant source files under `/agents`, `/src`, and `/chat-history`.
2. Identify key entities, schemas, deliverable flows, and gate conditions.
3. Produce two artefacts:
   - `context_map.md` — hierarchical narrative of flows, roles, dependencies.
   - `flow_matrix.json` — deterministic mapping of flow → required artefacts, with `spec_version = "3.1"`.
4. Highlight any missing data and propose remediation steps.

**Output Contract**
- Deterministic key ordering.
- Plain Markdown/JSON; no placeholders.
- Append a **CLAIMS CHECK** with validations performed.
