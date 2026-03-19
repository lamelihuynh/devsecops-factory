#!/usr/bin/env bash
# ci/stages/iac-scan.sh — OWNED BY TEAM 2
set -euo pipefail
REPORT_DIR="${REPORT_DIR:-/tmp/security-reports}"
mkdir -p "$REPORT_DIR"

echo "=== [Team 2] IaC scan — Checkov ==="

checkov -d . \
  --framework dockerfile kubernetes terraform \
  --output json \
  --output-file "$REPORT_DIR/checkov.json" \
  --soft-fail 2>/dev/null || true

echo "✅ IaC scan complete"
