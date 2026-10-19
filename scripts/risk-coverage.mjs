// The risk-coverage check: every RISK on the PR's code issue has at least one
// passing test tagged with it.
//
//   GH_TOKEN=... GITHUB_REPOSITORY=org/repo PR_TITLE="SRS-FUN-052: ..." \
//     node scripts/risk-coverage.mjs test-results/coverage.json
// The issue is the open `qms` issue labelled with the SRS ID that starts the PR
// title; its risk checklist is written by qms-bot (tools/create_issue.py in the QMS).
import { readFile, appendFile } from "node:fs/promises";
import { checklistRisks, leadingSrs, uncoveredRisks } from "./qms-ids.mjs";

async function findIssue(repo, srs, token) {
  const url = `https://api.github.com/repos/${repo}/issues?state=open&labels=${encodeURIComponent(`qms,${srs}`)}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} listing issues: ${await res.text()}`);
  return (await res.json()).find((i) => !i.pull_request) ?? null;
}

async function summary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  console.log(lines.join("\n"));
}

async function main([coveragePath]) {
  const { GH_TOKEN, GITHUB_REPOSITORY, PR_TITLE } = process.env;
  const srs = leadingSrs(PR_TITLE);
  if (!srs) {
    await summary([`risk-coverage: the PR title does not start with an SRS ID ("SRS-XXX-NNN: ...")`]);
    process.exit(1);
  }
  const issue = await findIssue(GITHUB_REPOSITORY, srs, GH_TOKEN);
  if (!issue) {
    await summary([`risk-coverage: no open qms issue labelled ${srs}`]);
    process.exit(1);
  }
  const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
  const risks = checklistRisks(issue.body);
  const missing = uncoveredRisks(risks, coverage);
  const lines = [`### risk-coverage: ${srs} (#${issue.number})`, ""];
  if (!risks.length) lines.push("The issue lists no risk controls; nothing to cover.");
  for (const r of risks) {
    const tests = (coverage.tests ?? []).filter((t) => t.result === "pass" && t.risks?.includes(r));
    lines.push(missing.includes(r) ? `- ❌ ${r}: no passing test tagged [${r}]` : `- ✅ ${r}: ${tests.length} passing test(s)`);
  }
  await summary(lines);
  if (missing.length) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main(process.argv.slice(2));
}
