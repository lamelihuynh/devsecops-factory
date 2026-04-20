#!/usr/bin/env bash
set -euo pipefail

echo "[*] Checking for Trivy installation..."

# Tự động cài đặt Trivy nếu chưa có
if ! command -v trivy &> /dev/null; then
    echo "[!] Trivy not found. Installing Trivy..."
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
fi

echo "[*] Starting scan for image: ${IMAGE_FULL_PATH}"

trivy image --severity HIGH,CRITICAL --format table "${IMAGE_FULL_PATH}"