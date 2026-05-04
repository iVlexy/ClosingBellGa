# LivelyFencing — Deployment Status & Next Steps

## Current State (as of initial deployment)

All core Kubernetes pods are running:

| Pod | Status |
|-----|--------|
| `postgres-0` | ✅ Running |
| `ollama-0` | ✅ Running (llama3.2 + nomic-embed-text models loaded) |
| `api-*` | ✅ Running (ASP.NET Core 8 on port 8080) |
| `ui-*` | ✅ Running (Angular 19 + nginx on port 80) |

Images are stored in a local Docker registry at `localhost:5000` on the kube node.

---

## 1. GitHub Push (requires your action)

Add the node's SSH public key to your GitHub account:

1. Go to https://github.com/settings/ssh/new
2. Title: `livelyfencing-node`
3. Key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMjOrJexXNtmO75euoc1wRh1wCMF9YEywKg13umJG04l ethan@livelyfencing.com
```
4. Click **Add SSH key**

Then push from the node:
```bash
ssh ethan@192.168.86.127
cd ~/LF-CQ
git push -u origin main
```

---

## 2. Cloudflare Tunnel Setup (requires your action)

### 2a. Create the tunnel

1. Go to [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com)
2. Navigate to **Networks → Tunnels → Add a tunnel**
3. Choose **Cloudflared** connector type
4. Name: `livelyfencing`
5. Click **Save tunnel**
6. Copy the tunnel token (it looks like an eyJh... base64 string)

### 2b. Configure public hostnames in the tunnel

In the tunnel configuration, add two public hostnames:

| Subdomain | Domain | Service |
|-----------|--------|---------|
| (root) | livelyfencing.com | `http://ui.livelyfencing.svc.cluster.local:80` |
| api | livelyfencing.com | `http://api.livelyfencing.svc.cluster.local:8080` |

### 2c. Deploy cloudflared on the cluster

```bash
ssh ethan@192.168.86.127

# Replace TOKEN with your actual tunnel token
TUNNEL_TOKEN='eyJh...'

kubectl create secret generic cloudflared-secret \
  -n livelyfencing \
  --from-literal=TUNNEL_TOKEN="$TUNNEL_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f ~/LF-CQ/k8s/cloudflared/deployment.yaml
kubectl get pods -n livelyfencing
```

---

## 3. Cloudflare Zero Trust Access Application (requires your action)

To protect the app with Google OAuth via Cloudflare Access:

1. In Cloudflare Zero Trust → **Access → Applications → Add an application**
2. Type: **Self-hosted**
3. Application name: `LivelyFencing`
4. Application domain: `livelyfencing.com` AND `api.livelyfencing.com`
5. Identity providers: Enable **Google**
6. After creating, go to the app → **Overview** and copy the **Application Audience (AUD) tag**

### 3a. Update the API secret with real values

```bash
ssh ethan@192.168.86.127

# Replace with your actual values
CF_TEAM_DOMAIN='livelyfencing'          # Your team name in <team>.cloudflareaccess.com
CF_AUDIENCE='<AUD tag from CF dashboard>'

kubectl patch secret api-secret -n livelyfencing \
  --type='json' \
  -p='[
    {"op":"replace","path":"/data/CF_TEAM_DOMAIN","value":"'"$(echo -n "$CF_TEAM_DOMAIN" | base64)"'"},
    {"op":"replace","path":"/data/CF_AUDIENCE","value":"'"$(echo -n "$CF_AUDIENCE" | base64)"'"}
  ]'

# Restart the API pod to pick up new secrets
kubectl rollout restart deployment/api -n livelyfencing
```

---

## 4. SendGrid API Key (requires your action)

```bash
ssh ethan@192.168.86.127

SENDGRID_KEY='SG.your-api-key-here'

kubectl patch secret api-secret -n livelyfencing \
  --type='json' \
  -p='[{"op":"replace","path":"/data/SENDGRID_API_KEY","value":"'"$(echo -n "$SENDGRID_KEY" | base64)"'"}]'

kubectl rollout restart deployment/api -n livelyfencing
```

---

## 5. Push Images to Docker Hub (for production resilience)

The images are currently only in the local registry. If the kube node restarts and Docker containers are lost, you'd need to rebuild. For production resilience, push to Docker Hub:

```bash
ssh ethan@192.168.86.127

# Login to Docker Hub
docker login -u ethanbrowning

# Push images
docker push ethanbrowning/lf-api:latest
docker push ethanbrowning/lf-ui:latest

# Update deployments to use Docker Hub images
sed -i 's|localhost:5000/lf-api:latest|ethanbrowning/lf-api:latest|g' ~/LF-CQ/k8s/api/deployment.yaml
sed -i 's|localhost:5000/lf-ui:latest|ethanbrowning/lf-ui:latest|g' ~/LF-CQ/k8s/ui/deployment.yaml

kubectl apply -f ~/LF-CQ/k8s/api/deployment.yaml
kubectl apply -f ~/LF-CQ/k8s/ui/deployment.yaml
```

---

## 6. Role Assignment (First Login)

The first user to log in via Cloudflare/Google gets the `Admin` role automatically
(see `CloudflareJwtMiddleware.cs` — if no users exist, first user becomes Admin).

Subsequent users are assigned `FieldWorker` by default. An Admin can change roles
via the Users page in the application.

---

## Monitoring

```bash
# All pods
kubectl get pods -n livelyfencing -w

# API logs
kubectl logs -n livelyfencing -l app=api -f

# UI logs
kubectl logs -n livelyfencing -l app=ui -f

# Cloudflare tunnel logs (after setup)
kubectl logs -n livelyfencing -l app=cloudflared -f
```

---

## Database Migrations

EF Core migrations run automatically on API startup via:
```csharp
await db.Database.MigrateAsync();
```
The `pgvector` extension is also created automatically on first startup.

No manual migration steps are needed.
