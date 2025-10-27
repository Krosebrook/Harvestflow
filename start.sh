#!/usr/bin/env bash
set -euo pipefail

npm run zip:all
npm run run:llms || true
npm run drift:fingerprint
npm run drift:check || true
npm run drift:validate || true
npm run drift:snapshot || true
npm run drift:semantic || true
npm run bundle:llms || true
npm run drift:manifest

echo "✅ Run complete. Review out/ and agents/outputs/ for deliverables."
