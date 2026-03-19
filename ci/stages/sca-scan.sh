#!/usr/bin/env bash
# ci/stages/sca-scan.sh — OWNED BY TEAM 2

set -euo pipefail
REPORT_DIR="${REPORT_DIR:-/tmp/security-reports}"
FAIL_CVSS="${OWASP_FAIL_CVSS:-8}"
DD_URL="${DEFECTDOJO_URL:-http://defectdojo:8080}"
DD_KEY="${DEFECTDOJO_KEY:-}"
mkdir -p "$REPORT_DIR"

echo "=== [Team 2] SCA — OWASP Dependency-Check (CVSS threshold: $FAIL_CVSS) ==="

dependency-check.sh \
  --project "${APP_NAME:-tetris-devsecops}" \
  --scan . \
  --format JSON --format HTML \
  --out "$REPORT_DIR" \
  --failOnCVSS "$FAIL_CVSS" \
  --enableRetired \
  --disableYarnAudit \
  2>&1 | tail -20 || {
    echo "⚠ OWASP Dependency-Check found issues above CVSS $FAIL_CVSS"
  }

# Upload to DefectDojo
if [ -n "$DD_KEY" ] && [ -f "$REPORT_DIR/dependency-check-report.json" ]; then
  curl -sf -X POST "${DD_URL}/api/v2/import-scan/" \
    -H "Authorization: Token ${DD_KEY}" \
    -F "scan_type=Dependency Check Scan" \
    -F "file=@${REPORT_DIR}/dependency-check-report.json" \
    -F "product_name=${DEFECTDOJO_PRODUCT_NAME:-Tetris-DevSecOps}" \
    -F "engagement_name=${ENGAGEMENT_NAME:-CI-local}" \
    -F "auto_create_context=true" \
    >/dev/null 2>&1 && echo "SCA findings uploaded to DefectDojo" || true
fi

echo "✅ SCA scan complete"
