// Requirement and risk IDs on tests, shared by the reporter and the checks.
//
// A test carries IDs in square brackets in its name, or in the name of any
// enclosing describe(): test("[SRS-FUN-052][RISK-003] the page is red", ...).
// A test file under tests/<SRS ID>/ also carries that SRS ID.

export const SRS_ID = /SRS-[A-Z]{3}-\d{3}/g;
export const RISK_ID = /RISK-\d{3}/g;
const BRACKETS = /\[([^\]]+)\]/g;
const SRS_DIR = /(?:^|\/)tests\/(SRS-[A-Z]{3}-\d{3})\//;

function bracketed(text) {
  return [...String(text ?? "").matchAll(BRACKETS)].map((m) => m[1]).join(" ");
}

function unique(values) {
  return [...new Set(values)].sort();
}

// { srs: [...], risks: [...] } for a test, from its name, its ancestors' names and its file
export function idsFor(names, file = "") {
  const tags = names.map(bracketed).join(" ");
  const srs = [...tags.matchAll(SRS_ID)].map((m) => m[0]);
  const dir = file.match(SRS_DIR);
  if (dir) srs.push(dir[1]);
  return { srs: unique(srs), risks: unique([...tags.matchAll(RISK_ID)].map((m) => m[0])) };
}

// the SRS ID a PR title or branch name starts with, or null
export function leadingSrs(text) {
  const m = String(text ?? "").match(/^(SRS-[A-Z]{3}-\d{3})\b/);
  return m ? m[1] : null;
}

// RISK IDs in the risk checklist of a code issue written by qms-bot ("- [ ] RISK-003: ...")
export function checklistRisks(body) {
  const ids = [];
  for (const line of String(body ?? "").split("\n")) {
    const m = line.match(/^\s*[-*]\s+\[[ xX]\]\s+(RISK-\d{3})\b/);
    if (m) ids.push(m[1]);
  }
  return unique(ids);
}

// RISK IDs with no passing test tagged with them
export function uncoveredRisks(risks, coverage) {
  const passing = new Set(
    (coverage.tests ?? []).filter((t) => t.result === "pass").flatMap((t) => t.risks ?? []),
  );
  return risks.filter((r) => !passing.has(r));
}
