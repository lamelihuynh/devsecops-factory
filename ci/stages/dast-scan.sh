#!/usr/bin/env bash
# ci/stages/dast-scan.sh — OWNED BY TEAM 2
set -euo pipefail
REPORT_DIR="${REPORT_DIR:-/tmp/security-reports}"
TARGET_URL="${1:-${STAGING_URL:-http://tetris-staging.localhost}}"
DD_URL="${DEFECTDOJO_URL:-http://defectdojo:8080}"
DD_KEY="${DEFECTDOJO_KEY:-}"
mkdir -p "$REPORT_DIR"

echo "=== [Team 2] DAST — OWASP ZAP vs $TARGET_URL ==="

docker run --rm --network devsecops \
  -v "$REPORT_DIR:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "$TARGET_URL" \
  -J /zap/wrk/zap-report.json -r /zap/wrk/zap-report.html -I 2>/dev/null || true

if [ -n "$DD_KEY" ] && [ -f "$REPORT_DIR/zap-report.json" ]; then
  curl -sf -X POST "${DD_URL}/api/v2/import-scan/" \
    -H "Authorization: Token ${DD_KEY}" \
    -F "scan_type=ZAP Scan" \
    -F "file=@${REPORT_DIR}/zap-report.json" \
    -F "product_name=${DEFECTDOJO_PRODUCT_NAME:-Tetris-DevSecOps}" \
    -F "engagement_name=${ENGAGEMENT_NAME:-CI-local}" \
    -F "auto_create_context=true" >/dev/null 2>&1 || true
fi

echo "✅ DAST scan complete"
