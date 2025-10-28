#!/usr/bin/env bash
set -euo pipefail

HOST=${HOST:-http://localhost:5173}
TARGET="${HOST%/}/dropzone/upload"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
AUTH_ARGS=()

if [[ -n "${BASIC_AUTH_USER:-}" ]] && [[ -n "${BASIC_AUTH_PASS:-}" ]]; then
  AUTH_ARGS=(-u "${BASIC_AUTH_USER}:${BASIC_AUTH_PASS}")
fi

cat <<'EOF' > "$TMPDIR/sample-notes.txt"
Sample notes for HarvestFlow organiser smoke test.
EOF

ZIP_PATH="$TMPDIR/sample-pack.zip"
python - "$TMPDIR" "$ZIP_PATH" <<'PYCODE'
import sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

tmpdir = Path(sys.argv[1])
zip_path = Path(sys.argv[2])

with ZipFile(zip_path, "w", ZIP_DEFLATED) as zf:
    target = tmpdir / "sample-notes.txt"
    zf.write(target, arcname="sample-notes.txt")
PYCODE

echo "Uploading $ZIP_PATH to $TARGET"
RESPONSE=$(curl -sS -X POST "$TARGET" \
  "${AUTH_ARGS[@]}" \
  -F "files=@${ZIP_PATH};type=application/zip" \
  -H "Accept: application/json")

if command -v jq >/dev/null 2>&1; then
  echo "$RESPONSE" | jq .
else
  echo "$RESPONSE"
fi
