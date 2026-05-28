# Plugin System

Vite Firebase Local Gateway loads built-in plugins from the package and can load external plugins from `gateway.config.js`.

The public plugin shape is intentionally small:

```ts
import type { GatewayPlugin } from "vite-firebase-local-gateway";

const plugin: GatewayPlugin = {
  serviceRules: {},
  routeTable: {},
  override: undefined,
};

export default plugin;
```

You can also export named `serviceRules`, `routeTable` and `override` values.

## Basic Route Plugin

```js
export const serviceRules = {
  docs: (domain) => domain.startsWith("docs"),
  admin: (domain) => domain.startsWith("admin"),
};

export const routeTable = {
  docs: "http://docs:3000",
  admin: "http://admin:3000",
};
```

With that plugin:

```txt
docs.local.test  -> http://docs:3000
admin.local.test -> http://admin:3000
```

## Path-Aware Rule

Rules receive `domain` and `pathname`:

```js
export const serviceRules = {
  firebaseTools: (domain, pathname) =>
    domain.startsWith("firebase") && pathname.startsWith("/tools"),
};

export const routeTable = {
  firebaseTools: "http://firebase:4000",
};
```

## Loading a Plugin

In `gateway.config.js`:

```js
export default {
  plugins: ["./examples/plugins/custom-plugin.js"],
};
```

Paths are resolved from the current working directory.

## Override Plugin

Overrides can inspect, change, block or directly respond to requests.

```ts
import { ClientRequest, IncomingMessage, ServerResponse } from "http";
import { OverrideRules } from "vite-firebase-local-gateway";

export const serviceRules = {};
export const routeTable = {};

class ExampleOverride extends OverrideRules {
  matches(_proxy: unknown, req: IncomingMessage): boolean {
    const host = req.headers.host || "";
    return host.startsWith("example");
  }

  onRequest(req: IncomingMessage, res: ServerResponse<IncomingMessage>): boolean {
    if (req.url === "/blocked") {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Blocked by plugin");
      return false;
    }

    return true;
  }

  onProxyReq(proxyReq: ClientRequest): void {
    proxyReq.setHeader("X-From-Gateway", "true");
  }

  onProxyRes(): void {}
}

export const override = new ExampleOverride();
```

## Basic Auth Plugin

The included Basic Auth plugin uses the same override mechanism and reads:

```env
PROXY_BASIC_AUTH_USER=local-user
PROXY_BASIC_AUTH_PASS=replace-with-a-local-secret
PROXY_BASIC_AUTH_REALM=Firebase Local Gateway
```

By default, it protects hosts that match:

```ts
domain.startsWith("firebase")
domain.startsWith("assistanthub")
```

If `PROXY_BASIC_AUTH_USER` or `PROXY_BASIC_AUTH_PASS` are missing or empty, the Basic Auth plugin is disabled (no-op).

The `0.1.0` plugin API is usable for external plugins, but it may still evolve while the package is early.
