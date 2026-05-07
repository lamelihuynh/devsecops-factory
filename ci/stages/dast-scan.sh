#!/bin/bash
set -euo pipefail

# === Cấu hình ===
TARGET_URL="${STAGING_URL:-http://tetris-staging.localhost}"
REPORT_DIR="${SCAN_REPORT_DIR:-scan-reports}"
mkdir -p "$REPORT_DIR"

echo "[*] Running OWASP ZAP DAST scan against: $TARGET_URL"
echo "[*] Reports in: $REPORT_DIR"

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker not found."
    exit 3
fi
docker run --rm \
    -v "$REPORT_DIR:/zap/reports" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-full-scan.py \
    -t "$TARGET_URL" \
    -r /zap/reports/zap-report.html \
    -x /zap/reports/zap-report.xml \
    -J /zap/reports/zap-report.json \
    -m 2 \
    -T 5

exit_code=$?

if [ -f "$REPORT_DIR/zap-report.json" ]; then
    if command -v jq &> /dev/null; then
        high_crit=$(jq '[.site[].alerts[] | select(.risk=="High" or .risk=="Critical")] | length' "$REPORT_DIR/zap-report.json")
        echo "[*] Found $high_crit HIGH/CRITICAL alerts"
    else
        high_crit=$(grep -c '"risk":"High"' "$REPORT_DIR/zap-report.json" || true)
        crit=$(grep -c '"risk":"Critical"' "$REPORT_DIR/zap-report.json" || true)
        high_crit=$((high_crit + crit))
    fi
else
    high_crit=0
fi

if [ $exit_code -eq 1 ] || [ "$high_crit" -gt 0 ]; then
    echo "[FAIL] DAST detected HIGH/CRITICAL vulnerabilities."
    exit 1
elif [ $exit_code -ne 0 ]; then
    echo "[ERROR] DAST scan failed (exit $exit_code)."
    exit 3
else
    echo "[PASS] No HIGH/CRITICAL alerts."
    exit 0
fi