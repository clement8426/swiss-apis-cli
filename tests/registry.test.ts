import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  allCliTools,
  listToolSummaries,
  getToolInputJsonSchema,
  invokeCliTool,
} from "../src/registry.js";

describe("registry", () => {
  it("exposes 34 tools with unique names", () => {
    const names = allCliTools.map((t) => t.name);
    expect(names.length).toBe(34);
    expect(new Set(names).size).toBe(34);
  });

  it("listToolSummaries matches allCliTools", () => {
    const summaries = listToolSummaries();
    expect(summaries.length).toBe(34);
    expect(summaries[0]).toHaveProperty("name");
    expect(summaries[0]).toHaveProperty("description");
  });

  it("getToolInputJsonSchema returns an object for a known tool", () => {
    const schema = getToolInputJsonSchema("swiss_transport_stationboard");
    expect(schema).not.toBeNull();
    expect(typeof schema).toBe("object");
  });

  it("getToolInputJsonSchema returns null for unknown tool", () => {
    expect(getToolInputJsonSchema("nonexistent_tool_xyz")).toBeNull();
  });

  it("invokeCliTool runs swiss_check_setup and returns valid JSON", async () => {
    const text = await invokeCliTool("swiss_check_setup", {});
    const data = JSON.parse(text) as { all_configured: boolean; keys: Record<string, unknown> };
    expect(typeof data.all_configured).toBe("boolean");
    expect(data.keys).toBeDefined();
    expect(data.keys.OTD_API_KEY).toBeDefined();
  });

  it("invokeCliTool rejects invalid arguments", async () => {
    await expect(
      invokeCliTool("swiss_transport_stationboard", { station: 123 })
    ).rejects.toThrow(ZodError);
  });

  it("invokeCliTool throws for unknown tool", async () => {
    await expect(invokeCliTool("unknown_tool", {})).rejects.toThrow("Unknown tool");
  });
});
