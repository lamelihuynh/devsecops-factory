#!/bin/bash
# ============================================================
# SCA SCAN — Trivy (Filesystem Mode)
# ============================================================

echo "============================================================"
echo "  SCA SCAN (Filesystem) — Trivy"
echo "  Scan target : ${SCAN_DIR}"
echo "============================================================"

# 1. Cài đặt Trivy nếu chưa có
if ! command -v trivy &> /dev/null; then
    echo "[*] Installing Trivy..."
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
fi

# 2. Chạy quét thư viện (SCA)
# --scanners vuln: Chỉ quét lỗ hổng bảo mật
# --severity: Chỉ quan tâm đến lỗi HIGH và CRITICAL
trivy fs --scanners vuln \
    --severity HIGH,CRITICAL \
    --format json \
    --output "${SCAN_REPORT_DIR}/trivy-sca-report.json" \
    "${SCAN_DIR}"

# 3. Xuất thêm bản HTML để ní dễ đọc (Tùy chọn)
trivy fs --scanners vuln \
    --severity HIGH,CRITICAL \
    --template "@contrib/html.tpl" \
    --output "${SCAN_REPORT_DIR}/trivy-sca-report.html" \
    "${SCAN_DIR}"

echo "[+] SCA Scan completed. Report saved to ${SCAN_REPORT_DIR}"