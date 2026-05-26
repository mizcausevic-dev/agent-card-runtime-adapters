import { toAnthropic, toMarkdown, toOpenAI, toVercel } from "./adapters.js";
import type { AgentCard, RuntimeTarget } from "./types.js";

function assertCard(card: unknown): asserts card is AgentCard {
  if (!card || typeof card !== "object") throw new Error("agent card must be an object");
  const c = card as Partial<AgentCard>;
  if (c.agent_card_version !== "0.1") {
    throw new Error(`unsupported agent_card_version ${String(c.agent_card_version)} (expected 0.1)`);
  }
  if (!c.agent?.name || !c.agent.id) throw new Error("agent.id and agent.name are required");
  if (!c.capabilities?.primary_purpose) throw new Error("capabilities.primary_purpose is required");
  if (!Array.isArray(c.capabilities.models_used) || c.capabilities.models_used.length === 0) {
    throw new Error("capabilities.models_used must be a non-empty array");
  }
}

/** Convert an Agent Card to a target runtime's config (or a markdown briefing). */
export function convert(card: unknown, target: RuntimeTarget): unknown {
  assertCard(card);
  switch (target) {
    case "openai":
      return toOpenAI(card);
    case "anthropic":
      return toAnthropic(card);
    case "vercel":
      return toVercel(card);
    case "markdown":
      return toMarkdown(card);
    default: {
      const exhaustive: never = target;
      throw new Error(`unknown target: ${String(exhaustive)}`);
    }
  }
}
