#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import {
  listToolSummaries,
  getToolInputJsonSchema,
  invokeCliTool,
} from "./registry.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf-8").trim();
}

async function parseCallArgs(jsonArg: string | undefined): Promise<Record<string, unknown>> {
  if (jsonArg === undefined || jsonArg === "") return {};
  if (jsonArg === "-") {
    const raw = await readStdin();
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  }
  if (jsonArg.startsWith("@")) {
    const p = jsonArg.slice(1);
    const raw = await readFile(p, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  }
  return JSON.parse(jsonArg) as Record<string, unknown>;
}

function printOutput(text: string, raw: boolean, asJson: boolean) {
  if (asJson) {
    console.log(JSON.stringify({ text }, null, 2));
    return;
  }
  console.log(text);
}

const program = new Command();

program
  .name("swiss")
  .description(
    "Swiss public APIs from the terminal — standalone CLI (no MCP). Same-style commands as swiss-apis-mcp."
  )
  .version("1.0.0");

program
  .command("list")
  .description("List all commands")
  .option("--json", "JSON output", false)
  .action((opts) => {
    const tools = listToolSummaries();
    if (opts.json) console.log(JSON.stringify(tools, null, 2));
    else {
      for (const t of tools) {
        console.log(`${t.name}\n  ${t.description.split("\n")[0]}`);
      }
    }
  });

program
  .command("info")
  .description("Show description and JSON Schema for arguments")
  .argument("<tool>", "Command name")
  .option("--json", "Full schema as single JSON object", false)
  .action((tool: string, opts) => {
    const tools = listToolSummaries();
    const meta = tools.find((x) => x.name === tool);
    if (!meta) {
      console.error(`Unknown tool: ${tool}`);
      process.exitCode = 1;
      return;
    }
    const schema = getToolInputJsonSchema(tool);
    if (opts.json) console.log(JSON.stringify({ ...meta, inputSchema: schema }, null, 2));
    else {
      console.log(meta.name);
      console.log();
      console.log(meta.description);
      if (schema && Object.keys(schema as object).length > 0) {
        console.log();
        console.log("Input schema:");
        console.log(JSON.stringify(schema, null, 2));
      }
    }
  });

program
  .command("call")
  .description("Run a command with JSON arguments")
  .argument("<tool>", "Command name")
  .argument("[args]", 'JSON object, @file.json, or "-" for stdin')
  .option("-r, --raw", "Alias for default text output", false)
  .option("--json", "Wrap result in JSON { text }", false)
  .action(async (tool: string, args: string | undefined, opts) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = await parseCallArgs(args);
    } catch (e) {
      console.error("Invalid JSON:", e instanceof Error ? e.message : e);
      process.exitCode = 1;
      return;
    }
    try {
      const text = await invokeCliTool(tool, parsed);
      printOutput(text, opts.raw, opts.json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      process.exitCode = 1;
    }
  });

program
  .command("doctor")
  .description("Run swiss_check_setup (API key status for this CLI)")
  .option("--json", "JSON wrapper", false)
  .action(async (opts) => {
    try {
      const text = await invokeCliTool("swiss_check_setup", {});
      printOutput(text, false, opts.json);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
    }
  });

program.parse();
