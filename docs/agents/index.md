# Agents

The system has five specialized agents, each running as an independent container and subscribing to its own Valkey channel.

## Agent roster

| Agent | Model | Role | GitHub tools |
|---|---|---|---|
| [Project Manager](project-manager.md) | devstral-latest | Plans assignments, dispatches tasks, tracks completion | list_repos, create_issue, merge_pr |
| [Engineer](engineer.md) | devstral-latest | Implements backend/fullstack features | create_repo, create_branch, create/update files, get_file, list_repos, create_pr |
| [Frontend](frontend.md) | devstral-latest | Implements UI/frontend features | same as engineer |
| [QA](qa.md) | devstral-latest | Static code review and validation | list_repos, get_file, create_issue |
| [Infra](infra.md) | devstral-latest | Repo setup, secrets, CI/CD, merges | all engineer tools + add_secret, merge_pr |

## BaseAgent

All agents inherit from `BaseAgent` (`base/base_agent.py`), which provides:

- **Valkey connection** — pub/sub subscribe loop + helper methods
- **Whiteboard I/O** — `read_whiteboard()`, `write_whiteboard()`
- **Event emission** — `emit_event(target_agent, event)`
- **Mistral tool loop** — `call_mistral(messages)` with up to 10 tool iterations
- **Tool registration** — `register_tool(name, fn, schema)`
- **Clarification protocol** — `ask(task_id, target_agent, question)` for inter-agent questions

## Tool loop

When an agent receives a task, `call_mistral()` runs a loop:

```
while iterations < 10:
    call Mistral with registered tools
    if no tool calls → return text response
    execute each tool call (via asyncio.to_thread)
    append tool results to message history
→ one final call for text summary
```

This lets agents perform sequences of GitHub operations (create repo → create branch → push files → open PR) within a single task.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VALKEY_URL` | Yes | e.g. `redis://valkey:6379` |
| `MISTRAL_API_KEY` | Yes | Mistral AI API key |
| `GITHUB_TOKEN` | Yes | GitHub PAT with repo + org scope |
| `GH_ORG` | No | Default GitHub org (falls back to token owner) |
| `QA_MODEL` | No | Override LLM for QA agent |
