import type {
  AgentCard,
  AnthropicConfig,
  ModelUse,
  OpenAIAssistantConfig,
  VercelAgentConfig
} from "./types.js";

/** Pick a model id for runtime use: prefer the "planner" role, else the first. */
export function pickModel(models: ModelUse[]): string {
  const planner = models.find((m) => m.role === "planner");
  return (planner ?? models[0])?.name ?? "";
}

/** Render a system prompt from the card's purpose + autonomy + refusals. */
export function renderSystemPrompt(card: AgentCard): string {
  const a = card.agent;
  const c = card.capabilities;
  const refusals = (card.refusal_taxonomy ?? [])
    .map((r) => `- ${r.category}${r.description ? `: ${r.description}` : ""}`)
    .join("\n");
  return [
    `You are ${a.name} (version ${a.version}) by ${a.provider}.`,
    a.description,
    "",
    `Primary purpose: ${c.primary_purpose}`,
    `Autonomy level: ${c.autonomy_level ?? "supervised"}.`,
    `Memory: ${c.memory_persistence ?? "session"}.`,
    refusals && "Refuse the following categories:",
    refusals
  ]
    .filter(Boolean)
    .join("\n");
}

const meta = (card: AgentCard): Record<string, string> => ({
  agent_card_version: card.agent_card_version,
  agent_id: card.agent.id,
  agent_version: card.agent.version,
  autonomy_level: card.capabilities.autonomy_level ?? "supervised"
});

const toolEntries = (card: AgentCard): Array<{ name: string; description: string }> =>
  (card.capabilities.tools ?? [])
    .filter((t): t is { name: string; description?: string } => typeof t?.name === "string" && t.name.length > 0)
    .map((t) => ({ name: t.name, description: (t.description ?? "").trim() || `tool ${t.name}` }));

export function toOpenAI(card: AgentCard): OpenAIAssistantConfig {
  return {
    name: card.agent.name,
    model: pickModel(card.capabilities.models_used),
    instructions: renderSystemPrompt(card),
    tools: toolEntries(card).map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description }
    })),
    metadata: meta(card)
  };
}

export function toAnthropic(card: AgentCard): AnthropicConfig {
  return {
    model: pickModel(card.capabilities.models_used),
    system: renderSystemPrompt(card),
    metadata: meta(card)
  };
}

export function toVercel(card: AgentCard): VercelAgentConfig {
  const tools: Record<string, { description: string }> = {};
  for (const t of toolEntries(card)) tools[t.name] = { description: t.description };
  return {
    model: pickModel(card.capabilities.models_used),
    system: renderSystemPrompt(card),
    tools,
    metadata: meta(card)
  };
}

export function toMarkdown(card: AgentCard): string {
  const a = card.agent;
  const c = card.capabilities;
  const lines: string[] = [
    `# ${a.name} — agent briefing`,
    "",
    `**Provider:** ${a.provider}  `,
    `**Version:** ${a.version}  `,
    `**Card version:** ${card.agent_card_version}  `,
    `**Autonomy:** ${c.autonomy_level ?? "supervised"}  `,
    `**Memory:** ${c.memory_persistence ?? "session"}  `,
    `**Max context:** ${c.max_context_tokens ?? "—"}`,
    "",
    `## Purpose`,
    c.primary_purpose,
    "",
    `## Description`,
    a.description,
    "",
    `## Models`,
    ...c.models_used.map((m) => `- \`${m.name}\`${m.role ? ` (${m.role})` : ""}${m.provider ? ` — ${m.provider}` : ""}`)
  ];
  const tools = toolEntries(card);
  if (tools.length > 0) {
    lines.push("", "## Tools", ...tools.map((t) => `- \`${t.name}\` — ${t.description}`));
  }
  const refusals = card.refusal_taxonomy ?? [];
  if (refusals.length > 0) {
    lines.push("", "## Refusal taxonomy", ...refusals.map((r) => `- **${r.category}**${r.description ? ` — ${r.description}` : ""}`));
  }
  return lines.join("\n");
}
