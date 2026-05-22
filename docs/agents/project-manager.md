# Project Manager

The PM is the orchestrator. It receives assignments, produces a task plan, dispatches tasks to specialist agents, and tracks completion.

## Responsibilities

1. **Planning** — calls Mistral to decompose an assignment into typed tasks with dependencies and agent assignments
2. **Dispatching** — resolves the dependency graph; dispatches tasks whose dependencies are met
3. **Tracking** — maintains `_active` dict of in-flight assignments; restores it from Valkey on restart
4. **Retry logic** — on `task_failed`, increments a PM-owned retry counter and re-dispatches up to `MAX_TASK_RETRIES`
5. **Completion** — when all tasks complete, writes `status=completed` to the whiteboard

## Retry cap

```python
MAX_TASK_RETRIES = int(os.getenv("MAX_TASK_RETRIES", "3"))
```

The PM tracks retries independently in `state["retries"][task_plan_id]` — **not** from the `retry_count` field in the incoming event payload. This prevents drift when multiple agents send conflicting counts.

On each `task_failed` event:

```python
retries = state["retries"].get(task_plan_id, 0) + 1
state["retries"][task_plan_id] = retries
if retries >= MAX_TASK_RETRIES:
    # mark task permanently failed, continue with remaining tasks
else:
    # re-dispatch with retry_count=retries in payload
```

The retry count is also persisted to the whiteboard as `task_{id}_retry_count` so it survives PM restarts.

## State recovery

The PM's `_active` dict is in-memory but is restored from Valkey on startup by scanning all `whiteboard:*` keys with `status=in_progress`. Retry counts are also restored.

```python
async def _restore_active_assignments(self) -> None:
    keys = await self.valkey.keys("whiteboard:*")
    for key in keys:
        wb = await self.read_whiteboard(assignment_id)
        if wb.get("status") != "in_progress":
            continue
        # Rebuild _active[assignment_id] from plan + task statuses + retry counts
```

## Task plan schema

```json
{
  "summary": "One-line description of the assignment",
  "tasks": [
    {
      "id": "create_repo",
      "type": "implement",
      "assigned_to": "infra",
      "description": "Create GitHub repo under Skogum-R-D org",
      "depends_on": []
    },
    {
      "id": "implement_api",
      "type": "implement",
      "assigned_to": "engineer",
      "description": "Implement the REST API",
      "depends_on": ["create_repo"]
    },
    {
      "id": "validate_api",
      "type": "validate",
      "assigned_to": "qa",
      "description": "Static code review of the API implementation",
      "depends_on": ["implement_api"],
      "impl_task_id": "implement_api"
    }
  ]
}
```

## Deployment targets

The PM always plans for **Docker image builds** as the deployment step — never Vercel. The default fallback deployment task is `build_1` (Docker build, assigned to infra).

## Workflow poller

The PM also runs a background poller that checks GitHub Actions workflow runs for repos in the org and can react to CI failures. Repos can be excluded via `_EXCLUDED_REPOS` in `agents/project_manager/agent.py`.
