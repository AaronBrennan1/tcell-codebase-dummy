# This repo and the QMS

This repo (`tcell-codebase-dummy`) is the code repo of a two-repo QMS. Requirements, risks, change requests and
SOUP assessments live in the QMS repo, [`AaronBrennan1/tcellcare-qms`](https://github.com/AaronBrennan1/tcellcare-qms)
(its `MANUAL.md` is the full description). This page is what a developer here needs.

**The only new habit: tag each test with the IDs on the issue.**

## The flow

1. QA approves a change request in the QMS. qms-bot opens an issue here titled
   `SRS-FUN-052: <requirement>`, labelled `qms`, `SRS-FUN-052`, the CR ID and `class-B`.
   The body links the requirement and lists the risk controls that need a test.
2. Pick it up: `gh issue develop <n> --checkout --name SRS-FUN-052-short-name`. The branch
   name must start with the SRS ID.
3. Write the code. If the architecture changes, edit [`docs/design/`](design/) in the same
   branch, so the design cannot drift from the code.
4. Write tagged tests (below).
5. Open a PR titled `SRS-FUN-052: <summary>`. The template asks for the risk checklist and
   a one-line note on design changes.
6. Squash-merge once every check is green. The squash commit message is the PR title, so
   the SRS ID travels in the history.
7. After the merge, CI runs again on `main`, and `writeback.yml` opens a PR in the QMS that
   records the PR, merge commit and test run against the requirement. QA approving it is
   the definition of done: qms-bot then closes the issue. **Don't close `qms` issues by
   hand**: the guard reopens them.

## Tagging tests

IDs go in square brackets in the test name, or in an enclosing `describe`:

```js
test("[SRS-FUN-052][RISK-003] the page background is red", () => { ... });

describe("[SRS-ALM-142] alarm silence", () => {
  test("[RISK-017] resumes after two minutes", () => { ... });
});
```

A test file under `tests/<SRS ID>/` (e.g. `tests/SRS-FUN-052/unit/`) carries that SRS ID
without a tag. `scripts/qms-reporter.mjs` records every test with its IDs and result in
`test-results/coverage.json`; CI keeps it with `junit.xml` as the `test-results` artifact.
Run it locally with `npm run test:qms`.

| Folder | Holds | Run by |
|---|---|---|
| `test/` | unit tests of the app and of the scripts | `unit` |
| `tests/<SRS ID>/unit/` | unit tests of one requirement | `unit` |
| `tests/<SRS ID>/integration/`, `tests/<SRS ID>/system/` | integration and system tests | `integration` |

## Checks

All of these are required before merge:

| Check | Workflow | Passes when |
|---|---|---|
| `id-check` | `id-check.yml` | branch name and PR title carry the same SRS ID as an open `qms` issue |
| `unit` | `ci.yml` | unit tests pass |
| `integration` | `ci.yml` | integration and system tests pass (required: the software is class B) |
| `risk-coverage` | `ci.yml` | every RISK on the issue has at least one passing test tagged with it |
| `soup-check` | `soup-check.yml` | every production dependency has an accepted SOUP assessment |
| review | ruleset | approved by someone other than the author |

**soup-check.** Most PRs pass at once because no lock file changed. If `package-lock.json`
changed, the check builds an SBOM (`npm sbom`, production dependencies) and looks up each
package and version in the QMS's `soup/`. A package with no accepted assessment fails the
check, labels the PR `soup-review` and gets a comment. Add `soup/SOUP-NNN.md` in a QMS PR
(template `templates/SOUP.md`); once QA approves and it merges, re-run the check. The label
stays as the record.

## Releases

The release manager freezes `release/vX.Y.Z` from `main` and runs **release** (Actions →
release → Run workflow). It runs the full suite on the frozen commit, generates the final
SBOM, and runs the QMS trace gate. If the gate passes, it builds, signs (cosign), tags
`vX.Y.Z` and publishes the GitHub release, then hands over to the QMS for the release
record and QA sign-off. Only fixes with their own CR land on a release branch.

## Workflows

| Workflow | Does |
|---|---|
| `ci.yml` | `unit`, `integration`, `risk-coverage`; the `test-results` artifact |
| `id-check.yml` | `id-check` |
| `soup-check.yml` | `soup-check` |
| `writeback.yml` | write-back to the QMS after a merge; the issue-close guard |
| `release.yml` | the release (manual, `release` environment) |

Cross-repo work uses the qms-bot GitHub App (secrets `QMS_APP_ID`, `QMS_APP_KEY`); there
are no personal access tokens. Setup: the QMS repo's `SETUP.md`.
