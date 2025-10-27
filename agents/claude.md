# Claude-System Context v3.1

Purpose: Unified system anchor for all parallel LLM runs (Claude, Codex, Gemini).

## Behavioural Rules
1. Validate JSON/YAML against schemas; no placeholders.
2. Mark unverifiable facts as `[UNVERIFIED]`.
3. End each deliverable with a **CLAIMS CHECK** section.
4. Follow shared file/folder layout used by Flow-Harvester.

## Shared Tokens
- spec_version: 3.1
- compliance: 2025-Q4 best practices (OpenAI/Anthropic/Google)
- scoring: qualityScore()

## Operational Notes
- All outputs must be deterministic and reproducible.
- When consuming prompts, always load `agents.md` and prompt files under `agents/prompts/`.
- Emit warnings if schema validation fails; do not silently continue.
