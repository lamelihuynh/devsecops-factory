#!/bin/bash

# 1. Bỏ qua đoạn cài jq bằng sudo nếu bị lỗi, hoặc dùng bản không cần sudo
echo "[*] Starting IaC Scan (Checkov)..."

# 2. Lấy đường dẫn tuyệt đối của thư mục code
# (Bắt buộc phải dùng biến môi trường PWD của Jenkins hoặc đường dẫn tuyệt đối)
SCAN_PATH="$(pwd)/target-repo"

echo "[*] Scanning path: $SCAN_PATH"

# 3. Lệnh chạy Checkov thần thánh
docker run --rm \
    -v "${SCAN_PATH}:/tf" \
    bridgecrew/checkov:latest \
    --directory /tf \
    --soft-fail \
    --output json > checkov_report.json

# 4. Hiển thị kết quả tóm tắt (không cần jq nếu không có)
echo "------------------------------------------------------------"
echo "[INFO] IaC Scan completed. Report saved to checkov_report.json"
echo "------------------------------------------------------------"