#!/usr/bin/env bash
set -euo pipefail

ROOT_CA="${1:-certs/rootCA.pem}"

if [[ ! -f "$ROOT_CA" ]]; then
  echo "Root CA not found: $ROOT_CA"
  echo "Start the proxy once so it generates certs/rootCA.pem, then run this script again."
  exit 1
fi

echo "Adding $ROOT_CA to macOS System keychain as a trusted root certificate..."
sudo security add-trusted-cert \
  -d \
  -r trustRoot \
  -k /Library/Keychains/System.keychain \
  "$ROOT_CA"

echo "Done. Restart browsers that were already open."
