# Operations

## Starting the stack

```bash
# From the skogum-ai-consult-firm directory
GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d= -f2) podman-compose up -d
```

All five agents and Valkey start as containers. The admin dashboard runs separately (see [Dashboard](dashboard.md)).

## Submitting an assignment

```bash
python scripts/submit_assignment.py "Your assignment description here"
```

Or use the submission form in the admin dashboard at `http://localhost:3003`.

## Monitoring

```bash
# Watch all agent logs simultaneously
podman-compose logs -f

# Watch a specific agent
podman logs -f skogum-ai-consult-firm_frontend_1

# Check assignment state on the whiteboard
valkey-cli hgetall whiteboard:<assignment-id>

# List all active assignments
valkey-cli --scan --pattern "whiteboard:*"
```

## Valkey persistence

Valkey runs with AOF (Append-Only File) persistence enabled:

```
--appendonly yes --appendfsync everysec --save 60 1
```

This means whiteboard state, retry counts, and assignment plans survive container restarts. A full sync to disk happens every second; a snapshot is also taken every 60 seconds if at least 1 key changed.

## Task timeouts

Each agent wraps `handle_event()` in a 10-minute timeout:

```python
TASK_TIMEOUT = int(os.getenv("TASK_TIMEOUT", "600"))  # seconds

async def _timed_handle_event(self, event):
    try:
        await asyncio.wait_for(self.handle_event(event), timeout=self.TASK_TIMEOUT)
    except asyncio.TimeoutError:
        await self.emit_event("project_manager", {"type": "task_failed", ...})
```

If a Mistral API call hangs or a tool loop runs indefinitely, the task automatically fails after 10 minutes and PM re-dispatches it.

## Restarting an agent

To pick up code changes or recover from a crash:

```bash
podman stop skogum-ai-consult-firm_frontend_1
podman rm skogum-ai-consult-firm_frontend_1
GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d= -f2) podman-compose up -d frontend
```

!!! warning "Use stop+rm+up — not restart"
    `podman restart` keeps the old image. You must `rm` the container and `up` it to pick up a newly built image.

The PM automatically re-dispatches any tasks that were `in_progress` when the agent died once the next event arrives (state is restored from Valkey on startup).

## Rebuilding an agent image

```bash
GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d= -f2) podman-compose build frontend
# Then stop/rm/up as above
```

## Purging queues

If stale events are causing agents to loop on completed work:

```bash
# Inspect queue contents
podman exec skogum-ai-consult-firm_valkey_1 valkey-cli lrange queue:frontend 0 -1

# Delete a specific queue
podman exec skogum-ai-consult-firm_valkey_1 valkey-cli del queue:frontend

# Purge all agent queues
for agent in project_manager engineer frontend qa infra researcher; do
  podman exec skogum-ai-consult-firm_valkey_1 valkey-cli del queue:$agent
done
```

!!! warning
    Purging queues drops all unprocessed events. In-flight assignments may stall.

## Common failure modes

### Build never verified (task_failed with "build did not pass")
**Symptom:** Task fails with reason "build_and_test never returned success=True".  
**Cause:** Agent hit `MAX_TOOL_ITERATIONS` before reaching `build_and_test`, or build failed and the agent couldn't fix it within the iteration budget.  
**Fix:** Check the build error in the whiteboard `implementation` field. If it's a trivial TypeScript error, fix the file in the repo manually, then reset the task status and re-submit or wait for PM to retry.

### Stale queue from retry storm
**Symptom:** Agents keep processing the same task repeatedly; queue depth stays high.  
**Cause:** PM retried a task multiple times before hitting the cap; all the dispatch events queued up.  
**Fix:** Purge the relevant queue (see above). The assignment state on the whiteboard is already up to date.

### `npm ci` EUSAGE during build_and_test
**Symptom:** Build step fails with "EUSAGE" in output.  
**Fix:** `build_and_test` handles this automatically — falls back to `npm install` and pushes an updated lock file.

### PM doesn't dispatch tasks after restart
**Symptom:** Assignment stuck `in_progress` with no new events after PM restart.  
**Fix:** PM restores `_active` from Valkey on startup. If still stuck, check that `whiteboard:<id>.status` equals `in_progress` and that the task plan is present. Manually emit a `task_complete` for the last completed task to trigger re-dispatch.

### Container running old image after rebuild
**Symptom:** Code changes have no effect; logs still show old behaviour.  
**Fix:** `podman restart` does NOT pick up new images. Always `podman stop → podman rm → podman-compose up -d`.
