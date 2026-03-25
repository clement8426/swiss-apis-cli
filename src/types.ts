import type { ZodRawShape } from "zod";

/** One callable Swiss API command (mirrors MCP tool names; implementation lives only in this package). */
export type CliTool = {
  name: string;
  description: string;
  input: ZodRawShape;
  run: (args: Record<string, unknown>) => Promise<string>;
};
