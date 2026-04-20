#!/usr/bin/env bash
# =============================================================================
# ci/stages/sca-scan.sh
# Owner : Team 2 — My
# Purpose: SCA (Software Composition Analysis) using OWASP Dependency-Check
# =============================================================================

set -euo pipefail

FAIL_CVSS="${SCA_FAIL_CVSS:-7}"
DC_VERSION="${DC_VERSION:-9.0.9}"

SCA_TOOL_DIR="${WORKSPACE}/security/sca"
DC_HOME="${SCA_TOOL_DIR}/dependency-check"
DC_BIN="${DC_HOME}/bin/dependency-check.sh"
DC_DATA_DIR="${SCA_TOOL_DIR}/data"  # <--- Nơi chứa Database NVD

# Đường dẫn quét và báo cáo
SCAN_DIR="${SCAN_DIR:-${WORKSPACE}/app}"
REPORT_DIR="${SCAN_REPORT_DIR:-${WORKSPACE}/scan-reports}"
REPORT_JSON="${REPORT_DIR}/sca-dependency-check-report.json"
REPORT_HTML="${REPORT_DIR}/sca-dependency-check-report.html"
NVD_API_KEY="${NVD_API_KEY:-}"
mkdir -p "${REPORT_DIR}"
mkdir -p "${DC_DATA_DIR}"
mkdir -p "${SCA_TOOL_DIR}"

echo "============================================================"
echo "  SCA SCAN — OWASP Dependency-Check"
echo "  Scan target : ${SCAN_DIR}"
echo "  Tool Home   : ${DC_HOME}"
echo "  Data Dir    : ${DC_DATA_DIR}"
echo "============================================================"
install_dependency_check() {
  echo "[*] Installing OWASP Dependency-Check v${DC_VERSION}..."
  local ZIP="dependency-check-${DC_VERSION}-release.zip"
  local URL="https://github.com/jeremylong/DependencyCheck/releases/download/v${DC_VERSION}/${ZIP}"

  curl -sSL "${URL}" -o "/tmp/${ZIP}"
  # Giải nén vào folder security/sca
  unzip -qo "/tmp/${ZIP}" -d "${SCA_TOOL_DIR}"
  chmod +x "${DC_BIN}"
  rm -f "/tmp/${ZIP}"
  echo "[+] Dependency-Check installed at ${DC_HOME}"
}

if [[ ! -x "${DC_BIN}" ]]; then
  install_dependency_check
fi
DC_ARGS=(
  --project "devsecops-factory"
  --scan    "${SCAN_DIR}"
  --out     "${REPORT_DIR}"
  --data    "${DC_DATA_DIR}"  
  --format  "JSON"
  --format  "HTML"
  --failOnCVSS "${FAIL_CVSS}"
  --enableRetired
  --enableExperimental
  --nodeAuditSkipDevDependencies
  --log "${REPORT_DIR}/sca-dc.log"

  --nvdApiDelay 10000            # Chờ 10 giây giữa các lần gọi API
  --nvdMaxRetryCount 10          # Thử lại tối đa 10 lần nếu bị NVD từ chối

)

if [[ -n "${NVD_API_KEY}" ]]; then
  DC_ARGS+=(--nvdApiKey "${NVD_API_KEY}")
fi

echo "[*] Starting OWASP Dependency-Check scan..."
set +e
"${DC_BIN}" "${DC_ARGS[@]}"
DC_EXIT=$?
set -e

# Đổi tên file report
[[ -f "${REPORT_DIR}/dependency-check-report.json" ]] && \
  mv "${REPORT_DIR}/dependency-check-report.json" "${REPORT_JSON}"
[[ -f "${REPORT_DIR}/dependency-check-report.html" ]] && \
  mv "${REPORT_DIR}/dependency-check-report.html" "${REPORT_HTML}"
print_summary() {
  if command -v jq &>/dev/null && [[ -f "${REPORT_JSON}" ]]; then
    local total critical high medium low
    total=$(jq '[.dependencies[].vulnerabilities // [] | length] | add // 0' "${REPORT_JSON}")
    critical=$(jq '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="CRITICAL")] | length' "${REPORT_JSON}")
    high=$(jq     '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="HIGH")]     | length' "${REPORT_JSON}")
    medium=$(jq   '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="MEDIUM")]   | length' "${REPORT_JSON}")
    low=$(jq      '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="LOW")]      | length' "${REPORT_JSON}")

    echo ""
    echo "┌──────────────────────────────────────────┐"
    echo "│         SCA Scan Results Summary          │"
    echo "├──────────────────────────────────────────┤"
    printf "│  %-10s %28s  │\n" "CRITICAL:"  "${critical}"
    printf "│  %-10s %28s  │\n" "HIGH:"      "${high}"
    printf "│  %-10s %28s  │\n" "MEDIUM:"    "${medium}"
    printf "│  %-10s %28s  │\n" "LOW:"       "${low}"
    printf "│  %-10s %28s  │\n" "TOTAL:"     "${total}"
    echo "└──────────────────────────────────────────┘"
  fi
}

print_summary
if [[ "${DC_EXIT}" -eq 1 ]]; then
  echo "[CRITICAL] SCA SCAN FAILED — CVSS >= ${FAIL_CVSS} detected."
  exit 1
elif [[ "${DC_EXIT}" -ne 0 ]]; then
  echo "[ERROR] Dependency-Check exited with code ${DC_EXIT}."
  exit "${DC_EXIT}"
fi

echo "[PASS] SCA scan completed."