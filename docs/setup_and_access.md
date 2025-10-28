# HarvestFlow Setup & Access Guide

## 1. First-Time Setup
- Install prerequisites: Docker Desktop (with WSL integration enabled) and Node.js ≥ 18 if you plan to run native scripts.
- Clone the repository and install dependencies:
  ```bash
  git clone <repo-url>
  cd HarvestFlow
  npm install
  ```
- For local non-container runs, execute `./bootstrap.sh` once to seed historical artefacts and verify the pipeline.

## 2. Configure Credentials
- Create a `.env` file alongside `docker-compose.yml` with secure values:
  ```bash
  BASIC_AUTH_USER=<your-user>
  BASIC_AUTH_PASS=<strong-password>
  ```
- Keep the `.env` file out of version control (already covered by `.gitignore`). Rotate credentials regularly and store them in your password manager or secrets vault.

## 3. Launch / Relog Flow
1. Ensure Docker Desktop is running.
2. From the project root, start or restart the container:
   ```bash
   docker compose down
   docker compose up -d
   ```
3. Open `http://localhost:5173` and supply the Basic Auth credentials from your `.env`.
4. If the browser is closed or a session times out, simply revisit the URL and re-enter credentials; no container restart is required unless credentials were changed.

## 4. Quick Verification
- Run the organiser smoke test (honours Basic Auth when exported):
  ```bash
  BASIC_AUTH_USER=<user> BASIC_AUTH_PASS=<pass> ./scripts/dropzone_probe.sh
  ```
- Confirm new sessions appear under `dropzone-data/sessions/` and review `report.json` for classification accuracy.

## 5. Maintenance Checklist
- Apply retention policies regularly:
  ```bash
  DROPZONE_ROOT=dropzone-data npm run dropzone:cleanup -- --retention-days=30 --max-sessions=50
  ```
- Follow the governance checklist (`docs/governance.md`) after each significant run: drift checks, manifest updates, documentation refresh, and dropzone audit.
- Update Docker images and npm dependencies on a schedule (`docker compose pull`, `npm update`) and rebuild with `docker compose up --build -d`.

## 6. Recovering Access
- Forgot credentials: update `.env` with new values, then run `docker compose down && docker compose up -d`.
- Container stopped: run `docker compose up -d` from the project root.
- Browser cache issues: clear auth cache (CTRL+Shift+R or private window) and retry login with fresh credentials.

## 7. Security Best Practices
- Treat `.env` secrets as sensitive; share them only through approved channels.
- Front the app with TLS/HTTPS if exposed beyond localhost (e.g., via nginx or Caddy reverse proxy).
- Audit `dropzone-data/` routinely; archive or delete sensitive artefacts once processed.
- Monitor container logs (`docker compose logs -f`) for repeated auth failures or anomalies.
