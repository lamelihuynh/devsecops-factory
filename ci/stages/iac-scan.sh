#!/bin/bash

echo "============================================================"
echo "  IaC SCAN — Checkov"
echo "============================================================"

# 1. Identify the absolute path on the HOST (needed for Docker volume)
# In many Jenkins Docker setups, we need to scan the current directory directly
echo "[*] Current directory: $(pwd)"
echo "[*] Listing files in target-repo:"
ls -F target-repo | head -n 5

# 2. Run Checkov using the 'current directory' mount
# We mount the entire WORKSPACE so Docker can definitely see the files
docker run --rm \
    -v "$(pwd):/tf" \
    bridgecrew/checkov:latest \
    --directory /tf/target-repo \
    --soft-fail \
    --output json > checkov_report.json

# 3. Final Check
if [ -s checkov_report.json ]; then
    echo "[+] Checkov Scan finished successfully."
    # Check if we actually found resources
    RESOURCES=$(grep "resource_count" checkov_report.json | awk '{print $2}' | tr -d ',')
    echo "[*] Resources scanned: $RESOURCES"
else
    echo "[!] Error: checkov_report.json is empty!"
    exit 1
fi