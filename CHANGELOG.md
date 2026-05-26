# Changelog

## v0.1.0 — 2026-05-25

- Initial release: convert a Kinetic Gain [Agent Card](https://github.com/mizcausevic-dev/agent-cards-spec) (`agent_card_version` 0.1) into a runtime-specific config.
- Adapters: OpenAI Assistants (name/model/instructions/tools/metadata), Anthropic (model + rendered system + metadata), Vercel AI SDK (model/system/tools record/metadata), and a markdown briefing (purpose, models, tools, refusal taxonomy).
- Planner-role-preferred model selection, system prompt that includes autonomy/memory/refusals, and validation that rejects an unsupported card version or empty `models_used`.
- Pairs with `agent-tool-adapters` (per-tool wiring) — Agent Card → agent-level runtime config; `tools/list` → per-tool function schemas.
- Library API (`convert`, per-target adapters, `pickModel`, `renderSystemPrompt`) + CLI (`agent-card-adapt`, `--target openai|anthropic|vercel|markdown`).
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
