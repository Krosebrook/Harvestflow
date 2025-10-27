#!/usr/bin/env bash
set -euo pipefail

if [ ! -f package-lock.json ]; then
  echo "▶ Installing root dependencies"
  npm install
else
  echo "▶ Root dependencies already installed"
fi

if [ -d chat-history ]; then
  echo "▶ Preparing chat-history pipeline"
  pushd chat-history >/dev/null
  if [ ! -f package-lock.json ]; then
    npm install
  fi
  if [ -n "$(ls chats 2>/dev/null)" ]; then
    npm start
  else
    echo "⚠️  No chat exports found in chat-history/chats/. Skipping historical generation."
  fi
  popd >/dev/null
fi

echo "▶ Building Flow-Harvester"
npm run zip:all

if command -v claude >/dev/null 2>&1 || command -v codex >/dev/null 2>&1 || command -v gemini >/dev/null 2>&1; then
  npm run run:llms || true
else
  echo "⚠️  No LLM CLIs detected; skipping multi-model run."
fi

npm run drift:fingerprint
npm run drift:check || true
npm run drift:validate || true
npm run drift:snapshot || true
npm run drift:semantic || true
npm run drift:manifest

echo "✅ Bootstrap complete. Outputs available under out/ and agents/outputs/"
