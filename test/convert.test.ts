import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, it, expect } from "vitest";

import { convert } from "../src/convert.js";
import {
  toOpenAI,
  toAnthropic,
  toVercel,
  toMarkdown,
  pickModel,
  renderSystemPrompt
} from "../src/adapters.js";
import * as api from "../src/index.js";
import type { AgentCard } from "../src/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const card = (): AgentCard =>
  JSON.parse(readFileSync(join(here, "..", "fixtures", "customer-support-agent.json"), "utf8"));

describe("pickModel", () => {
  it("prefers the planner role", () => {
    expect(pickModel(card().capabilities.models_used)).toBe("claude-sonnet-4-6");
  });
  it("falls back to the first when no planner", () => {
    expect(pickModel([{ name: "m1" }, { name: "m2" }])).toBe("m1");
  });
  it("returns empty string for an empty list", () => {
    expect(pickModel([])).toBe("");
  });
});

describe("renderSystemPrompt", () => {
  const s = renderSystemPrompt(card());
  it("names the agent and its purpose", () => {
    expect(s).toContain("ACME Support Agent");
    expect(s).toContain("billing, refunds, and account status");
  });
  it("includes autonomy + memory + refusals", () => {
    expect(s).toContain("Autonomy level: supervised");
    expect(s).toContain("Memory: session");
    expect(s).toContain("- out_of_scope");
  });
});

describe("toOpenAI", () => {
  const out = toOpenAI(card());
  it("uses Assistants shape with model + tools", () => {
    expect(out.name).toBe("ACME Support Agent");
    expect(out.model).toBe("claude-sonnet-4-6");
    expect(out.tools).toHaveLength(2);
    expect(out.tools[0]!.type).toBe("function");
  });
  it("carries agent_card_version + autonomy metadata", () => {
    expect(out.metadata.agent_card_version).toBe("0.1");
    expect(out.metadata.autonomy_level).toBe("supervised");
  });
});

describe("toAnthropic / toVercel", () => {
  it("anthropic emits model + system + metadata", () => {
    const out = toAnthropic(card());
    expect(out.model).toBe("claude-sonnet-4-6");
    expect(out.system).toContain("ACME Support Agent");
    expect(out.metadata.agent_id).toBe("acme-support");
  });
  it("vercel keys tools by name", () => {
    const out = toVercel(card());
    expect(Object.keys(out.tools).sort()).toEqual(["issue_refund", "lookup_invoice"]);
    expect(out.tools["issue_refund"]!.description).toContain("refund");
  });
});

describe("toMarkdown", () => {
  const md = toMarkdown(card());
  it("starts with a heading and lists models + tools + refusals", () => {
    expect(md).toMatch(/^# ACME Support Agent/);
    expect(md).toContain("## Models");
    expect(md).toContain("`claude-sonnet-4-6`");
    expect(md).toContain("## Tools");
    expect(md).toContain("## Refusal taxonomy");
    expect(md).toContain("out_of_scope");
  });
});

describe("convert + validation", () => {
  it("dispatches all targets", () => {
    for (const t of api.TARGETS) {
      const out = convert(card(), t);
      expect(out).toBeTruthy();
    }
  });
  it("rejects a non-object card", () => {
    expect(() => convert(null, "openai")).toThrow(/must be an object/);
  });
  it("rejects an unsupported card version", () => {
    expect(() => convert({ ...card(), agent_card_version: "0.2" as "0.1" }, "openai")).toThrow(/agent_card_version/);
  });
  it("rejects a card missing required fields", () => {
    const bad = card();
    (bad as unknown as { capabilities: { models_used: unknown[] } }).capabilities.models_used = [];
    expect(() => convert(bad, "openai")).toThrow(/models_used/);
  });
});

describe("minimal card (covers optional-field fallbacks)", () => {
  const minimal: AgentCard = {
    agent_card_version: "0.1",
    agent: {
      id: "bare",
      name: "Bare Agent",
      version: "0.1.0",
      provider: "nobody",
      description: "A minimal agent."
    },
    capabilities: {
      primary_purpose: "do one thing",
      models_used: [{ name: "m1" }]
      // no tools, no autonomy_level, no memory_persistence, no max_context_tokens
    }
    // no refusal_taxonomy, no deployment, no safety_posture
  };

  it("defaults autonomy + memory in the system prompt", () => {
    const s = renderSystemPrompt(minimal);
    expect(s).toContain("Autonomy level: supervised");
    expect(s).toContain("Memory: session");
    expect(s).not.toContain("Refuse the following");
  });

  it("toOpenAI emits zero tools when none declared", () => {
    expect(toOpenAI(minimal).tools).toEqual([]);
  });

  it("toMarkdown skips Tools and Refusal sections when absent", () => {
    const md = toMarkdown(minimal);
    expect(md).not.toContain("## Tools");
    expect(md).not.toContain("## Refusal taxonomy");
    expect(md).toContain("**Max context:** —");
  });

  it("filters tool entries without a name and defaults missing descriptions", () => {
    const card2: AgentCard = {
      ...minimal,
      capabilities: {
        ...minimal.capabilities,
        tools: [
          { name: "" } as unknown as { name?: string },
          { name: "named_only" }
        ]
      }
    };
    const out = toOpenAI(card2);
    expect(out.tools).toHaveLength(1);
    expect(out.tools[0]!.function.description).toBe("tool named_only");
  });
});

describe("public API", () => {
  it("re-exports surface and TARGETS", () => {
    expect(typeof api.convert).toBe("function");
    expect(api.TARGETS).toEqual(["openai", "anthropic", "vercel", "markdown"]);
  });
});
