# Event Bus & Whiteboard

## Event bus (Valkey pub/sub)

Agents communicate exclusively through Valkey pub/sub. Each agent subscribes to its own channel.

### Channel naming

```
agent:project_manager
agent:engineer
agent:frontend
agent:qa
agent:infra
agent:researcher
```

### Event schema

Every event is a JSON object published to the target agent's channel:

```json
{
  "task_id": "implement_api",
  "assignment_id": "98efb233-122b-4b46-bd36-d184f220f96b",
  "type": "task_dispatch",
  "assigned_to": "engineer",
  "payload": {
    "description": "Implement the REST API endpoint",
    "assignment": "Build an admin dashboard...",
    "task_plan_id": "implement_api"
  }
}
```

### Event types

| Type | Direction | Description |
|---|---|---|
| `task_dispatch` | PM → Agent | Assign a task to an agent |
| `task_complete` | Agent → PM | Task finished successfully |
| `task_failed` | Agent → PM | Task failed; PM decides whether to retry |
| `clarification_request` | Agent → Agent | Ask another agent a question |
| `clarification_response` | Agent → Agent | Answer a clarification |

## Whiteboard (Valkey hashes)

The whiteboard is a per-assignment Valkey hash at `whiteboard:{assignment_id}`. It is the single source of truth for assignment state — agents read from it and write to it freely.

### Standard keys

| Key | Type | Written by | Description |
|---|---|---|---|
| `plan` | JSON string | PM | Full task plan with all tasks |
| `plan_summary` | string | PM | One-line human-readable summary |
| `assignment` | string | PM | Original assignment text |
| `status` | string | PM | `in_progress` \| `completed` \| `failed` |
| `created_at` | ISO timestamp | PM | When the assignment was created |
| `implementation` | string | Engineer/Frontend/Infra | Implementation summary / URLs |
| `github_repo` | URL | Engineer/Infra | Created repo URL |
| `github_branch` | string | Engineer | Working branch name |
| `qa_report` | JSON string | QA | Full QA verdict with issues and score |
| `qa_verdict` | string | QA | `pass` \| `fail` |
| `task_{id}_status` | string | Agents | Per-task status |
| `task_{id}_completed_at` | ISO timestamp | Agents | When task completed |
| `qa_retry_{task_id}` | integer | QA | Retry counter (survives restarts) |

### Task status values

| Status | Meaning |
|---|---|
| `pending` | Not yet dispatched |
| `dispatched` | PM sent event, agent hasn't acknowledged |
| `in_progress` | Agent is actively working |
| `validating` | QA is reviewing |
| `completed` | Done successfully |
| `failed` | Failed (non-recoverable or max retries hit) |
| `qa_failed(N): ...` | QA rejected; retry N in progress |

### Reading the whiteboard

```bash
# All keys for an assignment
valkey-cli hgetall whiteboard:98efb233-122b-4b46-bd36-d184f220f96b

# Specific field
valkey-cli hget whiteboard:98efb233-... qa_report

# List all assignment IDs
valkey-cli --scan --pattern "whiteboard:*"
```

!!! note "Dashboard"
    The admin dashboard reads all `whiteboard:*` keys via SCAN and renders live assignment state. See [Dashboard](dashboard.md).
