#!/usr/bin/env bash
# =============================================================================
# ci/stages/container-scan.sh — OWNED BY TEAM 2
# Called by ci/Jenkinsfile stage "⑥ Container scan"
#
# Reads threshold from .env / Jenkins env: TRIVY_SEVERITY, TRIVY_EXIT_CODE
# Uploads results to DefectDojo via API
# =============================================================================
set -euo pipefail

REPORT_DIR="${REPORT_DIR:-/tmp/security-reports}"
IMAGE="${1:-${IMAGE_NAME}:${IMAGE_TAG:-latest}}"
SEVERITY="${TRIVY_SEVERITY:-HIGH,CRITICAL}"
EXIT_CODE="${TRIVY_EXIT_CODE:-1}"
DD_URL="${DEFECTDOJO_URL:-http://defectdojo:8080}"
DD_KEY="${DEFECTDOJO_KEY:-}"
ENGAGEMENT="${ENGAGEMENT_NAME:-CI-local}"

mkdir -p "$REPORT_DIR"

echo "=== [Team 2] Container scan: $IMAGE ==="

# Trivy scan
trivy image \
  --format json \
  --output "$REPORT_DIR/trivy.json" \
  --severity "$SEVERITY" \
  --exit-code 0 \
  --timeout 10m \
  "$IMAGE"

# Table output for humans
trivy image \
  --format table \
  --severity "$SEVERITY" \
  --exit-code "$EXIT_CODE" \
  --timeout 10m \
  "$IMAGE" || {
    echo "❌ Trivy found $SEVERITY vulnerabilities in $IMAGE"
    # Upload findings before failing
    _upload_to_defectdojo
    exit 1
  }

# Upload to DefectDojo (Team 2 owns this aggregation logic)
_upload_to_defectdojo() {
  if [ -n "$DD_KEY" ] && [ -s "$REPORT_DIR/trivy.json" ]; then
    curl -sf -X POST "${DD_URL}/api/v2/import-scan/" \
      -H "Authorization: Token ${DD_KEY}" \
      -F "scan_type=Trivy Scan" \
      -F "file=@${REPORT_DIR}/trivy.json" \
      -F "product_name=${DEFECTDOJO_PRODUCT_NAME:-Tetris-DevSecOps}" \
      -F "engagement_name=${ENGAGEMENT}" \
      -F "auto_create_context=true" \
      -F "close_old_findings=true" \
      >/dev/null 2>&1 && echo "Findings uploaded to DefectDojo" || echo "DefectDojo upload skipped"
  fi
}
_upload_to_defectdojo

echo "✅ Container scan passed"
