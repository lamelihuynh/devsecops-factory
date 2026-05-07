#!/bin/bash

# 1. Kiểm tra xem REPORT_DIR có dữ liệu không, nếu không có thì lấy thư mục hiện tại làm dự phòng
REPORT_DIR=${REPORT_DIR:-$(pwd)/scan-reports}
mkdir -p "$REPORT_DIR"

# 2. Lấy IP của container
TARGET_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' staging-app-local)

# Nếu không lấy được IP, dùng tên container (Docker tự phân giải được nếu cùng network)
TARGET_URL="http://${TARGET_IP:-staging-app-local}:3000"

echo "[*] Reports will be saved in: $REPORT_DIR"
echo "[*] Scanning target: $TARGET_URL"

# 3. Chạy Docker ZAP
docker run --rm \
    --network bridge \
    -v "$REPORT_DIR:/zap/wrk:rw" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-full-scan.py \
    -t "$TARGET_URL" \
    -r zap-report.html \
    -x zap-report.xml \
    -J zap-report.json \
    -m 2 \
    -T 5 || exit 1
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