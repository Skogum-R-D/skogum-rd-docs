# Frontend

Next.js 16.2 specialist. Builds complete, production-ready frontend projects and pushes them to GitHub. Before calling Mistral, the agent pre-loads the design handbook and the canonical component library into the prompt.

## Tools available

| Tool | Purpose |
|---|---|
| `build_and_test` | Clone repo, `npm install`, `npm run build`, verify it passes |
| `github_create_repo` | Create a new repository |
| `github_list_repos` | List org repositories |
| `github_create_branch` | Create a feature branch |
| `github_create_or_update_file` | Push a file to a branch |
| `github_get_file` | Read a file from a branch |
| `github_create_pr` | Open a pull request |

## Pre-task context loading

Before dispatching to Mistral, the agent fetches two external sources in parallel:

```python
handbook, starter = await asyncio.gather(
    self._fetch_handbook(),
    self._fetch_starter(),
)
```

### Design handbook (`Skogum-R-D/design-handbook`)

Loaded files: `docs/stack.md`, `docs/gotchas.md`, `docs/design/glassmorphism.md`, `docs/design/animations.md`, `docs/components/button.md`, `docs/components/card.md`.

These provide authoritative design constraints the model must follow.

### Next.js starter template (`Skogum-R-D/skogum-nextjs-starter`)

Loaded files: all 12 canonical component and config files. See [Next.js Starter](../tools/nextjs-starter.md) for details.

The starter files are injected verbatim into the prompt with the instruction to copy them exactly. This eliminates the TypeScript errors that occur when the model generates Button/Card components from scratch.

## Build verification

Identical to the [engineer](engineer.md#build-verification): `_build_called` / `_build_verified` flags enforce that `build_and_test` returns `success=True` before `task_complete` is emitted.

## Tool loop limit

`MAX_TOOL_ITERATIONS = 30`. Frontend tasks require more iterations than backend tasks: pushing 12 starter files + project-specific components + calling `build_and_test` + opening a PR can easily exceed 20 tool calls.

## Avoiding redundant file pushes

The system prompt instructs the agent: if a repo and branch already exist in the whiteboard context, skip re-pushing starter template files (button.tsx, card.tsx, etc.) that were pushed in an earlier task. Only push files the current task specifically requires.

## Tech stack (enforced in system prompt)

| Dependency | Version |
|---|---|
| Next.js | 16.2.x (App Router) |
| React | ^19.0.0 |
| Tailwind CSS | ^3.4.0 (NOT v4) |
| Framer Motion | ^11.3.28 |
| lucide-react | ^0.468.0 |

## Critical rules

1. Every component using `motion.*` or hooks must start with `"use client";`
2. CSS variable colors in `globals.css` use raw HSL without `hsl()` wrapper: `--background: 222 47% 5%;`
3. `postcss.config.mjs`: `{ plugins: { tailwindcss: {}, autoprefixer: {} } }` — NOT `@tailwindcss/postcss`
4. Dark theme `--foreground` must be near-white (e.g. `210 40% 98%`)
5. File names and import paths must match case exactly

## Whiteboard writes

Same as Engineer — writes `implementation`, `github_repo`, `github_branch`, and per-task status fields.
