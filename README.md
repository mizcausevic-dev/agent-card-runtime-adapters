# agent-card-runtime-adapters

Turn a **Kinetic Gain Agent Card** into the agent config your runtime actually wants — **OpenAI Assistants**, **Anthropic Messages** (system-prompt bundle), **Vercel AI SDK**, or a **human-readable markdown briefing**. One disclosure, multiple deployments.

Pairs with [`agent-tool-adapters`](https://github.com/mizcausevic-dev/agent-tool-adapters) in the Kinetic Gain lane #4 (agent-runtime adapters): that handles per-tool wiring; this handles the whole agent. Grounded on the [`agent-cards-spec`](https://github.com/mizcausevic-dev/agent-cards-spec) (`agent_card_version` 0.1).

## Why

A Kinetic Gain Agent Card already declares *who* the agent is, *what* it's for, *which models* and *tools* it uses, *how autonomous* it is, and *what it refuses* — exactly the information you would otherwise scatter across system prompts, dashboard configs, and runtime initializers. This library lifts that single source of truth into the shape each runtime expects, so the disclosure isn't a doc artifact that drifts from production: it *is* the production config.

Pure transform. No network, no LLM, no execution.

## Install

```bash
npm install -g agent-card-runtime-adapters   # CLI
npm install agent-card-runtime-adapters      # library
```

Requires Node ≥ 20.

## CLI

```bash
agent-card-adapt agent-card.json --target openai
agent-card-adapt agent-card.json --target anthropic --out anthropic.json
agent-card-adapt agent-card.json --target markdown   # human briefing for review/onboarding
```

`agent-card.json` is a v0.1 Kinetic Gain Agent Card. Exit codes: `0` ok, `2` usage/IO error.

## Library

```ts
import { convert } from "agent-card-runtime-adapters";

const openaiCfg = convert(card, "openai");       // OpenAI Assistants create payload
const anthCfg   = convert(card, "anthropic");    // { model, system, metadata }
const vercelCfg = convert(card, "vercel");       // { model, system, tools, metadata }
const briefing  = convert(card, "markdown");     // string
```

## What gets mapped

| Card field | Runtime use |
|---|---|
| `agent.name` / `description` | OpenAI Assistants `name`; opening line of the system prompt |
| `capabilities.models_used` | picks the **planner** role first, else the first entry, for the runtime's `model` |
| `capabilities.primary_purpose` + `autonomy_level` + `memory_persistence` | the rendered **system prompt** (used by anthropic/vercel/markdown; OpenAI `instructions`) |
| `capabilities.tools[]` | function envelopes (openai), keyed record (vercel), markdown bullets |
| `refusal_taxonomy[]` | refusal block appended to the system prompt + dedicated section in the markdown briefing |
| `agent_card_version` / `agent.id` / `agent.version` / `autonomy_level` | propagated to `metadata` |

Tool *schemas* are intentionally not invented here — Agent Cards reference tools by name; pair this with [`agent-tool-adapters`](https://github.com/mizcausevic-dev/agent-tool-adapters) for full per-tool wiring from MCP `tools/list`.

## License

AGPL-3.0-or-later — see [LICENSE](LICENSE).
