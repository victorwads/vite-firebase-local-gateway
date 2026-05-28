export function logProccessHelp(): void {
  console.log(`
  Usage: vite-firebase-local-gateway [start] [options]
  Options:
    --config <path>               Gateway config file (default: ./gateway.config.js)
    --local                       Route built-in Firebase/project services to localhost
    --httpPort <port>             HTTP redirect port (default: 8080)
    --httpsPort <port>            HTTPS proxy port (default: 4433)
    --certsDir <path>             Directory for certificates (default: ./certs)
    --certPath <path>             Path to the certificate file (default: ./certs/localhost.pem)
    --certKeyPath <path>          Path to the key file (default: ./certs/localhost-key.pem)
    --domains <domains>           Comma-separated list of extra domains
  
  Configs:
    - certs/.domains: (Comma|Line)-separated list of extra domains

  Env vars (optional):
    PROXY_DOMAINS                 Comma-separated list of extra domains
    PROXY_HTTP_PORT               HTTP redirect port
    PROXY_HTTPS_PORT              HTTPS proxy port
    PROXY_CERTS_DIR               Directory for generated certificates
    PROXY_CERT_PATH               Custom cert path (must be paired with PROXY_CERT_KEY_PATH)
    PROXY_CERT_KEY_PATH           Custom key path (must be paired with PROXY_CERT_PATH)
  `);

  process.exit(0);
}

export function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  if (args[0] === "start") args.shift();

  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") {
      logProccessHelp();
    } else if (args[i] === "--version" || args[i] === "-v") {
      console.log("vite-firebase-local-gateway 0.1.0");
      process.exit(0);
    }
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      if (key === "local") {
        result[key] = "true";
        continue;
      }
      const value = args[i + 1];
      result[key] = value;
      i++;
    }
  }
  return result;
}

const shutdownHandler = (): void => {
  import("./proxy.js")
    .then(({ ProxyManager }) => {
      console.log("\n Request per domain:", ProxyManager.requestPerDomain);
    })
    .finally(() => {
      console.log("\n🔻 Gracefully shutting down...");
      process.exit(0);
    });
};

process.on("SIGINT", shutdownHandler);
process.on("SIGTERM", shutdownHandler);
