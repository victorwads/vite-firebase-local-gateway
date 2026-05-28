import { pathToFileURL } from "url";
import { fs, path } from "./commons.js";
import type { RouteTable } from "./commons.js";
import type { GatewayPlugin, Plugin, ServiceRules } from "./proxy.js";

export type RouteConfig = {
  name: string;
  target: string;
  hostStartsWith?: string | string[];
  pathStartsWith?: string | string[];
};

export type GatewayConfig = {
  domains?: string[];
  httpPort?: number;
  httpsPort?: number;
  certsDir?: string;
  certPath?: string;
  certKeyPath?: string;
  firebaseHost?: string;
  useBuiltinPlugins?: boolean;
  routeTable?: RouteTable;
  serviceRules?: ServiceRules;
  routes?: RouteConfig[];
  plugins?: Array<string | GatewayPlugin | Promise<GatewayPlugin>>;
};

const CONFIG_FILES = [
  "gateway.config.js",
  "gateway.config.mjs",
  "gateway.config.cjs",
];

export async function loadGatewayConfig(configPath?: string): Promise<GatewayConfig> {
  const resolved = resolveConfigPath(configPath);
  if (!resolved) return {};

  const imported = await import(pathToFileURL(resolved).href);
  const config = imported.default || imported.config || imported.gatewayConfig || {};
  console.log(`⚙️ Loaded gateway config from ${resolved}`);
  return config;
}

export async function loadConfigPlugins(config: GatewayConfig): Promise<Plugin[]> {
  const routePlugin = pluginFromConfig(config);
  const externalPlugins = await Promise.all(
    (config.plugins || []).map((plugin) => loadPlugin(plugin))
  );

  return [routePlugin, ...externalPlugins].filter(Boolean) as Plugin[];
}

function resolveConfigPath(configPath?: string): string | undefined {
  if (configPath) {
    const resolved = path.resolve(configPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Gateway config not found: ${resolved}`);
    }
    return resolved;
  }

  return CONFIG_FILES
    .map((file) => path.resolve(process.cwd(), file))
    .find((file) => fs.existsSync(file));
}

async function loadPlugin(
  plugin: string | GatewayPlugin | Promise<GatewayPlugin>
): Promise<GatewayPlugin> {
  if (typeof plugin !== "string") return Promise.resolve(plugin);

  const resolved = path.resolve(process.cwd(), plugin);
  const imported = await import(pathToFileURL(resolved).href);
  return imported.default || imported;
}

function pluginFromConfig(config: GatewayConfig): GatewayPlugin | undefined {
  const routeTable = { ...(config.routeTable || {}) };
  const serviceRules: ServiceRules = { ...(config.serviceRules || {}) };

  for (const route of config.routes || []) {
    routeTable[route.name] = route.target;
    serviceRules[route.name] = (domain, pathname) =>
      matchesPrefix(domain, route.hostStartsWith) ||
      matchesPrefix(pathname, route.pathStartsWith);
  }

  if (!Object.keys(routeTable).length && !Object.keys(serviceRules).length) {
    return undefined;
  }

  return { routeTable, serviceRules };
}

function matchesPrefix(value: string, prefixes?: string | string[]): boolean {
  if (!prefixes) return false;
  return [prefixes].flat().some((prefix) => value.startsWith(prefix));
}
