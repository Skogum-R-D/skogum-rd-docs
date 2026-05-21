# Infra

Handles repository setup, secrets management, CI/CD configuration, and PR merges. Has the broadest GitHub tool access of any agent.

## Tools available

All engineer tools plus:

| Tool | Purpose |
|---|---|
| `github_add_secret` | Add encrypted secrets to a repo (uses PyNaCl SealedBox) |
| `github_merge_pr` | Squash-merge a pull request |

## Typical responsibilities

- Creating the initial repository with README and license
- Configuring repository secrets (e.g. `VALKEY_URL`, deployment tokens)
- Setting up Dockerfiles and CI/CD workflow files
- Merging implementation PRs after QA passes

## Whiteboard writes

Same pattern as Engineer — writes `implementation` summary and per-task status fields.
