import { getCerts } from "./commons.js";
import { loadConfigPlugins, loadGatewayConfig } from "./config.js";
import { setFirebaseHost } from "./plugins/firebase.js";
import { ProxyManager } from "./proxy.js";

const defaultConfig = Promise.resolve({
  routeTable: {
    default: `http://192.168.0.0:3000`,
  },
  serviceRules: {},
});

export type StartGatewayOptions = Record<string, string | boolean | undefined>;

export async function startGateway(args: StartGatewayOptions = {}): Promise<void> {
  const isDocker = !args.local;
  const config = await loadGatewayConfig(args.config as string | undefined);
  const configPlugins = await loadConfigPlugins(config);

  setFirebaseHost(isDocker ? "firebase" : "localhost");
  if (config.firebaseHost) setFirebaseHost(config.firebaseHost);

  const envDomains = (process.env.PROXY_DOMAINS || "").trim();
  const envHttpPort = (process.env.PROXY_HTTP_PORT || "").trim();
  const envHttpsPort = (process.env.PROXY_HTTPS_PORT || "").trim();
  const envCertsDir = (process.env.PROXY_CERTS_DIR || "").trim();
  const envCertPath = (process.env.PROXY_CERT_PATH || "").trim();
  const envCertKeyPath = (process.env.PROXY_CERT_KEY_PATH || "").trim();

  const extraDomains = [
    ...(config.domains || []),
    ...envDomains.split(","),
    ...String(args.domains || "").split(","),
  ].filter(Boolean);

  const cert = await getCerts(
    extraDomains,
    (args.certsDir as string | undefined) || config.certsDir || envCertsDir || undefined,
    (args.certPath as string | undefined) || config.certPath || envCertPath || undefined,
    (args.certKeyPath as string | undefined) || config.certKeyPath || envCertKeyPath || undefined
  );

  const manager = new ProxyManager(
    defaultConfig,
    cert,
    configPlugins,
    config.useBuiltinPlugins !== false
  );
  const httpPort = Number(config.httpPort || args.httpPort || envHttpPort || 8080);
  const httpsPort = Number(config.httpsPort || args.httpsPort || envHttpsPort || 4433);
  await manager.addRedirect(httpPort, httpsPort);
  await manager.addMultiplexedProxy(httpsPort);
}

export { OverrideRules } from "./commons.js";
export type { CertResult, Domain, ProxyTarget, RouteTable } from "./commons.js";
export type { GatewayConfig, RouteConfig } from "./config.js";
export type { GatewayPlugin, Plugin, ServiceRules } from "./proxy.js";
