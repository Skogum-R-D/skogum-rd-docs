# Agent Memory

## The problem

Every agent currently has complete amnesia between assignments. Each task starts with only the system prompt and the current assignment's whiteboard — no knowledge of previous work, discovered conventions, or accumulated org context.

This causes concrete, repeated failures:

- QA kept failing on `src/app/` paths until the fix was hardcoded into the system prompt (a code change + redeploy)
- The engineer re-discovers repo structure (framework, packages, conventions) on every task
- When QA fails and the engineer retries, the engineer has no memory of what it already tried
- PM produces the same plan quality regardless of how many similar assignments it has run

## Memory layers

### Short-term: whiteboard context injection

Agents already have per-assignment state on the whiteboard but don't proactively read it. Making `BaseAgent.handle_event()` inject a richer context snapshot at task start would improve retry quality significantly — the engineer on retry 2 would know what retry 1 already attempted.

### Long-term: cross-assignment memory

Three categories stored in Valkey under a `memory:` namespace:

#### Per-repo knowledge

Facts discovered by agents while working on a repo, written once and reused forever:

```
memory:repo:skogum-rd-admin → {
  framework: "nextjs-16-app-router",
  css: "tailwind-v3",
  redis_client: "ioredis",
  docker: "standalone output, node:20-alpine",
  file_layout: "app/ at root, no src/ prefix"
}
```

Written automatically by the engineer or infra agent when they first inspect a repo. Read by all agents before starting any task on that repo.

#### Org conventions

Curated preferences that apply across all projects:

```
memory:org:Skogum-R-D → {
  prefer: "ioredis over node-redis",
  router: "App Router not Pages Router",
  always: "package-lock.json committed, npm ci in CI",
  theme: "dark, glassmorphism, Framer Motion animations"
}
```

#### PM planning patterns

Which task sequences tend to succeed or fail for given assignment types. Feeds back into PM planning to produce better task graphs over time.

## Design guide in Valkey

Org conventions and UI/code standards live as a markdown document in the docs repo and are loaded into Valkey at stack startup. Agents read them as part of their task context.

### Loading

```python
# scripts/load_conventions.py
import asyncio, redis.asyncio as redis, pathlib

CONVENTIONS = {
    "stack": "Next.js 16 App Router, TypeScript, Tailwind v3, Framer Motion, ioredis",
    "file_layout": "app/, components/, lib/, public/ at repo root — no src/ prefix",
    "css": "Tailwind v3 only, dark theme default, glassmorphism for cards",
    "docker": "output: standalone, node:20-alpine, always mkdir -p /app/public",
}

DESIGN_GUIDE = pathlib.Path("docs/design-guide.md").read_text()

async def main():
    r = redis.from_url("redis://localhost:6379")
    await r.hset("config:conventions", mapping=CONVENTIONS)
    await r.set("config:design_guide", DESIGN_GUIDE)

asyncio.run(main())
```

Run automatically at stack startup via a short-lived loader service in `docker-compose.yml`:

```yaml
loader:
  build: .
  command: python scripts/load_conventions.py
  depends_on: [valkey]
  restart: "no"
```

### Reading in agents

```python
async def handle_event(self, event: dict) -> None:
    conventions = await self.valkey.hgetall("config:conventions")
    design_guide = await self.valkey.get("config:design_guide")
    repo = event["payload"].get("github_repo", "").split("/")[-1]
    repo_memory = await self.valkey.hgetall(f"memory:repo:{repo}")
    # inject all of the above into the Mistral context
```

## Persistence

Valkey is in-memory by default — a container restart wipes all memory. Two layers of persistence are needed:

### Valkey AOF (survives restarts)

Enable append-only file persistence in `docker-compose.yml`:

```yaml
valkey:
  image: valkey/valkey:8
  command: valkey-server --appendonly yes --appendfsync everysec
  volumes:
    - valkey-data:/data

volumes:
  valkey-data:
```

`appendfsync everysec` flushes to disk every second — a good balance between performance and durability. At most one second of writes is lost on a crash.

### Git as source of truth (for curated content)

The design guide and org conventions are version-controlled in the docs repo. Valkey is the runtime cache; Git is the source of truth. Workflow:

```
Edit docs/design-guide.md → commit → push
→ loader service writes to Valkey on next stack start
→ agents pick up changes immediately
```

This means convention updates are PR-reviewable, diff-able, and rolled back trivially via `git revert` — without touching agent code or rebuilding containers.

## Relation to OpenSearch

For semantic retrieval — *"what do we know that's relevant to this Next.js assignment?"* — exact key lookups in Valkey are insufficient. [OpenSearch's k-NN plugin](opensearch.md) could serve as the long-term vector memory store, with Valkey remaining the fast cache for frequently accessed structured facts.
