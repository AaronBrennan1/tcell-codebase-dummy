# tcell-codebase-dummy

A minimal T Cell Care demo site, and the **code repo** of the two-repo QMS
([`AaronBrennan1/tcellcare-qms`](https://github.com/AaronBrennan1/tcellcare-qms)).

```bash
npm start      # http://localhost:8787  (no dependencies; Node 22+)
npm test       # every test
npm run test:qms   # also writes test-results/coverage.json with the SRS/RISK tags
```

| Path | What |
|---|---|
| `server.mjs`, `src/site.mjs`, `public/` | the site: a static page and `GET /api/health` |
| `test/` | unit tests of the site and of the QMS scripts |
| `tests/<SRS ID>/{unit,integration,system}/` | tests of one requirement (tagged with it automatically) |
| `scripts/qms-*.mjs`, `scripts/merge-test-results.mjs`, `scripts/risk-coverage.mjs` | test tagging, coverage.json, the risk-coverage check |
| `.github/workflows/` | `ci`, `id-check`, `soup-check`, `writeback`, `release` |
| `docs/design/` | design notes, changed in the same PR as the code |

## Working on a requirement

Work arrives as a `qms` issue that qms-bot opens from an approved requirement in the QMS.
You never need to open the QMS repo:

1. `gh issue develop <issue> --checkout --name SRS-FUN-049-short-name`: the branch starts with the SRS ID.
2. Write the code, and `docs/design/` changes in the same branch if the design changes.
3. Tag every test that verifies the requirement or one of the issue's risks:
   `test("[SRS-FUN-049][RISK-003] the page background is yellow", ...)`, or put it in `tests/SRS-FUN-049/`.
4. Open the PR titled `SRS-FUN-049: <summary>` and squash-merge once the checks are green.

The checks, and what happens after the merge: [docs/qms.md](docs/qms.md).
