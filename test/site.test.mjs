// Unit tests of the site logic (not tied to a requirement).
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { contentType, health, resolvePublic } from "../src/site.mjs";

const ROOT = path.resolve("/srv/public");

test("/ serves index.html", () => {
  assert.equal(resolvePublic(ROOT, "/"), path.join(ROOT, "index.html"));
  assert.equal(resolvePublic(ROOT, "/styles.css?v=2"), path.join(ROOT, "styles.css"));
});

test("paths cannot escape public/", () => {
  assert.equal(resolvePublic(ROOT, "/../server.mjs"), null);
  assert.equal(resolvePublic(ROOT, "/%2e%2e/package.json"), null);
});

test("content types", () => {
  assert.equal(contentType("a.html"), "text/html; charset=utf-8");
  assert.equal(contentType("a.CSS"), "text/css; charset=utf-8");
  assert.equal(contentType("a.bin"), "application/octet-stream");
});

test("health reports the version", () => {
  assert.deepEqual(health("0.1.0"), { status: "ok", version: "0.1.0" });
});
