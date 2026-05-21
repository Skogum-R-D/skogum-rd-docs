# GitHub Tools

All GitHub interactions go through a set of tools in `base/tools/github_tools.py`. Tools are registered per-agent based on their role; agents only get the tools they need.

## Authentication

Tools read `GITHUB_TOKEN` from the environment. The default org is read from `GH_ORG` (falls back to the token owner's account if unset).

```python
def _client() -> httpx.Client:
    return httpx.Client(
        headers={"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}"},
        base_url="https://api.github.com",
    )

def _default_owner() -> str:
    return os.getenv("GH_ORG") or _client().get("/user").json()["login"]
```

## Tool reference

### `github_create_repo`

```python
github_create_repo(name, description="", private=False, org=None)
```

Creates a repository under the org (or token owner). Returns `{"url": ..., "clone_url": ...}`.

---

### `github_list_repos`

```python
github_list_repos(org=None)
```

Lists all repositories in the org. Paginates via `Link` header. Returns list of `{"name": ..., "url": ...}`.

---

### `github_create_branch`

```python
github_create_branch(repo, branch, from_branch="main", org=None)
```

Gets the SHA of `from_branch` and creates a new ref. Returns `{"branch": ..., "sha": ...}`.

---

### `github_create_or_update_file`

```python
github_create_or_update_file(repo, path, content, commit_message, branch="main", org=None)
```

Pushes a file to the repo. If the file exists, fetches its SHA first and updates it. `content` must be a plain string (base64 encoding is handled internally). Returns `{"path": ..., "sha": ...}`.

!!! warning
    `content` must not be `None`. Pass an empty string `""` for empty files.

---

### `github_get_file`

```python
github_get_file(repo, path, branch="main", org=None)
```

Reads a file. Decodes the base64 GitHub API response automatically. Returns `{"path": ..., "content": ..., "sha": ...}`.

---

### `github_create_pr`

```python
github_create_pr(repo, title, body, head_branch, base_branch="main", org=None)
```

Opens a pull request. Returns `{"number": ..., "url": ...}`.

---

### `github_merge_pr`

```python
github_merge_pr(repo, pr_number, org=None)
```

Squash-merges a PR. Returns `{"merged": true, "sha": ...}`.

---

### `github_add_secret`

```python
github_add_secret(repo, secret_name, secret_value, org=None)
```

Encrypts `secret_value` using the repo's public key (PyNaCl `SealedBox`) and sets it as a repository secret. Returns `{"secret_name": ...}`.

---

### `github_create_issue`

```python
github_create_issue(repo, title, body="", org=None)
```

Opens a GitHub issue. Returns `{"number": ..., "url": ...}`.

---

### `build_and_test`

See [Build & Test](build-and-test.md) — this tool is separate from the GitHub API tools.
