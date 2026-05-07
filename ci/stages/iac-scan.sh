#!/bin/bash

echo "[*] Starting IaC Scan (Checkov)..."

# Lấy đường dẫn tuyệt đối của thư mục target-repo trên máy Jenkins
SCAN_PATH="$(pwd)/target-repo"

# Kiểm tra xem thư mục có tồn tại không trước khi quét
if [ ! -d "$SCAN_PATH" ]; then
    echo "[!] Error: $SCAN_PATH not found!"
    exit 1
fi

echo "[*] Scanning path: $SCAN_PATH"

# Chạy Docker Checkov
docker run --rm \
    -v "${SCAN_PATH}:/target" \
    bridgecrew/checkov:latest \
    --directory /target \
    --quiet \
    --soft-fail \
    --output json > checkov_report.json

echo "------------------------------------------------------------"
echo "[INFO] IaC Scan completed. Results saved to checkov_report.json"
# In thử số lượng lỗi ra log để ní check cho nhanh
grep -E "passed|failed" checkov_report.json | head -n 5
echo "------------------------------------------------------------"