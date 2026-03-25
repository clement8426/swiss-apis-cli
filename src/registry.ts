import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { bootstrapCliEnv } from "./env.js";
import type { CliTool } from "./types.js";
import { setupTools } from "./ops/setup.js";
import { transportTools } from "./ops/transport.js";
import { geoTools } from "./ops/geo.js";
import { healthTools } from "./ops/health.js";
import { politicsTools } from "./ops/politics.js";
import { businessTools } from "./ops/business.js";
import { energyTools } from "./ops/energy.js";
import { weatherTools } from "./ops/weather.js";
import { foodTools } from "./ops/food.js";
import { statisticsTools } from "./ops/statistics.js";

let envReady = false;

function ensureEnv(): void {
  if (!envReady) {
    bootstrapCliEnv();
    envReady = true;
  }
}

export const allCliTools: CliTool[] = [
  ...setupTools,
  ...transportTools,
  ...geoTools,
  ...healthTools,
  ...politicsTools,
  ...businessTools,
  ...energyTools,
  ...weatherTools,
  ...foodTools,
  ...statisticsTools,
];

const byName = new Map(allCliTools.map((t) => [t.name, t]));

export type ToolSummary = { name: string; description: string };

export function listToolSummaries(): ToolSummary[] {
  ensureEnv();
  return allCliTools.map((t) => ({ name: t.name, description: t.description }));
}

export function getToolInputJsonSchema(name: string): object | null {
  ensureEnv();
  const t = byName.get(name);
  if (!t) return null;
  return zodToJsonSchema(z.object(t.input), {
    name: `${name}_input`,
    $refStrategy: "none",
  }) as object;
}

export async function invokeCliTool(name: string, rawArgs: unknown): Promise<string> {
  ensureEnv();
  const t = byName.get(name);
  if (!t) throw new Error(`Unknown tool: ${name}`);
  const parsed = z.object(t.input).parse(rawArgs ?? {});
  return t.run(parsed as Record<string, unknown>);
}
