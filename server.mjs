// A minimal static site with a health endpoint. No dependencies.
//   npm start   -> http://localhost:8787
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { contentType, health, resolvePublic } from "./src/site.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const { version } = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));

export const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }
  if (req.url === "/api/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(health(version)));
    return;
  }
  const file = resolvePublic(PUBLIC, req.url);
  if (!file) {
    res.writeHead(400).end("bad path");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": contentType(file) });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8787);
  server.listen(port, () => console.log(`http://localhost:${port}`));
}
