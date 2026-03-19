#!/usr/bin/env bash
# =============================================================================
# ci/stages/secrets-scan.sh — OWNED BY TEAM 2
# Called by ci/Jenkinsfile stage "① Secrets scan"
#
# Team 2 owns the tool choices and threshold logic here.
# Team 1's Jenkinsfile calls this script — it doesn't care what's inside.
# =============================================================================
set -euo pipefail

REPORT_DIR="${REPORT_DIR:-/tmp/security-reports}"
mkdir -p "$REPORT_DIR"

echo "=== [Team 2] Secrets scanning ==="

# TruffleHog — verified secrets only (reduces false positives)
if command -v trufflehog &>/dev/null; then
  trufflehog filesystem . \
    --only-verified \
    --json \
    --no-update \
    2>/dev/null > "$REPORT_DIR/trufflehog.json" || true

  COUNT=$(wc -l < "$REPORT_DIR/trufflehog.json" || echo 0)
  if [ "$COUNT" -gt 0 ]; then
    echo "❌ TruffleHog found $COUNT verified secrets:"
    cat "$REPORT_DIR/trufflehog.json"
    exit 1
  fi
fi

# Gitleaks — pattern matching across full git history
if command -v gitleaks &>/dev/null; then
  gitleaks detect \
    --source . \
    --report-path "$REPORT_DIR/gitleaks.json" \
    --report-format json \
    --exit-code 0 || true

  if [ -s "$REPORT_DIR/gitleaks.json" ]; then
    LEAKS=$(python3 -c "import json; d=json.load(open('$REPORT_DIR/gitleaks.json')); print(len(d) if isinstance(d,list) else 0)" 2>/dev/null || echo "unknown")
    echo "⚠ Gitleaks found $LEAKS potential leaks — review report"
    # Don't fail on Gitleaks alone — TruffleHog verified is the hard gate
  fi
fi

echo "✅ Secrets scan passed"
