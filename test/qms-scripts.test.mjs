// Tests for the QMS scripts: ID tagging, the reporter, merging and risk coverage.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checklistRisks, idsFor, leadingSrs, uncoveredRisks } from "../scripts/qms-ids.mjs";
import { mergeCoverage, mergeJunit } from "../scripts/merge-test-results.mjs";
import qmsReporter from "../scripts/qms-reporter.mjs";

test("IDs come from bracketed tags in the test and its describes", () => {
  assert.deepEqual(idsFor(["alarm", "[SRS-ALM-142][RISK-017] resumes after two minutes"]), {
    srs: ["SRS-ALM-142"],
    risks: ["RISK-017"],
  });
  assert.deepEqual(idsFor(["[SRS-ALM-142]", "[RISK-022, RISK-017] silences"]), {
    srs: ["SRS-ALM-142"],
    risks: ["RISK-017", "RISK-022"],
  });
});

test("an ID outside brackets is prose, not a tag", () => {
  assert.deepEqual(idsFor(["mentions SRS-ALM-142 in passing"]), { srs: [], risks: [] });
});

test("a test under tests/<SRS ID>/ carries that ID", () => {
  assert.deepEqual(idsFor(["is red"], "tests/SRS-FUN-052/unit/red.test.mjs").srs, ["SRS-FUN-052"]);
  assert.deepEqual(idsFor(["is red"], "test/server.test.mjs").srs, []);
});

test("the SRS ID must lead the title or branch", () => {
  assert.equal(leadingSrs("SRS-FUN-052: make it red"), "SRS-FUN-052");
  assert.equal(leadingSrs("SRS-FUN-052-red-background"), "SRS-FUN-052");
  assert.equal(leadingSrs("fix: SRS-FUN-052"), null);
});

test("the risk checklist is read from the issue body", () => {
  const body = "### Risk controls\n\n- [ ] RISK-017: [Alarm](x)\n- [x] RISK-022: done\nRISK-099 in prose\n";
  assert.deepEqual(checklistRisks(body), ["RISK-017", "RISK-022"]);
});

test("a risk is covered only by a passing tagged test", () => {
  const coverage = {
    tests: [
      { risks: ["RISK-017"], result: "pass" },
      { risks: ["RISK-022"], result: "fail" },
    ],
  };
  assert.deepEqual(uncoveredRisks(["RISK-017", "RISK-022", "RISK-030"], coverage), ["RISK-022", "RISK-030"]);
});

test("the reporter records leaf tests with their IDs and results", async () => {
  async function* events() {
    const file = process.cwd() + "/tests/SRS-FUN-052/unit/x.test.mjs";
    yield { type: "test:start", data: { file, nesting: 0, name: "[RISK-003] suite" } };
    yield { type: "test:start", data: { file, nesting: 1, name: "passes" } };
    yield { type: "test:pass", data: { file, nesting: 1, name: "passes", details: { type: "test", duration_ms: 2 } } };
    yield { type: "test:start", data: { file, nesting: 1, name: "fails" } };
    yield {
      type: "test:fail",
      data: { file, nesting: 1, name: "fails", details: { type: "test", error: new Error("boom") } },
    };
    yield { type: "test:fail", data: { file, nesting: 0, name: "[RISK-003] suite", details: { type: "suite" } } };
  }
  let out = "";
  for await (const chunk of qmsReporter(events())) out += chunk;
  const report = JSON.parse(out);
  assert.deepEqual(report.summary, { pass: 1, fail: 1, skip: 0 });
  assert.deepEqual(
    report.tests.map((t) => [t.name, t.srs, t.risks, t.result]),
    [
      ["passes", ["SRS-FUN-052"], ["RISK-003"], "pass"],
      ["fails", ["SRS-FUN-052"], ["RISK-003"], "fail"],
    ],
  );
  assert.equal(report.tests[1].error, "boom");
});

test("partial results merge into one report", () => {
  const merged = mergeCoverage([
    { commit: "abc", tests: [{ result: "pass" }] },
    { commit: "abc", tests: [{ result: "skip" }, { result: "fail" }] },
  ]);
  assert.deepEqual(merged.summary, { pass: 1, fail: 1, skip: 1 });
  const xml = mergeJunit([
    '<?xml version="1.0" encoding="utf-8"?>\n<testsuites>\n<testcase name="a"/>\n</testsuites>\n',
    "<testsuites><testcase name=\"b\"/></testsuites>",
  ]);
  assert.match(xml, /<testsuites>\n<testcase name="a"\/>\n<testcase name="b"\/>\n<\/testsuites>/);
});
