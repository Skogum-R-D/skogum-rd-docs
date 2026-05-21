# QA

Validates implementations via **static code analysis only** — no running environment required or assumed.

## Tools available

| Tool | Purpose |
|---|---|
| `github_list_repos` | Confirm repo exists |
| `github_get_file` | Read source files for analysis |
| `github_create_issue` | File a bug report on the repo |

## What QA checks

1. **Correctness** — does the code satisfy the stated requirements?
2. **Security** — no hardcoded secrets or tokens; least privilege where relevant
3. **Best practices** — idiomatic, maintainable, following ecosystem conventions
4. **Completeness** — required files present, no blocking TODOs
5. **Build integrity** — package.json scripts correct; imports resolve; no obvious syntax errors

## What QA does NOT check

QA explicitly skips checks that require a running environment:

- Cross-browser rendering or responsive layout
- Contact form submissions or backend connectivity
- Missing Vercel/CI secrets (configured separately)
- Workflow run results (workflows use manual triggers)

## Verdict format

QA produces a structured JSON verdict written to `qa_report` on the whiteboard:

```json
{
  "verdict": "pass",
  "score": 8,
  "issues": [],
  "recommendations": ["Add error boundary to root layout"],
  "summary": "Implementation is complete and correct. All required files are present..."
}
```

## Retry behavior

On a `fail` verdict, QA emits `task_failed` back to PM with the issues list. PM re-dispatches the implementation task to the engineer with the failure reason. A `qa_retry_{task_plan_id}` counter on the whiteboard survives agent restarts.

## File layout rules

!!! warning "Next.js App Router layout"
    QA must check `app/` at the repo root, **not** `src/app/`. Always use `github_get_file` to verify actual file structure before drawing conclusions. Never fail for missing `src/`-prefixed paths.
