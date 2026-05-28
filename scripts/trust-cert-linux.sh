#!/usr/bin/env bash
set -euo pipefail

ROOT_CA="${1:-certs/rootCA.pem}"
CERT_NAME="firebase-local-gateway.crt"

if [[ ! -f "$ROOT_CA" ]]; then
  echo "Root CA not found: $ROOT_CA"
  echo "Start the proxy once so it generates certs/rootCA.pem, then run this script again."
  exit 1
fi

if command -v update-ca-certificates >/dev/null 2>&1; then
  echo "Installing CA for Debian/Ubuntu style trust store..."
  sudo cp "$ROOT_CA" "/usr/local/share/ca-certificates/$CERT_NAME"
  sudo update-ca-certificates
elif command -v update-ca-trust >/dev/null 2>&1; then
  echo "Installing CA for Fedora/RHEL style trust store..."
  sudo cp "$ROOT_CA" "/etc/pki/ca-trust/source/anchors/$CERT_NAME"
  sudo update-ca-trust
else
  echo "Could not find update-ca-certificates or update-ca-trust."
  echo "Install the CA manually from: $ROOT_CA"
  exit 1
fi

echo "Done. Restart browsers that were already open."
