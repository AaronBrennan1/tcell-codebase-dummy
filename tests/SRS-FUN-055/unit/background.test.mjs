// SRS-FUN-055: the page background is baby blue, and the text on it stays legible.
// The folder tags these tests with SRS-FUN-055.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AA, contrast, hsl, stylesheet } from "../../helpers/color.mjs";

const { css, vars } = await stylesheet();

test("the page background is the --bg colour", () => {
  assert.match(css, /body\s*\{[^}]*background:\s*var\(--bg\)/);
});

test("--bg is baby blue", () => {
  const { h, s, l } = hsl(vars["--bg"]);
  assert.ok(h >= 190 && h <= 210, `hue ${h.toFixed(0)}° is not baby blue`);
  assert.ok(s >= 0.4, `saturation ${s.toFixed(2)} is too grey to read as baby blue`);
  assert.ok(l >= 0.65, `lightness ${l.toFixed(2)} is too dark for baby blue`);
});

test("[RISK-002] body text and the heading meet WCAG AA contrast on the background", () => {
  const bg = vars["--bg"];
  for (const v of ["--fg", "--accent"]) {
    const ratio = contrast(vars[v], bg);
    assert.ok(ratio >= AA, `${v} ${vars[v]} on ${bg} is ${ratio.toFixed(2)}:1, below ${AA}:1`);
  }
});
