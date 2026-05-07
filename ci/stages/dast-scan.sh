#!/bin/bash

# 1. Lấy IP nội bộ của container đang chạy app
TARGET_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' staging-app-local)

echo "[*] Target App IP detected: $TARGET_IP"

# 2. Chạy ZAP quét thẳng vào cái IP đó (cổng gốc của app là 3000)
docker run --rm \
    -v "$REPORT_DIR:/zap/wrk" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-full-scan.py \
    -t "http://$TARGET_IP:3000" \
    -r zap-report.html \
    -x zap-report.xml \
    -J zap-report.json \
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