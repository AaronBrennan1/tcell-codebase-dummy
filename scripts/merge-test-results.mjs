// Merge the per-job partial results into test-results/coverage.json and junit.xml.
//
//   node scripts/merge-test-results.mjs <out dir> <partial dir>...
// Each partial dir holds coverage*.json and junit*.xml files from one CI job.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { summarize } from "./qms-reporter.mjs";

export function mergeCoverage(reports) {
  const tests = reports.flatMap((r) => r.tests ?? []);
  return { commit: reports.find((r) => r.commit)?.commit ?? null, summary: summarize(tests), tests };
}

export function mergeJunit(docs) {
  const inner = docs.map((d) =>
    d.replace(/^<\?xml[^>]*\?>\s*/, "").replace(/^\s*<testsuites[^>]*>/, "").replace(/<\/testsuites>\s*$/, ""),
  );
  return `<?xml version="1.0" encoding="utf-8"?>\n<testsuites>\n${inner.map((s) => s.trim()).filter(Boolean).join("\n")}\n</testsuites>\n`;
}

async function main([out, ...dirs]) {
  const coverage = [];
  const junit = [];
  for (const dir of dirs) {
    for (const name of (await readdir(dir)).sort()) {
      const text = await readFile(path.join(dir, name), "utf8");
      if (/^coverage.*\.json$/.test(name)) coverage.push(JSON.parse(text));
      if (/^junit.*\.xml$/.test(name)) junit.push(text);
    }
  }
  await mkdir(out, { recursive: true });
  const merged = mergeCoverage(coverage);
  await writeFile(path.join(out, "coverage.json"), JSON.stringify(merged, null, 2) + "\n");
  await writeFile(path.join(out, "junit.xml"), mergeJunit(junit));
  const s = merged.summary;
  console.log(`${merged.tests.length} tests: ${s.pass} passed, ${s.fail} failed, ${s.skip} skipped`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main(process.argv.slice(2));
}
