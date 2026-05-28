export default {
  domains: [
    "finance-home.wads.dev",
    "layout-home.wads.dev",
    "firebase-home.wads.dev",
  ],

  routes: [
    {
      name: "finance",
      target: "http://web:3000",
      hostStartsWith: "finance",
    },
    {
      name: "layout",
      target: "http://prototype:8080",
      hostStartsWith: "layout",
    },
  ],

  // Optional: load extra plugins from the project
  plugins: ["./plugins/custom-plugin.js"],
};
