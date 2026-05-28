/** @type {import("vite-firebase-local-gateway").GatewayConfig} */
export default {
  domains: [
    "app.local.test",
    "firebase.local.test",
    "api.local.test",
    "admin.local.test",
  ],

  routes: [
    {
      name: "viteApp",
      target: "http://web:3000",
      hostStartsWith: "app",
    },
    {
      name: "httpApi",
      target: "http://api:8080",
      hostStartsWith: "api",
    },
    {
      name: "admin",
      target: "http://admin:3000",
      hostStartsWith: "admin",
    },
  ],

  plugins: [
    "./examples/plugins/custom-plugin.js",
  ],
};
