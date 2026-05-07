#!/bin/bash

# ============================================================
# DAST SCAN — OWASP ZAP (Full Scan Mode)
# ============================================================

echo "============================================================"
echo "  DAST SCAN — OWASP ZAP"
echo "  Target URL Container: staging-app-local"
echo "  Report Directory    : ${REPORT_DIR}"
echo "============================================================"

# 1. Kiểm tra và tạo thư mục báo cáo, mở toang quyền để Docker ghi được file
if [ -z "$REPORT_DIR" ]; then
    REPORT_DIR="$(pwd)/scan-reports"
fi
mkdir -p "$REPORT_DIR"
chmod -R 777 "$REPORT_DIR"

# 2. Lấy IP nội bộ của container app để ZAP không bị lỗi "Unknown Host"
TARGET_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' staging-app-local)

if [ -z "$TARGET_IP" ]; then
    echo "[!] Không tìm thấy IP của staging-app-local. Kiểm tra xem container có đang chạy không?"
    exit 1
fi

TARGET_URL="http://${TARGET_IP}:3000"
echo "[*] Target App IP detected: $TARGET_IP"
echo "[*] ZAP sẽ quét vào: $TARGET_URL"

# 3. Chạy Docker ZAP với quyền ROOT để né lỗi Permission Denied
# --user root: Ép ZAP chạy quyền cao nhất để ghi được báo cáo vào folder của Jenkins
# -v ...:/zap/wrk: Mount vào đúng thư mục làm việc mặc định của ZAP
docker run --rm \
    --user root \
    -v "$REPORT_DIR:/zap/wrk:rw" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-full-scan.py \
    -t "$TARGET_URL" \
    -r zap-report.html \
    -x zap-report.xml \
    -J zap-report.json \
    -m 2 \
    -T 5

# 4. Kiểm tra xem file report đã được sinh ra chưa
if [ -f "$REPORT_DIR/zap-report.html" ]; then
    echo "[+] DAST Scan hoàn tất! Báo cáo đã nằm tại: $REPORT_DIR/zap-report.html"
    # Trả lại quyền cho user jenkins đọc được file sau khi root tạo ra
    chmod -R 777 "$REPORT_DIR"
else
    echo "[!] Lỗi: ZAP chạy xong nhưng không thấy file báo cáo đâu!"
    exit 1
fi