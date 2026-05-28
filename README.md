# Firebase Local Gateway

A local HTTPS gateway for Firebase Emulator + Vite projects.

It gives local developers a production-like HTTPS domain while everything stays on the developer machine or inside Docker:

```txt
https://finance.local.wads.dev
        ↓
Firebase Local Gateway
        ↓
Vite / Firebase Emulator / local services
```

The project is intentionally pragmatic: it is a programmable local reverse proxy with dynamic certificates, host-based routing, Firebase-specific compatibility hacks, and a plugin system.

## Why this exists

Local Firebase/Vite development often becomes a mess of ports and origins:

```txt
localhost:5173  -> Vite
localhost:4000  -> Firebase Emulator UI
localhost:8080  -> Firestore Emulator
localhost:9099  -> Auth Emulator
localhost:5001  -> Functions Emulator
```

That breaks or complicates cookies, redirects, auth flows, CORS, OAuth callback URLs, service workers and SDK configuration.

Firebase Local Gateway lets you simulate a more realistic environment:

```txt
https://finance-home.wads.dev
https://layout-home.wads.dev
https://firebase-home.wads.dev
```

while still routing everything to local containers/services.

## Features

- Local trusted HTTPS gateway
- HTTP → HTTPS redirect
- Hostname-based routing
- Firebase Emulator compatibility layer
- Firebase UI / config interception support
- Dynamic local certificate regeneration when a new domain appears
- Plugin system: any file added to `plugins/` is loaded automatically
- Basic Auth plugin for sensitive local dashboards
- WebSocket proxying
- Docker Compose friendly
- Health endpoint at `/_proxy/health`

## Quick start

Install dependencies:

```bash
npm install
```

Start the proxy:

```bash
npm run proxy
```

By default, the gateway starts:

```txt
HTTP redirect: http://localhost:8080
HTTPS proxy:   https://localhost:4433
Healthcheck:   http://localhost:8080/_proxy/health
```

When running through Docker Compose, map host ports like this:

```yaml
ports:
  - "80:8080"
  - "443:4433"
```

Then access your local domains through normal HTTPS:

```txt
https://finance-home.wads.dev
https://firebase-home.wads.dev
```

## Docker Compose example

See [`examples/docker-compose.basic-auth.yml`](examples/docker-compose.basic-auth.yml).

Minimal service:

```yaml
services:
  proxy:
    restart: always
    image: node:24-alpine
    working_dir: /app
    volumes:
      - proxy_temp:/app/node_modules
      - proxy_temp:/tmp
      - proxy_temp:/usr/local/share/.cache
      - ./firebase.json:/firebase.json:ro
      - ./Web/proxy:/app
    ports:
      - "443:4433"
      - "80:8080"
    command:
      - sh
      - -c
      - apk add --no-cache openssl && yarn install && yarn proxy
    env_file:
      - ./.basicAuth.env
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('http').get('http://127.0.0.1:8080/_proxy/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))\""]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s

volumes:
  proxy_temp:
```

> Note: Docker Compose healthchecks mark a container as unhealthy, but Compose does not automatically restart unhealthy containers. `restart: always` restarts the process if it exits. If you want unhealthy containers to be restarted too, use an autoheal container or equivalent orchestration.

## Basic Auth

The included `plugins/basicAuth.ts` protects sensitive hosts using HTTP Basic Auth.

Create `.basicAuth.env`:

```env
PROXY_BASIC_AUTH_USER=victorwads
PROXY_BASIC_AUTH_PASS=change-me
PROXY_BASIC_AUTH_REALM=Firebase Local Gateway
```

By default, the plugin protects hosts where:

```ts
domain.startsWith("firebase")
domain.startsWith("assistanthub")
```

So these will ask for browser `user:pass` auth:

```txt
firebase-home.wads.dev
assistanthub-home.wads.dev
```

while public/local frontend hosts like these can remain open:

```txt
finance-home.wads.dev
layout-home.wads.dev
```

Test:

```bash
curl -I https://firebase-home.wads.dev
curl -u victorwads:change-me -I https://firebase-home.wads.dev
```

## Routing projects

Routing lives in plugins. Example from `plugins/project.ts`:

```ts
export const serviceRules = {
  layout: (host) => host.startsWith("layout"),
  finance: (host) => host.startsWith("finance"),
};

export const routeTable = {
  layout: "http://prototype:8080",
  finance: "http://web:3000",
};
```

Requests are matched by hostname, then forwarded to the configured target.

## Plugins

Any file added to `plugins/` is loaded dynamically by `plugins/index.ts`.

A plugin can export:

```ts
export const serviceRules = {};
export const routeTable = {};
export const override = undefined;
```

See [`docs/PLUGINS.md`](docs/PLUGINS.md) for examples.

## Local certificate trust

The gateway generates a local CA and certificates under `certs/`.

To trust the generated CA locally:

macOS:

```bash
npm run trust:macos
```

Linux:

```bash
npm run trust:linux
```

The scripts expect the generated CA at:

```txt
certs/rootCA.pem
```

Start the proxy once before running the trust script so the CA exists.

## Cloudflare Tunnel usage

This project can sit behind Cloudflare Tunnel if you want to expose selected local services privately/publicly.

Example `cloudflared` ingress:

```yaml
ingress:
  - hostname: finance-home.wads.dev
    service: https://localhost:443
    originRequest:
      noTLSVerify: true

  - hostname: firebase-home.wads.dev
    service: https://localhost:443
    originRequest:
      noTLSVerify: true

  - service: http_status:404
```

Cloudflare handles public TLS. The gateway handles local HTTPS and routing.

## Development status

This is an early, developer-focused tool. It is useful today, but still needs productization before being a polished npm package.

Good next steps:

- CLI commands like `init`, `start`, `trust`
- Better config file support
- Hot certificate reload with SNI instead of server restart
- More examples for Firebase Emulator Suite
- Tests for plugins and routing
# vite-firebase-local-gateway
