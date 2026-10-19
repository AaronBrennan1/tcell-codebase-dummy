// SRS-FUN-049: the page background is yellow, and the text on it stays legible.
// The folder tags these tests with SRS-FUN-049.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AA, contrast, hsl, stylesheet } from "../../helpers/color.mjs";

const { css, vars } = await stylesheet();

test("the page background is the --bg colour", () => {
  assert.match(css, /body\s*\{[^}]*background:\s*var\(--bg\)/);
});

test("--bg is yellow", () => {
  const { h, s, l } = hsl(vars["--bg"]);
  assert.ok(h >= 45 && h <= 65, `hue ${h.toFixed(0)}° is not yellow`);
  assert.ok(s >= 0.5, `saturation ${s.toFixed(2)} is too grey to read as yellow`);
  assert.ok(l >= 0.5, `lightness ${l.toFixed(2)} is too dark for a page background`);
});

test("body text and the heading meet WCAG AA contrast on the background", () => {
  const bg = vars["--bg"];
  for (const v of ["--fg", "--accent"]) {
    const ratio = contrast(vars[v], bg);
    assert.ok(ratio >= AA, `${v} ${vars[v]} on ${bg} is ${ratio.toFixed(2)}:1, below ${AA}:1`);
  }
});
