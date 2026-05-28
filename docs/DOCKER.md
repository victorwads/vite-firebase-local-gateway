# Docker Usage

The gateway is commonly used as a sidecar service in local development.

## Ports

Inside the container:

```txt
8080 -> HTTP redirect and healthcheck
4433 -> HTTPS proxy
```

On the host:

```yaml
ports:
  - "80:8080"
  - "443:4433"
```

## Example

See [../examples/docker-compose.basic-auth.yml](../examples/docker-compose.basic-auth.yml).

The example includes:

- gateway service
- versionable `gateway.config.js` mounted into the container
- Basic Auth via `environment` (disabled when empty)

The gateway does not require installing `openssl` in the container.

## Health

The gateway exposes `/__health` (and legacy `/_proxy/health`) on the HTTP port if you want to add healthchecks in your own Compose.
