#!/bin/bash
set -euo pipefail

# === Cấu hình ===
TARGET_URL="${STAGING_URL:-http://tetris-staging.localhost}"
REPORT_DIR="${SCAN_REPORT_DIR:-scan-reports}"
mkdir -p "$REPORT_DIR"

echo "[*] Running OWASP ZAP DAST scan against: $TARGET_URL"
echo "[*] Reports will be stored in: $REPORT_DIR"

# Kiểm tra Docker có chạy không
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker not found. DAST requires Docker."
    exit 3
fi

# Tạo container ZAP và chạy quick scan (spider + active scan)
docker run --rm \
    -v "$REPORT_DIR:/zap/reports" \
    owasp/zap2docker-stable \
    zap-full-scan.py \
    -t "$TARGET_URL" \
    -g gen.conf \
    -r /zap/reports/zap-report.html \
    -x /zap/reports/zap-report.xml \
    -J /zap/reports/zap-report.json \
    -z "-configfile /zap/wrk/gen.conf" \
    -m 2 \
    -T 5

# Kiểm tra kết quả: nếu tìm thấy lỗ hổng HIGH/CRITICAL thì trả về exit code 1
# (zap-full-scan.py trả về 0 nếu không có lỗ hổng HIGH/CRITICAL, 1 nếu có, 2 nếu lỗi cấu hình)
exit_code=$?

if [ -f "$REPORT_DIR/zap-report.json" ]; then
    # Dùng jq để đếm số alert HIGH/CRITICAL (nếu có jq)
    if command -v jq &> /dev/null; then
        high_crit=$(jq '[.site[].alerts[] | select(.risk=="High" or .risk=="Critical")] | length' "$REPORT_DIR/zap-report.json")
        echo "[*] Found $high_crit HIGH/CRITICAL alerts"
    else
        # Fallback dùng grep
        high_crit=$(grep -c '"risk":"High"' "$REPORT_DIR/zap-report.json" || true)
        crit=$(grep -c '"risk":"Critical"' "$REPORT_DIR/zap-report.json" || true)
        high_crit=$((high_crit + crit))
    fi
else
    high_crit=0
fi

if [ $exit_code -eq 1 ] || [ "$high_crit" -gt 0 ]; then
    echo "[FAIL] DAST found HIGH/CRITICAL vulnerabilities. Check reports."
    exit 1
elif [ $exit_code -ne 0 ]; then
    echo "[ERROR] DAST scan failed with exit code $exit_code"
    exit 3
else
    echo "[PASS] DAST scan completed — no HIGH/CRITICAL alerts."
    exit 0
fi