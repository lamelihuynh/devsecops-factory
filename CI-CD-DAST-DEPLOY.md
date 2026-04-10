# DevSecOps Full Pipeline — CI/CD/DAST/Deploy Guide

## Overview

```
GitHub Push
    ↓ (webhook)
Jenkins CI/CD Pipeline
    ├─ Secrets Scan (Gitleaks)
    ├─ SCA (Dependency-Check)
    ├─ SAST (SonarQube)
    ├─ Build Docker Image
    ├─ Container Scan (Trivy)
    ├─ IaC Scan (Checkov)
    ├─ Push to AWS ECR
    ├─ Deploy Staging (GitOps via ArgoCD)
    ├─ DAST (OWASP ZAP)
    ├─ Manual Approval Gate
    ├─ Deploy Production (GitOps via ArgoCD)
    └─ Post-Deployment Tests
         ↓
Developers use App: tetris.example.com
Monitor via Grafana + Prometheus + Loki
```

---

## Phase 1: Local Development (Staging)

### Prerequisites

```bash
# Install Docker + k3d
brew install docker k3d kubectl helm

# Configure AWS credentials
aws configure
# Access Key ID: xxx
# Secret Access Key: xxx
# Default region: ap-southeast-1
```

### Start Jenkins Locally

```bash
cd /Users/huynhnhatlinh0305/Downloads/devsecops-factory

# Create Docker network
docker network create devsecops

# Start Jenkins
docker compose -f docker-compose.infra.yml up -d

# Wait for Jenkins to be healthy
docker logs -f jenkins
# Look for: "Jenkins is fully up and running"

# Access UI
# URL: http://localhost:8080
# User: admin
# Pass: admin123
```

---

## Phase 2: Setup CI/CD Pipeline

### Step 1: Create Jenkins Job

1. Go to Jenkins: http://localhost:8080
2. New Item → Pipeline
3. Name: `devsecops-full-pipeline`
4. Pipeline Definition:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/lamelihuynh/devsec-test.git`
   - Branch Specifier: `*/main`
   - Script Path: `ci/Jenkinsfile`
   - Credentials: Add GitHub token (Personal Access Token with `repo` + `admin:repo_hook`)

### Step 2: Add AWS Credentials to Jenkins

Jenkins → Manage Jenkins → Credentials → Global credentials → Add Credentials

**Credential 1:**
- Kind: Secret text
- ID: `aws-access-key-id`
- Secret: (your AWS Access Key)

**Credential 2:**
- Kind: Secret text
- ID: `aws-secret-access-key`
- Secret: (your AWS Secret Key)

### Step 3: Install Security Tools in Jenkins Container

```bash
docker exec -it jenkins bash

# Install AWS CLI
apt-get update
apt-get install -y awscli git curl jq

# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Install Checkov
pip3 install checkov

# Install Gitleaks
curl -L https://github.com/zricethezav/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz -o /tmp/gitleaks.tar.gz && tar -xz -C /usr/local/bin -f /tmp/gitleaks.tar.gz

# Install Dependency-Check
curl -L https://github.com/jeremylong/DependencyCheck/releases/download/v8.4.0/dependency-check-8.4.0-release.zip -o /tmp/dc.zip && unzip -q /tmp/dc.zip -d /opt && ln -s /opt/dependency-check/bin/dependency-check.sh /usr/local/bin/

# Install SonarQube Scanner
curl -L https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip -o /tmp/sonar.zip && unzip -q /tmp/sonar.zip -d /opt && ln -s /opt/sonar-scanner-5.0.1.3006-linux/bin/sonar-scanner /usr/local/bin/

# Install OWASP ZAP for DAST
docker pull owasp/zap2docker-stable

exit
```

---

## Phase 3: Setup EKS + ArgoCD (Production)

### Create EKS Cluster

```bash
cd infrastructure/terraform

# Copy tfvars template
cp terraform.tfvars.example terraform.tfvars

# Fill in your AWS details:
# - aws_region = "ap-southeast-1"
# - environment = "prod"
# - cluster_name = "devsecops-prod"

terraform init
terraform plan
terraform apply

# Get kubeconfig
aws eks update-kubeconfig --name devsecops-prod --region ap-southeast-1
```

### Install ArgoCD on EKS

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
helm repo add argo https://argoproj.github.io/argo-helm
helm install argocd argo/argo-cd -n argocd

# Get initial password
argocd admin initial-password -n argocd

# Port-forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8443:443 &
# Access: https://localhost:8443

# Login
argocd login localhost:8443 --username admin --password (from above)

# Create ArgoCD applications
argocd app create devsecops-staging \
  --repo https://github.com/lamelihuynh/devsec-test.git \
  --path kubernetes/overlays/staging \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace staging \
  --sync-policy automated

argocd app create devsecops-production \
  --repo https://github.com/lamelihuynh/devsec-test.git \
  --path kubernetes/overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production \
  --sync-policy none  # Manual sync for prod
```

---

## Phase 4: GitHub Webhook Setup

### Configure GitHub to trigger Jenkins

1. GitHub Repo → Settings → Webhooks → Add webhook
2. Payload URL: `http://YOUR_JENKINS_IP:8080/github-webhook/`
3. Content type: `application/json`
4. Events: `Just the push event`
5. Active: ✓
6. Add webhook

### Test Webhook

```bash
# Make a commit and push
cd /path/to/devsec-test
echo "// test update" >> app/src/App.js
git add .
git commit -m "test trigger"
git push origin main

# Jenkins should trigger automatically
# Check Jenkins → devsecops-full-pipeline → build history
```

---

## Phase 5: Test Full Pipeline

### Push Code to Trigger Build

```bash
cd /path/to/devsec-test
echo "// update" >> app/src/App.js
git add .
git commit -m "feature: UI update"
git push origin main
```

### Monitor Pipeline

**Jenkins Console:**
- Watch build log in real-time
- See all 15 stages execute
- Approve manual gate when prompted

**Expected Output:**
```
✓ Checked out commit: abc1234
🔍 Running secrets scan (Gitleaks)...
📦 Running SCA scan (OWASP Dependency-Check)...
📝 Running SAST scan (SonarQube via scanner)...
🏗️ Building Docker image...
🐋 Running container scan (Trivy)...
⚙️ Running IaC scan (Checkov)...
📤 Pushing image to AWS ECR...
✓ Pushed to: 997961584240.dkr.ecr.ap-southeast-1.amazonaws.com/devsecops/ecr:abc1234
🚀 Deploying to staging via ArgoCD...
🔐 Running DAST scan on staging app...
👤 Waiting for manual approval...
[Approve or Reject]
🎯 Deploying to production via ArgoCD...
✅ Post-deployment tests passed
```

### Check Deployment

**Staging:**
```bash
kubectl get pods -n staging -w
kubectl logs -n staging deployment/tetris -f
curl http://tetris-staging.example.com
```

**Production:**
```bash
kubectl get pods -n production -w
kubectl logs -n production deployment/tetris -f
curl http://tetris.example.com
```

---

## Phase 6: Monitoring (Loki + Prometheus + Grafana)

### Access Monitoring Stack

```bash
# Prometheus (metrics)
# http://localhost:9090

# Grafana (dashboards)
# http://localhost:3000
# User: admin / admin

# Loki (logs)
# Query via Grafana
```

### View Pipeline Metrics

1. Grafana → Dashboards → DevSecOps Pipeline
2. Metrics:
   - Build success rate
   - Pipeline duration
   - Security scan findings
   - Deployment frequency

---

## Where Each Component Used

| Component | Purpose | Production | Staging | Local |
|-----------|---------|------------|---------|-------|
| **Jenkins** | CI orchestrator | ✓ (EC2) | ✓ | ✓ (Docker) |
| **GitHub** | Source code repo | ✓ | ✓ | ✓ |
| **ECR** | Container registry | ✓ | ✓ (pull) | - |
| **EKS** | K8s cluster | ✓ | - | - |
| **k3d** | Local K8s | - | - | ✓ |
| **ArgoCD** | GitOps sync | ✓ | - | - |
| **Trivy** | Container scan | ✓ (Jenkins) | ✓ | ✓ |
| **ZAP** | DAST | ✓ (Jenkins) | ✓ | - |
| **SonarQube** | SAST | ✓ (optional) | ✓ | - |
| **Prometheus** | Metrics | ✓ | - | - |
| **Grafana** | Dashboard | ✓ | - | - |
| **Loki** | Logs | ✓ | - | - |

---

## Security Gates & Thresholds

| Gate | Tool | Threshold | Action |
|------|------|-----------|--------|
| Secrets | Gitleaks | 0 findings | Fail if any found |
| SCA | Dependency-Check | CVSS < 7 | Warn only |
| SAST | SonarQube | 0 blockers | Fail if any |
| Container | Trivy | CRITICAL = 0 | Fail if any |
| IaC | Checkov | All checks | Warn only |
| DAST | ZAP | No critical | Manual review |

---

## Troubleshooting

**Build fails at "Push to ECR"**
- Check AWS credentials in Jenkins
- Verify IAM user has ECR permissions
- Test: `aws ecr describe-repositories --region ap-southeast-1`

**ArgoCD not syncing**
- Check network connectivity K8s ↔ GitHub
- Verify GitHub repo is public or SSH key added
- Check ArgoCD logs: `kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server`

**DAST scan times out**
- Increase timeout in Jenkinsfile stage 12
- Verify staging app is accessible from Jenkins
- Check DNS/networking: `curl http://tetris-staging.example.com`

**Manual approval never appears**
- Ensure Jenkins has credentials for the approver user
- Check: Jenkins → Manage Jenkins → Configure System → Approval settings
- Restart Jenkins if needed

---

## Cost Optimization

| Resource | Cost/Month | Optimization |
|----------|-----------|--------------|
| EKS | $73 | Use Spot nodes, scale down at night |
| NAT Gateway | $32 | Use single NAT for dev, remove for staging |
| ECR | ~$5 | Lifecycle policies to clean old images |
| EC2 (Jenkins) | $20-50 | t3.small when idle, schedule scale-down |
| RDS/ElastiCache | variable | Not needed for DevSecOps demo |

**Total: ~$130/month** (can reduce to $65/month with scheduling)

---

## Next Steps

1. ✅ Push first change to GitHub
2. ✅ Monitor Jenkins pipeline
3. ✅ Approve staging to production promotion
4. ✅ Verify production deployment
5. ✅ Set up Slack notifications for pipeline events
6. ✅ Configure SonarQube quality gates
7. ✅ Setup DefectDojo for aggregate security reporting
8. ✅ Enable audit logging in ArgoCD
