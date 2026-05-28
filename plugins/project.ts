import { RouteTable } from "../commons.js";
import { ServiceRules } from "../proxy.js";

const isDocker = !process.argv.includes("--local");

export const serviceRules: ServiceRules = {
  layout: (host) => host.startsWith("layout"),
  finance: (host) => host.startsWith("finance"),
};

export const routeTable: RouteTable = {
  layout: `http://${isDocker ? "prototype" : "localhost"}:8080`,
  finance: `http://${isDocker ? "web" : "localhost"}:3000`,
};
