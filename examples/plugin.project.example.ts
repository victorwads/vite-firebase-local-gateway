import { RouteTable } from "../commons";
import { ServiceRules } from "../proxy";

const isDocker = !process.argv.includes("--local");

export const serviceRules: ServiceRules = {
  admin: (host) => host.startsWith("admin"),
  docs: (host) => host.startsWith("docs"),
  api: (host, pathname) => host.startsWith("api") || pathname.startsWith("/api"),
};

export const routeTable: RouteTable = {
  admin: `http://${isDocker ? "admin" : "localhost"}:3000`,
  docs: `http://${isDocker ? "docs" : "localhost"}:3001`,
  api: `http://${isDocker ? "api" : "localhost"}:8080`,
};
