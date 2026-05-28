# Docker usage

The gateway is commonly used as a sidecar service in local development.

## Ports

Inside the container:

```txt
8080 -> HTTP redirect + healthcheck
4433 -> HTTPS proxy
```

On the host:

```yaml
ports:
  - "80:8080"
  - "443:4433"
```

## OpenSSL

The certificate verification code shells out to `openssl`, so Alpine images need it installed:

```yaml
command:
  - sh
  - -c
  - apk add --no-cache openssl && yarn install && yarn proxy
```

Without OpenSSL, existing certificate verification can fail and trigger unnecessary certificate regeneration.

## Healthcheck

```yaml
healthcheck:
  test: ["CMD-SHELL", "node -e \"require('http').get('http://127.0.0.1:8080/_proxy/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))\""]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 30s
```

Compose does not restart unhealthy containers by itself. Use `restart: always` for process exits and an autoheal sidecar if you want unhealthy containers restarted too.
