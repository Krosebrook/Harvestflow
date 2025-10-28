# HarvestFlow Governance & Sign-off

## Baseline Lifecycle
1. Run the full pipeline (`./start.sh`) with approved inputs.
2. Review generated artefacts in `agents/outputs/` and `out/flows/`.
3. Execute `npm run drift:fingerprint` and review the changes reported by `npm run drift:check`.
4. If changes are intentional, update baselines:
   - `npm run drift:save`
   - `npm run snapshot:save`
   - Adjust `drift/settings.json` thresholds if necessary and document the rationale.
5. Commit baseline updates with a descriptive message (e.g., `chore: refresh drift baselines`).

## Drift Threshold Calibration
- Snapshot edit budget is configured via `drift/settings.json` (`snapshotEditBudgetPct`).
- Semantic similarity threshold (`semanticMinSim`) defaults to 0.93; tune as needed.
- Record deviations and outcomes in the change log below.

## Sign-off Checklist
- [ ] Historical generator run with latest chat exports (`chat-history/`).
- [ ] Flow-Harvester build succeeds (`npm run zip:all`).
- [ ] Drift checks pass (`npm run drift:check`, `npm run drift:validate`, `npm run drift:snapshot`, `npm run drift:semantic`).
- [ ] Manifest generated (`npm run drift:manifest`).
- [ ] Baselines refreshed (`npm run drift:save`, `npm run snapshot:save`) when intentional changes occur.
- [ ] Documentation (`README.md`, governance notes) updated post-change.
- [ ] Dropzone organiser session reviewed (`dropzone/sessions/<id>/report.json`) and archived if sensitive.
- [ ] Dropzone cleanup executed (`npm run dropzone:cleanup -- --dry-run` before deleting) to enforce retention policy.

## Change Log
- _2025-10-27:_ Established baseline lifecycle, snapshot saver, and drift threshold governance.
- _2025-10-27:_ Added dropzone auto-organiser workflow with persisted reports and structured bundles.
- _2025-10-27:_ Introduced dropzone cleanup script and optional Basic Auth guard.
