// SRS-FUN-056: the page background is transparent, and the text on it stays legible.
// The folder tags these tests with SRS-FUN-056.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AA, contrast, stylesheet } from "../../helpers/color.mjs";

const { css, vars } = await stylesheet();

test("the page background is the --bg colour", () => {
  assert.match(css, /body\s*\{[^}]*background:\s*var\(--bg\)/);
});

test("--bg is transparent", () => {
  assert.equal(vars["--bg"], "transparent");
});

test("[RISK-004] body text and the heading meet WCAG AA contrast on the background", () => {
  const bg = "#ffffff"; // a transparent page shows the browser canvas, white by default
  for (const v of ["--fg", "--accent"]) {
    const ratio = contrast(vars[v], bg);
    assert.ok(ratio >= AA, `${v} ${vars[v]} on ${bg} is ${ratio.toFixed(2)}:1, below ${AA}:1`);
  }
});
