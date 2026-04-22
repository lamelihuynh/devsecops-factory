# Vulnerabilities introduced here (detectable by Trivy):
#   Case 1 – Outdated base image with known CVEs (node:16)
#   Case 2 – Running as root (no USER directive)
#   Case 3 – Copying .env file (secrets embedded in image layer)
#   Case 4 – Installing packages without version pinning (apt-get)
#   Case 5 – npm install without --ignore-scripts (supply chain)
#   Case 6 – Sensitive files in final image

# CASE 1 — Outdated base image with known CVEs
# Trivy check: Known CVEs in node:16 image
#   e.g. CVE-2023-30581, CVE-2023-38552, CVE-2023-39331 etc.
# Correct: Use node:lts-alpine or node:22-alpine

FROM node:16

# VULN: Not running as non-root (no USER directive until CMD)
# Trivy check: AVD-DS-0002 "Specify at least 1 USER command in Dockerfile"

# Set working directory
WORKDIR /app

# CASE 4 — Installing OS packages without version pinning
# Trivy check: unpinned package versions can pull in vulnerable releases
# Also: running apt-get without --no-install-recommends pulls extra packages
# VULN: installs curl + wget at unspecified (latest) versions
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    netcat-traditional \
    net-tools \
    && rm -rf /var/lib/apt/lists/*
# VULN: net-tools and netcat included — network recon tools inside image

# Copy package files and install dependencies
COPY package*.json ./

# CASE 5 — npm install without --ignore-scripts
# Trivy check: supply chain risk — malicious packages can run postinstall scripts
# Correct: npm ci --ignore-scripts --omit=dev
# VULN: lifecycle scripts from npm packages execute during install
RUN npm install

# Copy application source code
COPY . .

# CASE 3 — Copying .env with secrets into the image layer
# Trivy check: sensitive file in image (e.g., Trivy secret scanner)
# Gitleaks / container scan: secrets baked into image layers
#
# Even if deleted in a later layer, the secret persists in the
# intermediate layer and can be extracted with: docker image history
# VULN: .env file copied into the image — credentials baked into layers
COPY chatapp/backend/.env ./chatapp/backend/.env
COPY chatapp/key.txt ./chatapp/key.txt

# CASE 6 — Sensitive admin tool included in image
# VULN: mongodump/mongoexport included — enables bulk data extraction
# from within a compromised container
# VULN: database admin tools should never be in a production image

# Build step
RUN npm run build

# Expose port
EXPOSE 3000

# CASE 2 — No USER directive means container runs as root
# Trivy AVD-DS-0002: "Add 'USER <non-root-user>' to Dockerfile"
# VULN: An attacker who executes code in this container has root on the container
# USER node    ← this line is intentionally missing

CMD [ "npm", "start" ]
