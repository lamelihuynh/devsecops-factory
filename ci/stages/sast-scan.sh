#!/usr/bin/env bash
# ci/stages/sast-scan.sh — OWNED BY TEAM 2
set -euo pipefail
REPORT_DIR="${REPORT_DIR:-/tmp/security-reports}"
mkdir -p "$REPORT_DIR"

echo "=== [Team 2] SAST — SonarQube + Semgrep ==="

sonar-scanner \
  -Dsonar.projectKey="${SONAR_PROJECT_KEY:-tetris-devsecops}" \
  -Dsonar.sources=src \
  -Dsonar.host.url="${SONAR_HOST:-http://sonarqube:9000}" \
  -Dsonar.login="${SONAR_TOKEN}" \
  -Dsonar.scm.disabled=true || true

if command -v semgrep &>/dev/null; then
  semgrep scan --config auto --json --output "$REPORT_DIR/semgrep.json" src/ 2>/dev/null || true
fi

echo "✅ SAST scan submitted"
