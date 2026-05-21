# Admin Dashboard

The admin dashboard (`skogum-rd-admin`) provides a real-time view of all assignments and agent activity.

## Stack

- **Next.js 16.2** with App Router
- **Tailwind CSS v3** for styling
- **Framer Motion** for animations
- **ioredis** for Valkey connection (server-side only, in API routes)

## Running locally

```bash
# Using Docker (recommended)
podman run -d \
  --name skogum-admin \
  -p 3003:3000 \
  -e VALKEY_URL=redis://host.containers.internal:6379 \
  skogum-rd-admin:latest

# Or via npm (requires Node 20+)
VALKEY_URL=redis://localhost:6379 npm run dev
```

## Features

### Assignment cards

Each card shows:

- Assignment ID (first 8 characters) and overall status with pulse indicator
- Plan summary and creation timestamp
- **Progress bar** — completed tasks / total tasks
- **Active task callout** — blue highlighted bar for any in-progress, validating, or dispatched task
- **Full task list** — every task with agent badge, type, status dot, description, and completion timestamp
- **Collapsible handoff timeline** — ordered chain of which agent completed which task and when

### Agent status bar

Top of the page shows all 6 agents. Agents with at least one active task are highlighted with their current task name.

### Auto-refresh

The page polls `/api/assignments` every 5 seconds. The "Last updated" timestamp reflects the last successful fetch.

## API

### `GET /api/assignments`

Returns all assignments sorted by creation time (newest first).

```json
{
  "assignments": [
    {
      "id": "98efb233-122b-4b46-bd36-d184f220f96b",
      "planSummary": "Build a Next.js admin dashboard...",
      "status": "completed",
      "createdAt": "2026-05-21T03:53:59Z",
      "latestActivity": "2026-05-21T04:51:46Z",
      "tasks": [
        {
          "id": "create_github_repo",
          "type": "implement",
          "assignedAgent": "infra",
          "description": "Create repository under Skogum-R-D org",
          "dependsOn": [],
          "status": "completed",
          "completedAt": "2026-05-21T03:54:29Z"
        }
      ]
    }
  ]
}
```

## Building the Docker image

```bash
# Build from source
podman build -t skogum-rd-admin:latest .

# Or let the engineer agent build it via the build_and_test tool
```

The Dockerfile uses a multi-stage build with `output: "standalone"` for minimal image size.

## Repository

Source code: [github.com/Skogum-R-D/skogum-rd-admin](https://github.com/Skogum-R-D/skogum-rd-admin)
