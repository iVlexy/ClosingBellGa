# Third-Party Integrations

This document covers every external integration in the LivelyFencing application, where the
credentials live, how to rotate them, and what breaks if they go down.

---

## 1. Cloudflare

Cloudflare provides two separate services for this app: **Zero Trust Access** (authentication)
and **Tunnel** (ingress). These share the same Cloudflare account but are configured
independently.

### 1a. Cloudflare Zero Trust Access (Authentication)

**What it does:** Every API request is authenticated via a Cloudflare Access JWT. The API
validates the JWT signature against Cloudflare's public JWKS endpoint.

**Dashboard:** https://one.dash.cloudflare.com → Access → Applications

**Relevant config values (stored in k8s secret `api-secret`):**

| Secret Key      | Config Path (ASP.NET)       | What it is                                      |
|-----------------|-----------------------------|-------------------------------------------------|
| `CF_TEAM_DOMAIN` | `Cloudflare:TeamDomain`    | Your team subdomain, e.g. `livelyfencing`       |
| `CF_AUDIENCE`    | `Cloudflare:Audience`      | Application AUD tag from the Access application |

**Where to find these values:**
- `CF_TEAM_DOMAIN`: The subdomain of `cloudflareaccess.com` for your Zero Trust org.
  Found in Zero Trust dashboard → Settings → Custom Pages → your domain prefix.
- `CF_AUDIENCE`: Zero Trust → Access → Applications → click your app → copy the
  **Application Audience (AUD) Tag**.

**How to update:**
```bash
# Re-create the api-secret with updated values
kubectl delete secret api-secret -n livelyfencing
kubectl create secret generic api-secret -n livelyfencing \
  --from-literal=CF_TEAM_DOMAIN='<new-team-domain>' \
  --from-literal=CF_AUDIENCE='<new-aud-tag>' \
  --from-literal=SENDGRID_API_KEY='<existing-key>' \
  --from-literal=CONNECTION_STRING='<existing-conn-string>' \
  --from-literal=ENCRYPTION_KEY='<existing-key>'
kubectl rollout restart deploy/api -n livelyfencing
```

**JWKS caching:** The API caches signing keys for 1 hour in memory
(`CloudflareJwtMiddleware.cs`). After rotating keys in Cloudflare, the old keys remain valid
for up to 1 hour. Rolling the API pod (`kubectl rollout restart deploy/api -n livelyfencing`)
flushes the cache immediately.

**Auth bypass rule (critical):** Only `POST /contact` is public. All other routes require a
valid JWT. The bypass check in `CloudflareJwtMiddleware.cs` must remain an exact match:
```csharp
path == "/contact" && context.Request.Method == "POST"
```
Never change this to `StartsWith` — it will break auth on all `/contact/*` routes.

---

### 1b. Cloudflare Tunnel (Ingress)

**What it does:** Routes public traffic at `livelyfencing.com` and `api.livelyfencing.com`
to the k8s pods without exposing any ports on the home server.

**Dashboard:** https://one.dash.cloudflare.com → Networks → Tunnels

**Credential stored in k8s secret `cloudflared-secret`:**

| Secret Key     | What it is                                       |
|----------------|--------------------------------------------------|
| `TUNNEL_TOKEN` | Long-lived tunnel credential token from CF dashboard |

**How to get a new token (if the tunnel needs to be recreated):**
1. Cloudflare dashboard → Networks → Tunnels → Create a tunnel → Docker
2. Copy the `--token <value>` from the install command shown
3. Update the secret:
```bash
kubectl delete secret cloudflared-secret -n livelyfencing
kubectl create secret generic cloudflared-secret -n livelyfencing \
  --from-literal=TUNNEL_TOKEN='<new-token>'
kubectl rollout restart deploy/cloudflared -n livelyfencing
```

**Tunnel routing** is configured entirely in the Cloudflare dashboard (not in yaml files).
Current routes:
- `livelyfencing.com` → `http://ui.livelyfencing.svc.cluster.local` (k8s service)
- `api.livelyfencing.com` → `http://api.livelyfencing.svc.cluster.local:8080`

---

## 2. SendGrid (Email)

**What it does:** Sends two types of emails:
1. **Quote emails** — PDF quote attached, sent to the customer when a quote is emailed from the
   back office. Includes a portal link for the customer to view/accept.
2. **Contact notifications** — Alert email to the admin when someone submits the contact form on
   the landing page.

**Dashboard:** https://app.sendgrid.com → Settings → API Keys

**Config values:**

| Secret Key / Config Key       | k8s Secret Key   | Default if unset              |
|-------------------------------|------------------|-------------------------------|
| `SendGrid:ApiKey`             | `SENDGRID_API_KEY` in `api-secret` | — (required, will crash) |
| `SendGrid:FromEmail`          | Not in secret — hardcoded default | `quotes@livelyfencing.com` |
| `SendGrid:FromName`           | Not in secret — hardcoded default | `Lively Fencing`          |
| `App:AdminEmail`              | Not in secret — hardcoded default | same as `FromEmail`        |
| `App:PortalBaseUrl`           | Plain env var in deployment.yaml  | `https://livelyfencing.com` |

**To add `App:AdminEmail` or override email config** (currently uses defaults), add env vars
to `k8s/api/deployment.yaml`:
```yaml
- name: App__AdminEmail
  value: "ethan@livelyfencing.com"
- name: SendGrid__FromEmail
  value: "noreply@livelyfencing.com"
```
Then redeploy the API.

**How to rotate the API key:**
1. SendGrid dashboard → Settings → API Keys → Create API Key (Full Access or restricted to
   Mail Send)
2. Update the k8s secret:
```bash
kubectl delete secret api-secret -n livelyfencing
kubectl create secret generic api-secret -n livelyfencing \
  --from-literal=SENDGRID_API_KEY='<new-key>' \
  --from-literal=CF_TEAM_DOMAIN='<existing>' \
  --from-literal=CF_AUDIENCE='<existing>' \
  --from-literal=CONNECTION_STRING='<existing>' \
  --from-literal=ENCRYPTION_KEY='<existing>'
kubectl rollout restart deploy/api -n livelyfencing
```

**Sender verification:** The `FromEmail` domain must be verified in SendGrid. If you change
the from address to a new domain, verify it under SendGrid → Settings → Sender Authentication.

**What breaks if SendGrid is down / key is invalid:** Quote emails and contact notifications
fail silently with a logged error. The contact form submission still saves to the database.
Quote PDF generation still works — only the send fails.

---

## 3. Ollama (Self-Hosted AI)

**What it does:** Powers the AI quote generation feature. When generating a quote in the back
office, the API:
1. Embeds the job description using `nomic-embed-text`
2. Searches the database for similar past jobs using pgvector L2 distance
3. Sends the context + new job details to `llama3.2` for line item suggestions

**No external API key required.** Ollama runs as a pod in the cluster at
`http://ollama:11434` (k8s DNS name).

**Pod:** `kubectl get pod -n livelyfencing -l app=ollama`

**Models in use:**

| Model              | Purpose                  |
|--------------------|--------------------------|
| `nomic-embed-text` | Job description embeddings (768-dim vectors stored in pgvector) |
| `llama3.2`         | Quote line item generation |

**Config:** `Ollama:BaseUrl` is set as a plain env var in `k8s/api/deployment.yaml`:
```yaml
- name: Ollama__BaseUrl
  value: "http://ollama:11434"
```

**To change the Ollama URL** (e.g. pointing to an external Ollama instance or GPU server):
```yaml
- name: Ollama__BaseUrl
  value: "http://<new-host>:11434"
```
Then redeploy: `kubectl rollout restart deploy/api -n livelyfencing`

**To pull a new/different model onto the Ollama pod:**
```bash
kubectl exec -it -n livelyfencing $(kubectl get pod -n livelyfencing -l app=ollama -o name) \
  -- ollama pull <model-name>
```

**To swap models:** Update the model names in `OllamaQuoteService.cs`:
- Embedding model: `GetEmbeddingAsync` → `model = "nomic-embed-text"`
- Generation model: `CallGenerateAsync` → `model = "llama3.2"`

**Note on vector dimensions:** The `JobEmbedding.Embedding` column is typed `vector(768)` to
match `nomic-embed-text` output. If you switch embedding models, the vector dimension may
differ — you will need to drop and recreate the `JobEmbeddings` table and re-embed all jobs.

---

## 4. PostgreSQL

**What it does:** Primary database. Uses the `pgvector` extension for AI embeddings.

**Pod:** `postgres-0` (StatefulSet), `kubectl get pod -n livelyfencing -l app=postgres`

**Credentials stored in two k8s secrets:**

| Secret            | Key                | Used by              |
|-------------------|--------------------|----------------------|
| `postgres-secret` | `POSTGRES_USER`    | Postgres pod init    |
| `postgres-secret` | `POSTGRES_PASSWORD`| Postgres pod init    |
| `postgres-secret` | `POSTGRES_DB`      | Postgres pod init    |
| `api-secret`      | `CONNECTION_STRING`| ASP.NET Core API     |

The `CONNECTION_STRING` in `api-secret` must match the user/password/db in `postgres-secret`.
Current format:
```
Host=postgres;Port=5432;Database=livelyfencing;Username=lfuser;Password=<pw>
```

**How to rotate the DB password:**
> ⚠️ This requires downtime — the API will be unable to connect between steps.
```bash
# 1. Update password inside postgres
kubectl exec -it -n livelyfencing postgres-0 -- psql -U lfuser -d livelyfencing \
  -c "ALTER USER lfuser WITH PASSWORD '<new-password>';"

# 2. Update both secrets
kubectl delete secret postgres-secret -n livelyfencing
kubectl create secret generic postgres-secret -n livelyfencing \
  --from-literal=POSTGRES_USER='lfuser' \
  --from-literal=POSTGRES_PASSWORD='<new-password>' \
  --from-literal=POSTGRES_DB='livelyfencing'

kubectl delete secret api-secret -n livelyfencing
kubectl create secret generic api-secret -n livelyfencing \
  --from-literal=CONNECTION_STRING='Host=postgres;Port=5432;Database=livelyfencing;Username=lfuser;Password=<new-password>' \
  --from-literal=CF_TEAM_DOMAIN='<existing>' \
  --from-literal=CF_AUDIENCE='<existing>' \
  --from-literal=SENDGRID_API_KEY='<existing>' \
  --from-literal=ENCRYPTION_KEY='<existing>'

# 3. Restart API (postgres-0 does not need restart — password change is live)
kubectl rollout restart deploy/api -n livelyfencing
```

**Manual table creation:** The app uses `EnsureCreated` (not migrations). Any new entity
added to `AppDbContext` requires a manual `CREATE TABLE` statement. See the main
`copilot-instructions.md` for the full pattern.

---

## 5. QuestPDF (PDF Generation)

**What it does:** Generates PDF documents server-side — quote PDFs (sent via SendGrid) and
1099-NEC forms (for contractor tax reporting).

**License:** Community license — free for revenue under $1M/year. Set in `Program.cs`:
```csharp
QuestPDF.Settings.License = LicenseType.Community;
```

**No API key or external service.** QuestPDF runs entirely in-process as a NuGet package.

**If you need a commercial license:**
1. Purchase at https://www.questpdf.com/pricing.html
2. Set the license key in code:
```csharp
QuestPDF.Settings.License = LicenseType.Professional;
// or
QuestPDF.Settings.License = LicenseType.Enterprise;
```
Optionally store the license type as a config value if you want to control it without
redeploying.

---

## 6. Encryption Key

Used for any data encrypted at rest in the application.

**Stored in `api-secret` as `ENCRYPTION_KEY`, mapped to `Encryption:Key` in ASP.NET config.**

**How to rotate:**
> ⚠️ Rotating this key will make any previously encrypted data unreadable. Only rotate if the
> key is compromised — and re-encrypt all affected data first.
```bash
# Generate a new 256-bit key (base64-encoded)
python3 -c "import os,base64; print(base64.b64encode(os.urandom(32)).decode())"

# Then update api-secret (include all other keys)
kubectl delete secret api-secret -n livelyfencing
kubectl create secret generic api-secret -n livelyfencing \
  --from-literal=ENCRYPTION_KEY='<new-key>' \
  --from-literal=CF_TEAM_DOMAIN='<existing>' \
  --from-literal=CF_AUDIENCE='<existing>' \
  --from-literal=SENDGRID_API_KEY='<existing>' \
  --from-literal=CONNECTION_STRING='<existing>'
kubectl rollout restart deploy/api -n livelyfencing
```

---

## Quick Reference: All Secrets

### `api-secret` (Opaque)
```bash
kubectl get secret api-secret -n livelyfencing -o yaml
```
| Key                | Maps to (ASP.NET env var)               | Integration           |
|--------------------|-----------------------------------------|-----------------------|
| `CF_TEAM_DOMAIN`   | `Cloudflare__TeamDomain`                | Cloudflare Access     |
| `CF_AUDIENCE`      | `Cloudflare__Audience`                  | Cloudflare Access     |
| `SENDGRID_API_KEY` | `SendGrid__ApiKey`                      | SendGrid email        |
| `CONNECTION_STRING`| `ConnectionStrings__DefaultConnection`  | PostgreSQL            |
| `ENCRYPTION_KEY`   | `Encryption__Key`                       | Data encryption       |

### `cloudflared-secret` (Opaque)
| Key            | Used by               | Integration        |
|----------------|-----------------------|--------------------|
| `TUNNEL_TOKEN` | cloudflared container | Cloudflare Tunnel  |

### `postgres-secret` (Opaque)
| Key                | Used by          | Integration  |
|--------------------|------------------|--------------|
| `POSTGRES_USER`    | postgres-0 pod   | PostgreSQL   |
| `POSTGRES_PASSWORD`| postgres-0 pod   | PostgreSQL   |
| `POSTGRES_DB`      | postgres-0 pod   | PostgreSQL   |

---

## Viewing Current Secret Values

To decode and view any secret value (be careful — do not log or commit these):
```bash
kubectl get secret api-secret -n livelyfencing \
  -o jsonpath='{.data.SENDGRID_API_KEY}' | base64 -d && echo
```
Replace `SENDGRID_API_KEY` with any key name from the tables above.

---

## Integration Health Checklist

| Integration        | How to verify it's working                                              |
|--------------------|-------------------------------------------------------------------------|
| Cloudflare Access  | Log into the back office — if JWT auth fails you'll get a 401           |
| Cloudflare Tunnel  | `curl https://api.livelyfencing.com/health` returns `{"status":"healthy"}` |
| SendGrid           | Submit the contact form, check admin email inbox                        |
| Ollama             | Open a job → AI Suggest Quote → should return line items within 60s     |
| PostgreSQL         | `/health` endpoint returns 200 (API connects on startup)                |
