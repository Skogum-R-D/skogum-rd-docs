# Engineer

Implements backend and fullstack features. Writes code to GitHub and emits `task_complete` to PM only after a successful build.

## Tools available

| Tool | Purpose |
|---|---|
| `build_and_test` | Clone repo, install deps, run build, verify it passes |
| `github_create_repo` | Create a new repository |
| `github_list_repos` | List org repositories |
| `github_create_branch` | Create a feature branch |
| `github_create_or_update_file` | Push a file to a branch |
| `github_get_file` | Read a file from a branch |
| `github_create_pr` | Open a pull request |

## Build verification

The engineer **must** call `build_and_test` before reporting a task complete. This is enforced at the code level:

```python
self._build_called: bool = False   # set True when build_and_test is invoked
self._build_verified: bool = False  # set True only when it returns success=True
```

After the tool loop, if `_build_called and not _build_verified` the agent emits `task_failed` instead of `task_complete`. PM then re-dispatches the task with the failure reason.

## Tool loop limit

`MAX_TOOL_ITERATIONS = 30` — up from the base default of 10. Needed to push multiple files, run the build, and open a PR in one pass.

## Typical task flow

1. Read the assignment, task description, and research findings from the whiteboard
2. Create or identify the target repo and branch
3. Push implementation files
4. Call `build_and_test` — fix errors if it fails, retry until it passes
5. Open a PR
6. Write `implementation` summary and emit `task_complete`

## Whiteboard writes

| Key | Value |
|---|---|
| `implementation` | Summary of what was built, with GitHub URLs |
| `github_repo` | Full repo URL |
| `github_branch` | Working branch name |
| `task_{id}_status` | `in_progress` → `completed` or `failed: build did not pass` |
| `task_{id}_completed_at` | ISO timestamp |

## Branch safety

`_pre_tool_args_hook` intercepts every `github_create_or_update_file` call and rewrites the `branch` argument to the value stored in `whiteboard.github_branch`. This prevents the engineer from accidentally pushing to `main` even if the model forgets.
