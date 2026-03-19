# DevSecOps Factory 
**Linh = Team-1, My = Team 2, Loi = Team 3**
> **Local-first, cloud-after.** 

---

## Team ownership map

| Directory / File | Owner | Branch |
|---|---|---|
| `infrastructure/` · `ci/Jenkinsfile` · `docker-compose.infra.yml` | **Team 1 — Infra** | `team/infra` |
| `security/` · `ci/stages/` · `docker-compose.security.yml` | **Team 2 — Security** | `team/security` |
| `app/` · `kubernetes/` · `cd/` · `monitoring/` · `docker-compose.obs.yml` | **Team 3 — App** | `team/app` |
| `shared/contracts/` · `docker-compose.yml` · `Makefile` | **All teams** | requires all reviews |

CODEOWNERS in `.github/CODEOWNERS` enforces this — GitHub blocks merges without the right team's review.

---

## Quick start 

### Prerequisites (install once)

```bash
# macOS
brew install docker k3d kubectl helm make git

# Ubuntu
curl -fsSL https://get.docker.com | sh
curl -sfL https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Clone and run

```bash
git clone https://github.com/lamelihuynh/devsecops-factory.git
cd devsecops-factory

# First time: copies env template and starts everything
make bootstrap
```

That's it. `make bootstrap` does:
1. Copies `shared/contracts/env-template.env` → `.env`
2. Creates shared Docker network
3. `docker compose up -d` (all 3 modules)
4. Creates k3d cluster and connects it to local registry
5. Installs ingress-nginx and ArgoCD on the cluster

### Check everything is running

```bash
make status
```

---

## Access URLs

| Service | URL | Default credentials |
|---|---|---|
| Jenkins | http://localhost:8080 | admin / admin123 |
| Gitea | http://localhost:3000 | set on first visit |
| SonarQube | http://localhost:9000 | admin / admin |
| DefectDojo | http://localhost:8081 | admin / admin123 |
| Grafana | http://localhost:3001 | admin / admin123 |
| Prometheus | http://localhost:9090 | — |
| ArgoCD | https://localhost:8443 | admin / `make argocd-install` shows password |
| Registry | localhost:5001 | — |

**Change all passwords in `.env` before sharing access with teammates.**

---

## How work in parallel

### The contract rule

The `shared/contracts/` folder is the **only** interface between teams. It defines:
- `ports.yaml` — every service port (no hardcoding anywhere else)
- `image-names.yaml` — registry URL + image name convention
- `env-template.env` — which env vars each team fills in

Any change to `shared/contracts/` requires a PR approved by **all member**.

### Git workflow

```
main  ←── PR (requires CODEOWNERS review) ←── team/infra
      ←── PR (requires CODEOWNERS review) ←── team/security
      ←── PR (requires CODEOWNERS review) ←── team/app
```
### How run 

```bash
# Team 1 only
make up-infra

# Team 2 only (needs network: run once first)
docker network create devsecops
make up-security

# Team 3 only
make up-obs
```

### Full parallel startup

```bash
make up          # starts all 3 modules together
```

Docker Compose `include:` assembles `docker-compose.infra.yml` + `docker-compose.security.yml` + `docker-compose.obs.yml` into one stack. Each team only touches their own file.

---

## Project structure

```
devsecops-factory/
│
├── shared/contracts/          # ← ALL TEAMS READ THIS, nobody edits alone
│   ├── ports.yaml             # Service port registry
│   ├── image-names.yaml       # Registry + image naming convention
│   └── env-template.env       # .env template (each team fills their section)
│
├── .github/
│   ├── CODEOWNERS             # GitHub enforced ownership
│   └── workflows/
│       ├── infra-validate.yml    # Team 1: Terraform + Helm + Dockerfile lint
│       ├── security-validate.yml # Team 2: policy lint + ShellCheck
│       └── app-validate.yml      # Team 3: kustomize + manifest + prom rules
│
├── docker-compose.yml         # Root: includes all 3 team compose files
├── docker-compose.infra.yml   # Team 1: Jenkins + Gitea + Registry
├── docker-compose.security.yml # Team 2: SonarQube + DefectDojo + ZAP
├── docker-compose.obs.yml     # Team 3: Prometheus + Grafana + Loki
├── Makefile                   # Unified CLI for all teams
│
├── infrastructure/            # ── TEAM 1 ──────────────────────────────
│   ├── k3d/cluster.yaml       # Local Kubernetes (replaces EKS)
│   ├── terraform/             # AWS IaC (for cloud migration)
│   │   ├── modules/vpc/
│   │   ├── modules/eks/
│   │   └── modules/ecr/
│   └── helm/                  # Helm values for in-cluster tools
│       ├── jenkins/
│       ├── argocd/
│       └── falco/
│
├── ci/                        # ── TEAM 1 (Jenkinsfile) + TEAM 2 (stages/)
│   ├── Jenkinsfile            # Pipeline orchestration — Team 1 owns
│   ├── Dockerfile.agent       # Agent with all tools — Team 1 owns
│   ├── jenkins-casc.yaml      # Jenkins config-as-code — Team 1 owns
│   └── stages/                # Security scan scripts — TEAM 2 owns
│       ├── secrets-scan.sh
│       ├── sca-scan.sh
│       ├── sast-scan.sh
│       ├── container-scan.sh
│       ├── iac-scan.sh
│       └── dast-scan.sh
│
├── security/                  # ── TEAM 2 ──────────────────────────────
│   ├── secrets-scanning/
│   │   ├── .gitleaks.toml
│   │   └── trufflehog-config.yaml
│   ├── sast/
│   │   ├── sonar-project.properties
│   │   └── .semgrep.yml
│   ├── sca/
│   │   └── owasp-dc-suppressions.xml
│   ├── container/
│   │   └── trivy.yaml
│   ├── dast/
│   │   └── zap-config.yaml
│   ├── runtime/
│   │   ├── falco-rules.yaml
│   │   ├── kyverno-policies/
│   │   └── network-policies/
│   └── aggregation/
│       └── defectdojo-connector.py
│
├── app/                       # ── TEAM 3 ──────────────────────────────
│   ├── Dockerfile
│   └── src/                   # Application source (Tetris)
│
├── kubernetes/                # ── TEAM 3 ──────────────────────────────
│   ├── base/
│   │   └── deployment.yaml    # Deployment + Service + Ingress
│   └── overlays/
│       ├── staging/
│       │   └── kustomization.yaml
│       └── production/
│           └── kustomization.yaml
│
├── cd/                        # ── TEAM 3 ──────────────────────────────
│   └── apps/
│       └── argocd-apps.yaml   # ArgoCD Application CRDs
│
└── monitoring/                # ── TEAM 3 ──────────────────────────────
    ├── prometheus.yml
    ├── loki-config.yaml
    ├── promtail-config.yaml
    └── grafana/
        ├── dashboards/
        └── provisioning/
```

---

## Pipeline flow (end-to-end)

```
Developer pushes to Gitea
    ↓
Gitea webhook → Jenkins
    ↓
Jenkins Jenkinsfile stages:
  ① Secrets scan        (calls ci/stages/secrets-scan.sh — Team 2 script)
  ② Build + unit tests  (npm/Maven — Team 1 orchestrates)
  ③ SCA                 (calls ci/stages/sca-scan.sh — Team 2 script)
  ④ SAST SonarQube      (calls ci/stages/sast-scan.sh — Team 2 script)
  ⑤ Docker build        (Team 1 orchestrates, Team 3's Dockerfile)
  ⑥ Container scan      (calls ci/stages/container-scan.sh — Team 2 script)
  ⑦ IaC scan            (calls ci/stages/iac-scan.sh — Team 2 script)
  ⑧ Push → local registry
  ⑨ Bump image tag in GitOps repo → ArgoCD auto-syncs staging
  ⑩ DAST ZAP vs staging  (calls ci/stages/dast-scan.sh — Team 2 script)
  ⑪ Manual approval gate
  ⑫ Promote → production GitOps → ArgoCD syncs prod
    ↓
All scan results → DefectDojo (security single pane of glass)
All metrics/logs → Prometheus + Loki → Grafana dashboards
```

---

## Troubleshooting

**SonarQube won't start**
```bash
sudo sysctl -w vm.max_map_count=262144
# Permanent: echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

**k3d cluster not pulling from local registry**
```bash
# Registry must be running BEFORE k3d cluster is created
make down
make up-infra
make k3d-create
```

**ArgoCD not syncing**
```bash
export KUBECONFIG=~/.kube/devsecops-local.kubeconfig
kubectl get pods -n argocd
kubectl logs -n argocd deployment/argocd-server
```

**Port already in use**
Check `shared/contracts/ports.yaml` for the port that's conflicting, then free it:
```bash
lsof -i :<port>
```

---

## Moving to cloud

When ready (after assignment, or with budget):

```bash
# 1. Provision AWS infrastructure
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars  # fill in your AWS account
terraform init && terraform apply

# 2. Update .env
REGISTRY=<account>.dkr.ecr.us-east-1.amazonaws.com
KUBECONFIG_PATH=~/.kube/eks-cluster.kubeconfig

# 3. Install same Helm charts on EKS — zero pipeline change
make argocd-install   # (with EKS kubeconfig active)
```

The `Jenkinsfile` reads `REGISTRY` and `KUBECONFIG_PATH` from env — no code changes needed.

---

## Cost summary

| Mode | Monthly cost |
|---|---|
| Local (assignment) | **$0** |
| Cloud — AWS EKS minimal (1 cluster) | **~$115–155** |
| Cloud — with separate staging cluster | **~$230** |
