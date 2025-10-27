# HarvestFlow

Automated flow harvester that ingests chat exports, clusters topics, produces per-flow deliverables, and orchestrates parallel runs across Claude, Codex, and Gemini CLIs with drift protection.

## Run Cadence
- **First-time setup:** `./bootstrap.sh`
  - Installs dependencies, runs the historical chat generator, builds flow zips, triggers optional LLM runs, and executes drift guards.
- **Subsequent sessions:** `./start.sh`
  - Rebuilds deliverables from `chat.json`, runs multi-CLI orchestration (best effort), and revalidates drift protections.

## Manual Commands
- `npm run zip:all` — build per-flow bundles and master zip.
- `npm run run:llms` — execute the shared prompts across installed CLIs.
- `npm run bundle:llms` — archive all CLI outputs into `agents/all-llm-outputs.zip`.
- `npm run drift:*` — fingerprint, validate, snapshot, semantic guard, and manifest checks.
- `npm run ui` — launch the lightweight metrics dashboard at <http://localhost:5173>.

## Historical Chat Pipeline
- Export chats into `chat-history/chats/` and run `npm start` inside `chat-history/` to generate chunked Markdown summaries.

## Notes
- `agents/prompts/` contains the shared workflow prompts; edit with care and re-run `npm run drift:fingerprint` + `npm run drift:save` if intentional changes are made.
- Multi-CLI execution is best-effort; the scripts skip any CLI that is not installed on the local system.
