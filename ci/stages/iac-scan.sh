#!/bin/bash
echo "============================================================"
echo "  IaC SCAN — Checkov (DinD Workaround)"
echo "============================================================"

# 1. Dọn dẹp thùng rác cũ (nếu có)
docker rm -f checkov-data 2>/dev/null || true

# 2. Tạo một container ảo (chỉ để giữ chỗ chứa data)
echo "[*] Tạo không gian lưu trữ ảo..."
docker create -v /tf --name checkov-data alpine:latest /bin/true

# 3. Copy code từ Jenkins vào thẳng container ảo này
echo "[*] Copying target-repo vào Checkov..."
docker cp ./target-repo checkov-data:/tf/

# 4. Chạy Checkov và mượn lại cái không gian ảo đó (--volumes-from)
echo "[*] Bắt đầu quét..."
docker run --rm \
    --volumes-from checkov-data \
    bridgecrew/checkov:latest \
    --directory /tf/target-repo \
    --soft-fail \
    --output json > checkov_report.json

# 5. Dọn dẹp chiến trường
echo "[*] Dọn dẹp container tạm..."
docker rm -v checkov-data

# 6. Kiểm tra lại thành quả
if [ -s checkov_report.json ]; then
    echo "------------------------------------------------------------"
    echo "[+] IaC Scan thành công rực rỡ!"
    # In ra số lượng file nó quét được để check ngay trên log
    grep -E "passed|failed|resource_count" checkov_report.json | head -n 5
    echo "------------------------------------------------------------"
else
    echo "[!] Lỗi: Không sinh ra được file report!"
    exit 1
fi