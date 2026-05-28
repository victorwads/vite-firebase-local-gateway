#!/usr/bin/env node
import { parseArgs } from "./process.js";

const args = parseArgs();
const { startGateway } = await import("./index.js");

startGateway(args).catch((error) => {
  console.error(error);
  process.exit(1);
});
