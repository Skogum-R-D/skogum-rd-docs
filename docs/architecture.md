# Architecture Overview

## System components

```mermaid
graph TB
    subgraph Agents ["Agent containers (Podman/Docker)"]
        PM[project_manager]
        ENG[engineer]
        FE[frontend]
        QA[qa]
        INF[infra]
        RES[researcher]
    end

    subgraph Valkey ["Valkey (Redis-compatible)"]
        PubSub["Pub/Sub channels\nagent:{name}"]
        WB["Whiteboard hashes\nwhiteboard:{assignment_id}"]
    end

    subgraph GitHub
        Repos[Repositories]
        PRs[Pull Requests]
    end

    subgraph Dashboard
        Admin["skogum-rd-admin\n(Next.js, port 3003)"]
    end

    PM <-->|publish/subscribe| PubSub
    ENG <-->|publish/subscribe| PubSub
    FE <-->|publish/subscribe| PubSub
    QA <-->|publish/subscribe| PubSub
    INF <-->|publish/subscribe| PubSub
    RES <-->|publish/subscribe| PubSub

    Agents <-->|hset/hgetall| WB
    Agents -->|REST API| GitHub
    Admin -->|hgetall whiteboard:*| WB
```

## Technology stack

| Layer | Technology | Notes |
|---|---|---|
| Agent runtime | Python 3.12, asyncio | All agents share `BaseAgent` |
| LLM | Mistral AI (devstral-latest) | Function calling / tool loop |
| Event bus | Valkey pub/sub | One channel per agent: `agent:{name}` |
| Shared state | Valkey hashes | One hash per assignment: `whiteboard:{id}` |
| GitHub integration | GitHub REST API via httpx | 9 tools: repos, files, PRs, secrets, issues |
| Dashboard | Next.js 16.2, Tailwind CSS, Framer Motion | Reads Valkey directly via ioredis |
| Container runtime | Podman / Docker | docker-compose.yml + k8s manifests |

## Assignment lifecycle

```mermaid
sequenceDiagram
    participant User
    participant PM as Project Manager
    participant WB as Whiteboard
    participant Agent as Implementing Agent
    participant QA

    User->>PM: submit_assignment("build X")
    PM->>WB: write plan, status=in_progress
    PM->>Agent: emit task_dispatch event
    Agent->>WB: write task_{id}_status=in_progress
    Agent->>Agent: tool loop (GitHub ops)
    Agent->>WB: write implementation summary
    Agent->>PM: emit task_complete
    PM->>QA: emit validate task
    QA->>QA: static analysis via github_get_file
    alt QA passes
        QA->>PM: emit task_complete (verdict=pass)
        PM->>WB: write status=completed
    else QA fails (max 3 retries)
        QA->>PM: emit task_failed (verdict=fail)
        PM->>Agent: re-dispatch implement task
    end
```

## Dependency graph execution

The PM resolves task dependencies before dispatching. Tasks with no unmet dependencies are dispatched immediately and in parallel; dependent tasks wait for their `depends_on` tasks to complete.

```json
{
  "tasks": [
    { "id": "create_repo",   "depends_on": [] },
    { "id": "setup_project", "depends_on": ["create_repo"] },
    { "id": "implement_api", "depends_on": ["setup_project"] },
    { "id": "validate",      "depends_on": ["implement_api"] }
  ]
}
```
