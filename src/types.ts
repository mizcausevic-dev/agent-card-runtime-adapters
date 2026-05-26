// Subset of the Agent Card schema (mizcausevic-dev/agent-cards-spec) — enough
// to drive runtime adapters. Unknown nested fields are passed through via
// permissive index types so adapters work even when consumers extend the card.

export type AutonomyLevel = "assistive" | "supervised" | "autonomous";
export type MemoryPersistence = "none" | "session" | "persistent";

export interface AgentCardAgent {
  id: string;
  name: string;
  version: string;
  provider: string;
  description: string;
  homepage?: string;
}

export interface ModelUse {
  name: string;
  provider?: string;
  role?: "planner" | "executor" | "critic" | "router" | "judge";
}

export interface AgentCardCapabilities {
  primary_purpose: string;
  models_used: ModelUse[];
  tools?: Array<{ name?: string; description?: string; [k: string]: unknown }>;
  max_context_tokens?: number;
  memory_persistence?: MemoryPersistence;
  autonomy_level?: AutonomyLevel;
  prompts_used?: string[];
}

export interface RefusalCategory {
  category: string;
  description?: string;
  [k: string]: unknown;
}

export interface AgentCard {
  agent_card_version: "0.1";
  agent: AgentCardAgent;
  capabilities: AgentCardCapabilities;
  refusal_taxonomy?: RefusalCategory[];
  evaluations?: unknown[];
  deployment?: Record<string, unknown>;
  safety_posture?: Record<string, unknown>;
}

export type RuntimeTarget = "openai" | "anthropic" | "vercel" | "markdown";
export const TARGETS: RuntimeTarget[] = ["openai", "anthropic", "vercel", "markdown"];

/** OpenAI Assistants API create-payload subset. */
export interface OpenAIAssistantConfig {
  name: string;
  model: string;
  instructions: string;
  tools: Array<{ type: "function"; function: { name: string; description: string } }>;
  metadata: Record<string, string>;
}

/** Anthropic Messages bundle (system prompt + model). */
export interface AnthropicConfig {
  model: string;
  system: string;
  metadata: Record<string, string>;
}

/** Vercel AI SDK initial agent config. */
export interface VercelAgentConfig {
  model: string;
  system: string;
  tools: Record<string, { description: string }>;
  metadata: Record<string, string>;
}
