import { __dirname, fs, path } from "../commons.js";

const pluginsDir = path.join(__dirname, "plugins");
const files = fs
  .readdirSync(pluginsDir)
  .filter((file) => !file.startsWith("index."))
  .filter((file) => !file.endsWith(".d.ts"))
  .filter((file) => [".js", ".ts", ".mjs"].includes(path.extname(file)));

const plugins = await Promise.all(
  files.map((file) => import(path.join(pluginsDir, file)))
);

export default plugins;
