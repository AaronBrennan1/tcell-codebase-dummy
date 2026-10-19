// SRS-FUN-049: the running site serves the yellow background.
// The folder tags these tests with SRS-FUN-049.
import { test } from "node:test";
import assert from "node:assert/strict";
import { useServer } from "../../helpers/server.mjs";
import { stylesheet } from "../../helpers/color.mjs";

const base = useServer();

test("the home page loads the stylesheet that sets the yellow background", async () => {
  const page = await (await fetch(base() + "/")).text();
  assert.match(page, /<link[^>]+href="styles\.css"/);

  const res = await fetch(base() + "/styles.css");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/css/);
  const { css, vars } = await stylesheet(await res.text());
  assert.equal(vars["--bg"], "#fff59d");
  assert.match(css, /body\s*\{[^}]*background:\s*var\(--bg\)/);
});
