// The site's logic, kept free of I/O so it can be unit-tested.
import path from "node:path";

export const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

// the file under public/ a request path maps to, or null if it escapes public/
export function resolvePublic(root, urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const rel = clean === "/" ? "index.html" : clean.replace(/^\/+/, "");
  const full = path.resolve(root, rel);
  return full === root || full.startsWith(root + path.sep) ? full : null;
}

export function contentType(file) {
  return TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

export function health(version) {
  return { status: "ok", version };
}
