# HarvestFlow

Automated flow harvester that ingests chat exports, clusters topics, produces per-flow deliverables, and orchestrates parallel runs across Claude, Codex, and Gemini CLIs with drift protection.

## Run Cadence
- **First-time setup:** `./bootstrap.sh`
  - Installs dependencies, runs the historical chat generator, builds flow zips, triggers optional LLM runs, and executes drift guards.
- **Subsequent sessions:** `./start.sh`
  - Rebuilds deliverables from `chat.json`, runs multi-CLI orchestration (best effort), and revalidates drift protections.

## Manual Commands
- `npm run zip:all` — build per-flow bundles and write `out/metrics.json` plus per-flow metrics.
- `npm run run:llms` — execute the shared prompts across installed CLIs.
 - `npm run bundle:llms` — archive all CLI outputs into `agents/all-llm-outputs.zip`.
 - `npm run populate:llms` — run Claude/Codex/Gemini CLIs (when available) to fill `agents/outputs/` in one shot.
 - `npm run snapshot:save` — capture current CLI outputs into `snapshots/golden/`.
- `npm run drift:*` — fingerprint, validate, snapshot, semantic guard, and manifest checks (thresholds configurable via `drift/settings.json`).
- `npm run release:bundle` — stage a versioned bundle under `releases/`.
- `npm run dashboard:dev` — launch the Vite dashboard (proxies `metrics.json` to the metrics API).
- `npm run dashboard:build` — generate static dashboard assets in `dashboard/dist/`.
- `npm run ui` — expose the JSON metrics endpoint at <http://localhost:5173>.

## Dropzone Auto-Organizer
- Launch the organiser UI via `npm run ui` (metrics server) or `npm run dashboard:dev` (React dashboard at <http://localhost:5174>).
- Drag and drop files, images, documents, archives, or zipped folders into the "Dropzone Auto-Organizer" panel.
- HarvestFlow stores raw uploads under `dropzone/sessions/<sessionId>/raw/`, creates a categorised structure in `dropzone/sessions/<sessionId>/structured/`, and saves a `report.json` audit plus `structured.zip` bundle.
- The UI flags duplicates, highlights unknown file types, and suggests folder targets (e.g. `Assets/Images`, `Docs/References`, `Ingest/Archives`) to streamline hand-offs.
- Use the "Download organised bundle" button to grab the proposed layout or revisit any session via the persisted report endpoint.
- Smoke-test the organiser once the server (or container) is running: `./scripts/dropzone_probe.sh` uploads a sample archive to `/dropzone/upload` and prints the session report.
- Prune stale sessions with `npm run dropzone:cleanup` (defaults to 30 days retention; pass `--retention-days=` or `--max-sessions=` for custom policies).

## Security & Access Control
- Enable HTTP Basic Auth by setting `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` (either in your shell or via `docker compose` environment variables). All dashboard pages and APIs will prompt for those credentials.
- When exposing the service beyond `localhost`, front it with your preferred TLS-terminating reverse proxy and rotate credentials regularly.

## Docker Deployment (persistent local app)
- Build and launch: `docker compose up --build -d` (exposes http://localhost:5173). The compose file mounts `dropzone-data/` for persistent organiser output plus your local `chat.json` and `chat-history/`.
- Logs & lifecycle: `docker compose logs -f` to tail, `docker compose restart` to bounce, `docker compose down` to stop (data in `dropzone-data/` persists).
- Customise: override the target port with `PORT=8080 docker compose up ...`; adjust persistence by swapping the host paths in `docker-compose.yml`.
- Exec inside the container for pipeline commands (`docker compose exec harvestflow bash`) and run workflows like `npm run zip:all` or `./start.sh` against the mounted chat exports.

## Historical Chat Pipeline
- Export chats into `chat-history/chats/` and run `npm start` inside `chat-history/` to generate chunked Markdown summaries.

- `agents/prompts/` contains the shared workflow prompts; edit with care and re-run `npm run drift:fingerprint` + `npm run drift:save` if intentional changes are made.
- Multi-CLI execution is best-effort; the scripts skip any CLI that is not installed on the local system.
- Governance checklist and baseline process live in `docs/governance.md`.
- Configure vector store mode in `config.json` (`mem` for in-memory, `file` for persisted embeddings).
- CI notifications use a Teams incoming webhook stored as the `TEAMS_WEBHOOK_URL` GitHub secret.
