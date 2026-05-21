# Research

Exploratory ideas and architectural directions being evaluated for the Skogum multi-agent platform. These are not yet implemented but represent the next evolution of the system.

## Areas

| Topic | Summary |
|---|---|
| [Agent Memory](agent-memory.md) | Cross-assignment learning, org conventions, per-repo knowledge, design guide persistence |
| [OpenSearch Integration](opensearch.md) | Log aggregation, QA failure analytics, vector search as memory backend |

## Guiding principles

These research directions share a common theme: the system should **learn from its own work** rather than relying solely on static system prompts. Each assignment produces signal — which plans succeed, which QA checks fail repeatedly, what a codebase looks like — and that signal should accumulate into shared knowledge that makes future assignments better.
