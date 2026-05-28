# Publishing

This package is currently `0.1.0`. Treat the config and plugin API as early and document breaking changes carefully.

## Preflight

```bash
npm install
npm run typecheck
npm run build
npm pack --dry-run
```

Check the dry-run output. It should include `dist`, docs, examples, scripts, README, LICENSE and package metadata. It should not include generated certs, `.basicAuth.env`, `node_modules`, caches or local temp files.

## Test the Tarball Locally

```bash
npm pack
mkdir -p /tmp/vite-firebase-local-gateway-test
cd /tmp/vite-firebase-local-gateway-test
npm init -y
npm install /path/to/vite-firebase-local-gateway-0.1.0.tgz
npx vite-firebase-local-gateway --help
```

For an end-to-end check, add a `gateway.config.js`, start a local Vite/Firebase project, then run:

```bash
npx vite-firebase-local-gateway start --local
```

## Publish

```bash
npm login
npm version patch
npm publish
```

Use `npm publish --access public` only if the package ever becomes scoped and needs explicit public access.
