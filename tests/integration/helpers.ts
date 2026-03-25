import { invokeCliTool } from "../../src/registry.js";

/** Parse JSON returned by tools that respond with an object or array. */
export async function invokeJson<T = unknown>(
  name: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const text = await invokeCliTool(name, args);
  const t = text.trim();
  if (!t.startsWith("{") && !t.startsWith("[")) {
    throw new Error(`${name}: expected JSON, got: ${t.slice(0, 160)}`);
  }
  return JSON.parse(text) as T;
}

/** Raw string result (e.g. GTFS message or error hint). */
export async function invokeText(
  name: string,
  args: Record<string, unknown> = {}
): Promise<string> {
  return invokeCliTool(name, args);
}
