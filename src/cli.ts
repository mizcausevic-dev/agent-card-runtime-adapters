#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { convert } from "./convert.js";
import { TARGETS, type RuntimeTarget } from "./types.js";

interface Args {
  source?: string;
  target: RuntimeTarget;
  out?: string;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { target: "openai", help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--target") {
      const v = argv[++i] as RuntimeTarget;
      if (!TARGETS.includes(v)) throw new Error(`--target must be one of: ${TARGETS.join(", ")}`);
      args.target = v;
    } else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("-")) args.source = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `agent-card-runtime-adapters — convert a Kinetic Gain Agent Card into a runtime config

Usage:
  agent-card-adapt <agent-card.json> --target <runtime> [--out <file>]

Options:
  --target <runtime>   openai | anthropic | vercel | markdown   (default openai)
  --out <file>         Write the adapted output to a file (default: stdout).
  -h, --help           Show this help.

openai/anthropic/vercel emit JSON; markdown emits a human-readable briefing.
Exit codes: 0 ok, 2 usage/IO error.`;

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.source) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }
  let output: string;
  try {
    const card = JSON.parse(readFileSync(args.source, "utf8")) as unknown;
    const result = convert(card, args.target);
    output = typeof result === "string" ? result : JSON.stringify(result, null, 2);
  } catch (e) {
    process.stderr.write(`error: ${(e as Error).message}\n`);
    return 2;
  }
  if (args.out) {
    writeFileSync(args.out, `${output}\n`, "utf8");
    process.stdout.write(`wrote ${args.target} output to ${args.out}\n`);
  } else {
    process.stdout.write(`${output}\n`);
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  process.exit(run(process.argv.slice(2)));
}
