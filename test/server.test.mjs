// The running site: pages, health and errors (not tied to a requirement).
import { test } from "node:test";
import assert from "node:assert/strict";
import { useServer } from "../tests/helpers/server.mjs";

const base = useServer();

test("the home page is served", async () => {
  const res = await fetch(base() + "/");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  assert.match(await res.text(), /<link[^>]+styles\.css/);
});

test("the health endpoint answers", async () => {
  const res = await fetch(base() + "/api/health");
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
});

test("unknown files are 404 and other methods 405", async () => {
  assert.equal((await fetch(base() + "/nope.html")).status, 404);
  assert.equal((await fetch(base() + "/", { method: "POST" })).status, 405);
});
