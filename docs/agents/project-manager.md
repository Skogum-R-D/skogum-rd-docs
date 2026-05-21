# Project Manager

The PM is the orchestrator. It receives assignments, produces a task plan, dispatches tasks to specialist agents, and tracks completion.

## Responsibilities

1. **Planning** — calls Mistral to decompose an assignment into typed tasks with dependencies and agent assignments
2. **Dispatching** — resolves the dependency graph; dispatches tasks whose dependencies are met
3. **Tracking** — maintains `_active` dict of in-flight assignments; restores it from Valkey on restart
4. **Retry logic** — on `task_failed`, re-dispatches the task (up to the retry limit in the plan)
5. **Completion** — when all tasks complete, writes `status=completed` to the whiteboard

## State recovery

The PM's `_active` dict is in-memory but is restored from Valkey on startup by scanning all `whiteboard:*` keys with `status=in_progress`. This means PM container restarts are non-destructive — in-flight assignments resume from their last known state.

```python
async def _restore_active_assignments(self) -> None:
    keys = await self.valkey.keys("whiteboard:*")
    for key in keys:
        wb = await self.read_whiteboard(assignment_id)
        if wb.get("status") != "in_progress":
            continue
        # Rebuild _active[assignment_id] from plan + task statuses
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

## Workflow poller

The PM also runs a background poller that checks GitHub Actions workflow runs for repos in the org and can react to CI failures. Repos can be excluded via `_EXCLUDED_REPOS` in `agents/project_manager/agent.py`.

## Known limitations

- Single PM is a bottleneck for high assignment throughput (acceptable at current scale)
- No hard retry cap is enforced at the PM level — if QA repeatedly fails, the PM will keep re-dispatching
