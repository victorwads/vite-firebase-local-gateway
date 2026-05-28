# Vite Firebase Local Gateway

Local HTTPS gateway and CLI for Vite apps, Firebase Emulator and other local services.

This tool is for local development only. It is not a production reverse proxy.

## Why It Exists

Vite + Firebase Emulator projects often turn into localhost juggling:

```txt
localhost:5173  -> Vite
localhost:4000  -> Firebase Emulator UI
localhost:8080  -> Firestore Emulator
localhost:9099  -> Auth Emulator
localhost:5001  -> Functions Emulator
```

That makes cookies, redirects, CORS, OAuth callbacks, service workers and SDK config behave differently from production. This gateway gives each local service a normal HTTPS host while still routing everything to containers or processes on your machine.

```txt
https://app.local.test      -> Vite app
https://firebase.local.test -> Firebase Emulator UI and APIs
https://api.local.test      -> local HTTP service
```

## Features

- HTTPS local reverse proxy
- HTTP to HTTPS redirect
- Host and path based routing
- Vite app, Firebase Emulator and generic HTTP app routing
- Firebase Emulator UI config rewriting
- WebSocket proxying
- Dynamic local certificates through `mkcert`
- Basic Auth as a plugin
- External config and plugin loading
- Docker Compose friendly
- Health endpoint at `/__health` and legacy `/_proxy/health`

## Install

Run directly:

```bash
npx vite-firebase-local-gateway
```

or:

```bash
npx vite-firebase-local-gateway start
```

Install in a project:

```bash
npm install --save-dev vite-firebase-local-gateway
```

Then add:

```json
{
  "scripts": {
    "gateway": "vite-firebase-local-gateway start"
  }
}
```

## Quick Start

Create `gateway.config.js`:

```js
/** @type {import("vite-firebase-local-gateway").GatewayConfig} */
export default {
  domains: ["app.local.test", "firebase.local.test", "api.local.test"],
  routes: [
    {
      name: "viteApp",
      target: "http://localhost:5173",
      hostStartsWith: "app",
    },
    {
      name: "api",
      target: "http://localhost:8080",
      hostStartsWith: "api",
    },
  ],
};
```

Start the gateway:

```bash
npx vite-firebase-local-gateway start --local
```

Defaults:

```txt
HTTP redirect: http://localhost:8080
HTTPS proxy:   https://localhost:4433
Healthcheck:   http://localhost:8080/__health
```

When using host ports `80` and `443` in Docker, browse to the domain directly:

```txt
https://app.local.test
https://firebase.local.test
```

## Config

The CLI looks for `gateway.config.js`, `gateway.config.mjs` or `gateway.config.cjs` in the current working directory. You can also pass a path:

```bash
npx vite-firebase-local-gateway start --config ./config/gateway.config.js
```

See [gateway.config.example.js](gateway.config.example.js) and [gateway.config.example.ts](gateway.config.example.ts).
For a Docker-oriented example, see [examples/gateway.config.js](examples/gateway.config.js) and [examples/docker-compose.basic-auth.yml](examples/docker-compose.basic-auth.yml).

The config can map services without editing package internals:

```js
export default {
  routes: [
    { name: "viteApp", target: "http://web:3000", hostStartsWith: "app" },
    { name: "api", target: "http://api:8080", hostStartsWith: "api" },
    { name: "admin", target: "http://admin:3000", hostStartsWith: "admin" },
  ],
};
```

The built-in Firebase plugin reads `firebase.json` and maps emulator services. In Docker, it assumes the Firebase service host is `firebase`; with `--local`, it uses `localhost`. You can override that:

```js
export default {
  firebaseHost: "firebase",
};
```

## Basic Auth

Basic Auth is implemented as a plugin and reads credentials from environment variables:

```env
PROXY_BASIC_AUTH_USER=local-user
PROXY_BASIC_AUTH_PASS=replace-with-a-local-secret
PROXY_BASIC_AUTH_REALM=Firebase Local Gateway
```

Copy the example:

```bash
cp .basicAuth.env.example .basicAuth.env
```

Do not commit `.basicAuth.env`.

In Docker Compose:

```yaml
services:
  gateway:
    environment:
      PROXY_BASIC_AUTH_USER: "local-user"
      PROXY_BASIC_AUTH_PASS: "replace-with-a-local-secret"
```

By default, the plugin protects hosts where `domain.startsWith("firebase")` or `domain.startsWith("assistanthub")`.
If `PROXY_BASIC_AUTH_USER` or `PROXY_BASIC_AUTH_PASS` are missing or empty, the Basic Auth plugin is disabled (no-op).

## Plugins

Plugins export route rules and optional override hooks:

```js
export const serviceRules = {
  reports: (domain) => domain.startsWith("reports"),
};

export const routeTable = {
  reports: "http://reports:3000",
};
```

Load an external plugin from config:

```js
export default {
  plugins: ["./examples/plugins/custom-plugin.js"],
};
```

See [docs/PLUGINS.md](docs/PLUGINS.md) and [examples/plugins/custom-plugin.js](examples/plugins/custom-plugin.js).

TypeScript users can import useful types:

```ts
import type { GatewayConfig, GatewayPlugin, ServiceRules, RouteTable } from "vite-firebase-local-gateway";
```

The config and plugin APIs are intentionally small in `0.1.0` and may change while the package is still early.

## Docker

See [examples/docker-compose.basic-auth.yml](examples/docker-compose.basic-auth.yml).

The gateway does not require installing `openssl` in the container.

Typical port mapping:

```yaml
ports:
  - "80:8080"
  - "443:4433"
```

The gateway exposes `/__health` (and legacy `/_proxy/health`) if you want to add healthchecks in your own Compose.

Using a versionable config file in Docker is recommended:

```yaml
volumes:
  - ./gateway.config.js:/workspace/gateway.config.js:ro
command: npx --yes vite-firebase-local-gateway start --config /workspace/gateway.config.js
```

## Local Certificate Trust

The gateway generates a local CA and certificates under `certs/`. Generated certificates are ignored by git and should not be published.

Start the gateway once so it creates `certs/rootCA.pem`, then trust the CA.

macOS:

```bash
npm run trust:macos
```

Debian/Ubuntu and Fedora/RHEL:

```bash
npm run trust:linux
```

You can also pass a custom CA path:

```bash
bash scripts/trust-cert-macos.sh ./certs/rootCA.pem
bash scripts/trust-cert-linux.sh ./certs/rootCA.pem
```

Restart browsers that were already open.

## Troubleshooting

- `firebase.json not found`: run from a directory that contains `firebase.json`, mount it into the Docker working directory, or pass a config that disables built-in plugins with `useBuiltinPlugins: false`.
- Browser certificate warning: start the gateway once, run the trust script for your OS, then restart the browser.
- Basic Auth always rejects: check `PROXY_BASIC_AUTH_USER` and `PROXY_BASIC_AUTH_PASS` in `.basicAuth.env`.
- Host routes to the wrong service: route matching uses the first matching `serviceRules` entry after plugins are merged; make route names unique.
- Docker health is unhealthy: verify `http://127.0.0.1:8080/__health` from inside the gateway container.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run proxy -- --local
```

## Publishing

See [docs/publishing.md](docs/publishing.md).

Short version:

```bash
npm run typecheck
npm run build
npm pack --dry-run
npm login
npm version patch
npm publish
```
