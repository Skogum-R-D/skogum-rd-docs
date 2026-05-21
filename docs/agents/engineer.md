# Engineer

Implements backend and fullstack features. Produces working code committed to GitHub and writes a summary to the whiteboard.

## Tools available

| Tool | Purpose |
|---|---|
| `github_create_repo` | Create a new repository |
| `github_list_repos` | List org repositories |
| `github_create_branch` | Create a feature branch |
| `github_create_or_update_file` | Push a file to a branch |
| `github_get_file` | Read a file from a branch |
| `github_create_pr` | Open a pull request |

## Typical task flow

1. Read the assignment and task description
2. Create or identify the target repo
3. Create a feature branch
4. Push implementation files one by one
5. Open a PR
6. Write `implementation` summary to the whiteboard (includes repo URL, branch, PR link)
7. Emit `task_complete` to PM

## Whiteboard writes

| Key | Value |
|---|---|
| `implementation` | Summary of what was built, with GitHub URLs |
| `github_repo` | Full repo URL |
| `github_branch` | Working branch name |
| `task_{id}_status` | `in_progress` → `completed` |
| `task_{id}_completed_at` | ISO timestamp |

## Known issues

- Mistral API calls can hang indefinitely — the container may need manual restart if the engineer stops responding. A task timeout (`asyncio.wait_for`) is on the roadmap.
