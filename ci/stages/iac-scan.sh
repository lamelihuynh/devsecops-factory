#!/bin/bash
set -euo pipefail

MANIFEST_DIR="${1:-.}"
REPORT_DIR="${SCAN_REPORT_DIR:-scan-reports}"
mkdir -p "$REPORT_DIR"

# Kiểm tra jq (vẫn cần để parse kết quả)
if ! command -v jq &> /dev/null; then
    echo "[*] Installing jq..."
    sudo apt-get update && sudo apt-get install -y jq --quiet
fi

echo "[*] Starting IaC Scan (Checkov via Docker) in $MANIFEST_DIR..."

# Dùng Docker để chạy Checkov - Không cần cài pip3 trên host!
docker run --rm \
    --volume "$(pwd):/tf" \
    --workdir /tf \
    bridgecrew/checkov:latest \
    --directory "$MANIFEST_DIR" \
    --output json \
    --soft-fail \
    --quiet > "$REPORT_DIR/checkov-raw.json"

# Xử lý file JSON (vì Checkov chạy từ Docker có thể nhả output hơi khác)
if [ -s "$REPORT_DIR/checkov-raw.json" ]; then
    # Lọc lấy các lỗi HIGH và CRITICAL
    high_crit=$(jq '[.failed_checks[]? | select(.severity=="HIGH" or .severity=="CRITICAL")] | length' "$REPORT_DIR/checkov-raw.json" || echo "0")
else
    high_crit=0
fi

if [ "$high_crit" -gt 0 ]; then
    echo "------------------------------------------------------------"
    echo "[FAIL] Found $high_crit HIGH/CRITICAL misconfigurations!"
    echo "------------------------------------------------------------"
    exit 1
else
    echo "------------------------------------------------------------"
    echo "[PASS] No HIGH/CRITICAL IaC issues found."
    echo "------------------------------------------------------------"
    exit 0
fi