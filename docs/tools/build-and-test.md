# Build & Test Tool

`build_and_test` clones a repo, installs dependencies, runs the build, and pushes a `package-lock.json` back to the branch if one was missing or stale.

## Signature

```python
build_and_test(repo, branch="main", org=None) -> dict
```

## What it does

```mermaid
flowchart TD
    A[Clone repo @ branch] --> B{package-lock.json exists?}
    B -->|Yes| C[npm ci --legacy-peer-deps]
    C --> D{Exit code?}
    D -->|0 — success| F[npm run build]
    D -->|EUSAGE — lock stale| E[npm install --legacy-peer-deps]
    D -->|Other error| FAIL1[Return failure: npm_ci]
    B -->|No| E
    E --> E2{Exit code?}
    E2 -->|0| PUSH[Push updated lock file to branch]
    E2 -->|Non-zero| FAIL2[Return failure: npm_install]
    PUSH --> F
    F --> G{Exit code?}
    G -->|0| OK[Return success]
    G -->|Non-zero| FAIL3[Return failure: npm_build]
```

## Lock file handling

The tool handles three lock file states:

| State | Action |
|---|---|
| No `package-lock.json` | Run `npm install`, push generated lock file |
| Valid lock file | Run `npm ci` (faster, reproducible) |
| Stale lock file (EUSAGE) | Fall back to `npm install`, push updated lock file |

The stale lock case arises when `package.json` is updated (new dependencies added) but the lock file isn't regenerated. `npm ci` exits with `EUSAGE` in this case, which the tool detects and recovers from automatically.

## Return value

```python
# Success
{"success": True, "build_output": "..."}

# Failure
{"success": False, "step": "npm_ci" | "npm_install" | "npm_build", "output": "..."}
```

## Notes

- Runs in a temporary directory; cleans up after itself
- Uses `asyncio.to_thread` (subprocess calls are blocking)
- `--legacy-peer-deps` is passed to npm to handle peer dependency conflicts common in Next.js projects
