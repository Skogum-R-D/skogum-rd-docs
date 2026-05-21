# Observability

## Current state

The primary debugging path today is:

1. `podman logs <agent>` — tail agent logs
2. `valkey-cli hgetall whiteboard:{id}` — inspect assignment state
3. Admin dashboard — task statuses and agent handoff chain

This is sufficient for happy-path monitoring but requires CLI access to diagnose failures.

## Planned: Prometheus metrics

A **Valkey exporter** sidecar (one container, not per-agent) will scrape all `whiteboard:*` keys on a 15-second interval and expose Prometheus metrics.

Proposed metrics:

```
# Task outcomes
skogum_tasks_total{status="completed", agent="engineer"} 42
skogum_tasks_total{status="failed", agent="qa"} 7

# Assignment state
skogum_assignments_total{status="completed"} 12
skogum_assignments_total{status="in_progress"} 2

# Timing (histogram)
skogum_task_duration_seconds{agent="engineer"}

# Queue depth (from Valkey list lengths)
skogum_queue_depth{agent="engineer"} 3

# QA retry pressure
skogum_qa_retries_total{task="implement_api"} 2
```

This approach keeps agents clean — no Prometheus HTTP server in each container. The exporter reads Valkey directly, the same way the dashboard does.

## Planned: Distributed tracing

The event-driven architecture makes causality invisible in plain logs. A trace per assignment would show the full waterfall: PM planning → dispatch → agent tool loops → QA → completion, with exact timings for each Mistral API call and GitHub tool invocation.

**Implementation approach:**

- Propagate W3C `traceparent` through Valkey event payloads
- `BaseAgent.handle_event()` extracts context and starts a span
- `call_mistral()` and each tool call become child spans
- Export to **Grafana Tempo** (integrates with the same Grafana instance as Prometheus)

```python
# emit_event — inject context
payload["_traceparent"] = get_current_traceparent()

# handle_event — continue the trace
ctx = extract_traceparent(event.get("_traceparent"))
with tracer.start_as_current_span(f"{self.agent_name}.handle", context=ctx) as span:
    span.set_attribute("assignment_id", event["assignment_id"])
    span.set_attribute("task_id", event["task_id"])
```

## Roadmap priority

| Item | Impact | Effort |
|---|---|---|
| Task timeouts in BaseAgent | Eliminates hung-agent outages | Low |
| PM retry cap | Prevents infinite QA loops | Low |
| Failure details in dashboard | Reduces CLI debugging | Medium |
| Valkey → Prometheus exporter | Trend monitoring + alerting | Medium |
| OpenTelemetry tracing | Deep causality visibility | High |
