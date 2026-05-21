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

This publishes an event to the `agent:project_manager` channel. The PM picks it up, plans, and begins dispatching within seconds.

## Monitoring

```bash
# Watch all agent logs simultaneously
podman-compose logs -f

# Watch a specific agent
podman logs -f skogum-ai-consult-firm_project_manager_1

# Check assignment state on the whiteboard
valkey-cli hgetall whiteboard:<assignment-id>

# List all active assignments
valkey-cli --scan --pattern "whiteboard:*" | grep -v workflow
```

## Restarting a hung agent

The engineer agent can hang mid-Mistral API call. If it stops producing logs:

```bash
podman rm -f skogum-ai-consult-firm_engineer_1
GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d= -f2) podman-compose up -d engineer
```

The PM will automatically re-dispatch any tasks that were `in_progress` when the agent died once the assignment's next event arrives. If needed, manually emit a `task_failed` to trigger re-dispatch.

## Purging queues

If stale events are causing agents to loop on invalid work:

```bash
# List queue contents
valkey-cli lrange queue:engineer 0 -1

# Delete a specific queue
valkey-cli del queue:engineer

# Purge all agent queues
for agent in project_manager engineer frontend qa infra researcher; do
  valkey-cli del queue:$agent
done
```

!!! warning
    Purging queues drops all unprocessed events. In-flight assignments may stall and require manual replay.

## Manually replaying events

To re-trigger a task after a queue purge:

```bash
valkey-cli publish agent:project_manager '{"type":"task_complete","assignment_id":"<id>","task_id":"<id>","payload":{"task_plan_id":"<id>"}}'
```

## Excluding repos from the workflow poller

The PM's background poller checks GitHub Actions results. To exclude a repo, add it to `_EXCLUDED_REPOS` in `agents/project_manager/agent.py`:

```python
_EXCLUDED_REPOS = {"cicd-pipeline-demo", "debug-env-file-issue"}
```

## Common failure modes

### Engineer container hangs
**Symptom:** No new logs from engineer for >5 minutes while a task is `in_progress`.  
**Fix:** `podman rm -f` the engineer container and restart it.

### QA fails repeatedly on file paths
**Symptom:** QA verdict fails with "file not found at src/app/..." errors.  
**Fix:** QA system prompt must include the file structure rules. Check `agents/qa/agent.py` SYSTEM_PROMPT.

### `npm ci` EUSAGE during build_and_test
**Symptom:** Build step fails with "EUSAGE" in output.  
**Fix:** `build_and_test` handles this automatically since v2 — falls back to `npm install` and pushes an updated lock file.

### PM doesn't dispatch tasks after restart
**Symptom:** Assignments stuck `in_progress` with no new events after PM restart.  
**Fix:** PM now restores `_active` from Valkey on startup. If still stuck, check that the whiteboard `status` field is `in_progress` for the assignment.
