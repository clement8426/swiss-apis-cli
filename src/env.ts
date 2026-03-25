import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";

/** CLI-only config directory (not shared with swiss-apis-mcp). */
const KEYS_DIR = path.join(os.homedir(), ".swiss-apis-cli");
const KEYS_FILE = path.join(KEYS_DIR, "keys");

export function loadStoredKeys(): Record<string, string> {
  if (!fs.existsSync(KEYS_FILE)) return {};
  const stored: Record<string, string> = {};
  for (const line of fs.readFileSync(KEYS_FILE, "utf-8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key && val) stored[key] = val;
    }
  }
  return stored;
}

export function persistKey(name: string, value: string): void {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  process.env[name] = value;
  const stored = loadStoredKeys();
  stored[name] = value;
  const content = Object.entries(stored).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  fs.writeFileSync(KEYS_FILE, content, { mode: 0o600 });
}

/** `.env` in current working directory + optional keys file under ~/.swiss-apis-cli/keys */
export function bootstrapCliEnv(): void {
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });
  for (const [k, v] of Object.entries(loadStoredKeys())) {
    if (!process.env[k]) process.env[k] = v;
  }
}

export const KEYS_FILE_PATH = KEYS_FILE;
