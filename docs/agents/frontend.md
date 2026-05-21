# Frontend

Implements UI and frontend features. Has the same GitHub tool set as the engineer but is prompted for frontend-specific work (React, Next.js, Tailwind CSS, Framer Motion).

## Tools available

Same as [Engineer](engineer.md): create_repo, list_repos, create_branch, create_or_update_file, get_file, create_pr.

## Conventions

- **Next.js App Router** layout: `app/`, `components/`, `lib/`, `public/` at repo root — no `src/` prefix
- **Tailwind CSS v3** for styling
- **Framer Motion** for animations — components using it must have `"use client"` directive
- `output: "standalone"` in `next.config.js` for Docker builds

## Whiteboard writes

Same pattern as Engineer — writes `implementation` summary, `github_repo`, `github_branch`, and per-task status fields.
