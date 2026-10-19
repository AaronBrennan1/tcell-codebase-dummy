// SRS-FUN-050: the running site serves the blue background.
// The folder tags these tests with SRS-FUN-050.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useServer } from "../../helpers/server.mjs";
import { stylesheet } from "../../helpers/color.mjs";

const base = useServer();

test("the home page loads the stylesheet that sets the blue background", async () => {
  const page = await (await fetch(base() + "/")).text();
  assert.match(page, /<link[^>]+href="styles\.css"/);

  const res = await fetch(base() + "/styles.css");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/css/);
  const { css, vars } = await stylesheet(await res.text());
  assert.equal(vars["--bg"], "#1e4fa3");
  assert.match(css, /body\s*\{[^}]*background:\s*var\(--bg\)/);
});
