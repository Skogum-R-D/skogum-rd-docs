# QA

Validates implementations via code analysis **and** an actual build. A passing build is required for any repo that contains a `package.json`.

## Tools available

| Tool | Purpose |
|---|---|
| `build_and_test` | Clone repo, `npm install`, `npm run build` — **mandatory for JS/TS repos** |
| `github_list_repos` | Confirm repo exists |
| `github_get_file` | Read source files for analysis |
| `github_create_issue` | File a bug report on the repo |

## What QA checks

1. **Build passes** — run `build_and_test` first; fail immediately if `success=False`. A passing static analysis is NOT sufficient.
2. **Correctness** — does the code satisfy the stated requirements?
3. **Security** — no hardcoded secrets or tokens; least privilege where relevant
4. **Best practices** — idiomatic, maintainable, following ecosystem conventions
5. **Completeness** — required files present, no blocking TODOs
6. **TypeScript** — no type errors (the build catches these)

## What QA does NOT check

- Cross-browser rendering or responsive layout
- Contact form submissions or backend connectivity
- Missing CI secrets (configured separately)

## Verdict format

QA produces a structured JSON verdict written to `qa_report` on the whiteboard:

```json
{
  "verdict": "pass",
  "score": 8,
  "issues": [],
  "recommendations": ["Add error boundary to root layout"],
  "summary": "Build passes. Implementation is complete and correct."
}
```

## Retry behavior

On a `fail` verdict, QA emits `task_failed` back to PM with the issues list. PM re-dispatches the implementation task with the failure reason. The PM caps retries at `MAX_TASK_RETRIES` (default 3).

## File layout rules

!!! warning "Next.js App Router layout"
    QA must check `app/` at the repo root, **not** `src/app/`. Always use `github_get_file` to verify actual file structure before drawing conclusions. Never fail for missing `src/`-prefixed paths.
