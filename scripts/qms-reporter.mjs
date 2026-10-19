// node:test reporter that writes coverage.json: every test with the SRS and RISK
// IDs it carries (scripts/qms-ids.mjs) and its result. CI keeps it, with junit.xml,
// as the `test-results` artifact that the QMS write-back and trace read.
//
//   node --test --test-reporter=./scripts/qms-reporter.mjs --test-reporter-destination=coverage.json
//
// { commit, summary: { pass, fail, skip }, tests: [{ id, file, name, srs, risks, result, duration_ms, error }] }
import { realpathSync } from "node:fs";
import path from "node:path";
import { idsFor } from "./qms-ids.mjs";

const ERROR_LEN = 500;
const ROOT = realpathSync.native(process.cwd());

function relative(file) {
  if (!file) return "";
  try {
    return path.relative(ROOT, realpathSync.native(file)).split(path.sep).join("/");
  } catch {
    return String(file);
  }
}

function errorText(error) {
  if (!error) return null;
  const cause = error.cause ?? error;
  return String(cause.message ?? cause).slice(0, ERROR_LEN);
}

export function summarize(tests) {
  const summary = { pass: 0, fail: 0, skip: 0 };
  for (const t of tests) summary[t.result] += 1;
  return summary;
}

export default async function* qmsReporter(source) {
  const stacks = new Map(); // file -> names of the tests currently open, by nesting
  const tests = [];
  for await (const { type, data } of source) {
    const file = relative(data.file);
    if (type === "test:start") {
      const stack = stacks.get(file) ?? [];
      stack.length = data.nesting;
      stack[data.nesting] = data.name;
      stacks.set(file, stack);
      continue;
    }
    if (type !== "test:pass" && type !== "test:fail") continue;
    if (data.details?.type === "suite") continue; // a describe(): its tests are recorded
    const ancestors = (stacks.get(file) ?? []).slice(0, data.nesting);
    const result = type === "test:fail" ? "fail" : data.skip || data.todo ? "skip" : "pass";
    const { srs, risks } = idsFor([...ancestors, data.name], file);
    tests.push({
      id: [file, ...ancestors, data.name].filter(Boolean).join(" > "),
      file,
      name: data.name,
      srs,
      risks,
      result,
      duration_ms: Math.round(data.details?.duration_ms ?? 0),
      error: result === "fail" ? errorText(data.details?.error) : null,
    });
  }
  const report = { commit: process.env.GITHUB_SHA ?? null, summary: summarize(tests), tests };
  yield JSON.stringify(report, null, 2) + "\n";
}
