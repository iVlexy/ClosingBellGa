#!/bin/bash
# Run this script with sudo once to configure containerd to trust the local Docker registry at localhost:5000.
# Usage: sudo bash ~/LF-CQ/scripts/setup-local-registry.sh
set -euo pipefail

CONTAINERD_CONFIG="/etc/containerd/config.toml"
CERTS_DIR="/etc/containerd/certs.d/localhost:5000"

echo "==> Configuring containerd for local registry at localhost:5000..."

# If config_path is not already set, use the hosts.toml approach
if ! grep -q 'config_path = "/etc/containerd/certs.d"' "$CONTAINERD_CONFIG"; then
  # Backup containerd config
  cp "$CONTAINERD_CONFIG" "${CONTAINERD_CONFIG}.bak.$(date +%s)"

  # Update config_path to point to our certs.d directory
  sed -i 's|config_path = ""|config_path = "/etc/containerd/certs.d"|' "$CONTAINERD_CONFIG"
  echo "    Updated config_path in $CONTAINERD_CONFIG"
fi

# Create the hosts.toml for localhost:5000 (insecure HTTP)
mkdir -p "$CERTS_DIR"
cat > "$CERTS_DIR/hosts.toml" <<'EOF'
server = "http://localhost:5000"

[host."http://localhost:5000"]
  capabilities = ["pull", "resolve"]
  skip_verify   = true
EOF
echo "    Created $CERTS_DIR/hosts.toml"

# Restart containerd
echo "==> Restarting containerd..."
systemctl restart containerd
sleep 5
systemctl is-active containerd && echo "    containerd is running"

# Restart kubelet to pick up the new containerd configuration
echo "==> Restarting kubelet..."
systemctl restart kubelet
sleep 10
systemctl is-active kubelet && echo "    kubelet is running"

echo ""
echo "==> Done! Now applying Kubernetes deployments..."
cd /home/ethan/LF-CQ
kubectl apply -f k8s/api/deployment.yaml
kubectl apply -f k8s/ui/deployment.yaml

echo ""
echo "==> Waiting for pods to start (60s)..."
sleep 60
kubectl get pods -n livelyfencing

echo ""
echo "==> Setup complete! Once pods are running, configure Cloudflare Tunnel:"
echo "    1. Create tunnel in Cloudflare Zero Trust dashboard"
echo "    2. Update k8s/cloudflared/secret.yaml with tunnel token"
echo "    3. kubectl apply -f k8s/cloudflared/"
