# Plugin system

Firebase Local Gateway loads every file inside `plugins/` dynamically.

The loader ignores only `index.*`:

```ts
const files = fs.readdirSync(pluginsDir).filter(f => !f.startsWith('index.'));
const plugins = await Promise.all(files.map(file => import(path.join(pluginsDir, file))));
```

That means adding a new file like this is enough:

```txt
plugins/admin.ts
plugins/rateLimit.ts
plugins/myProject.ts
```

## Basic route plugin

```ts
import { RouteTable } from "../commons";
import { ServiceRules } from "../proxy";

export const serviceRules: ServiceRules = {
  docs: (domain) => domain.startsWith("docs"),
  admin: (domain) => domain.startsWith("admin"),
};

export const routeTable: RouteTable = {
  docs: "http://docs:3000",
  admin: "http://admin:3000",
};
```

With that plugin:

```txt
docs-home.wads.dev  -> http://docs:3000
admin-home.wads.dev -> http://admin:3000
```

## Path-aware rule

Rules receive `domain` and `pathname`:

```ts
export const serviceRules = {
  firebaseApi: (domain, pathname) =>
    domain.startsWith("firebase") && pathname.startsWith("/api"),
};

export const routeTable = {
  firebaseApi: "http://firebase:4000",
};
```

## Override plugin

Overrides are hooks that can inspect, change, block or respond to requests.

```ts
import { ClientRequest, IncomingMessage, ServerResponse } from "http";
import { OverrideRules } from "../commons";

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

## Basic Auth plugin

The included `plugins/basicAuth.ts` uses the same override mechanism.

To protect another group of hosts, edit:

```ts
const protectedHostsRules: Array<(domain: string) => boolean> = [
  (domain) => domain.startsWith("firebase"),
  (domain) => domain.startsWith("assistanthub"),
  (domain) => domain.startsWith("admin"),
];
```

The important part is that this follows the same style as routing:

```ts
domain.startsWith("...")
```
