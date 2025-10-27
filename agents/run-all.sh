#!/usr/bin/env bash
set -euo pipefail
mkdir -p agents/outputs/{claude-run,codex-run,gemini-run}

run_or_skip() {
  local bin="$1"
  shift
  if command -v "$bin" >/dev/null 2>&1; then
    echo "▶ Running $bin $*"
    "$bin" "$@" || true
  else
    echo "⚠️  Skipping $bin (not found)"
  fi
}

(
  run_or_skip claude run agents/prompts/04-execution.md --context agents/claude.md agents/agents.md --out agents/outputs/claude-run --format md
  run_or_skip claude run agents/prompts/05-drift-guardian.md --context agents/claude.md agents/agents.md --out agents/outputs/claude-run --format md
) &
(
  run_or_skip codex run agents/prompts/04-execution.md --context agents/claude.md agents/agents.md --out agents/outputs/codex-run --format md
  run_or_skip codex run agents/prompts/05-drift-guardian.md --context agents/claude.md agents/agents.md --out agents/outputs/codex-run --format md
) &
(
  run_or_skip gemini run agents/prompts/04-execution.md --context agents/claude.md agents/agents.md --out agents/outputs/gemini-run --format md
  run_or_skip gemini run agents/prompts/05-drift-guardian.md --context agents/claude.md agents/agents.md --out agents/outputs/gemini-run --format md
) &

wait

echo "✅ Parallel runs complete → agents/outputs"
