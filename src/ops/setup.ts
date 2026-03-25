import { z } from "zod";
import type { CliTool } from "../types.js";
import { persistKey, KEYS_FILE_PATH } from "../env.js";

const KNOWN_KEYS = {
  OTD_API_KEY: "opentransportdata.swiss — GTFS real-time (trains/buses)",
  ZEFIX_USER: "zefix.admin.ch — Swiss commercial register (username)",
  ZEFIX_PASS: "zefix.admin.ch — Swiss commercial register (password)",
  FOODREPO_API_KEY: "foodrepo.org — Swiss barcoded food products (EPFL)",
} as const;

const REGISTRATION_URLS: Record<string, string> = {
  OTD_API_KEY: "https://api-manager.opentransportdata.swiss/",
  ZEFIX_USER: "https://www.zefix.admin.ch",
  ZEFIX_PASS: "https://www.zefix.admin.ch",
  FOODREPO_API_KEY: "https://www.foodrepo.org/en/users/sign_up",
};

export const setupTools: CliTool[] = [
  {
    name: "swiss_check_setup",
    description:
      "Check which optional API keys are configured. Call this first to know which Swiss API tools are fully operational and which need a free API key.",
    input: {},
    run: async () => {
      const status: Record<string, object> = {};
      for (const [key, description] of Object.entries(KNOWN_KEYS)) {
        const isSet = !!(process.env[key] && process.env[key]!.trim().length > 0);
        status[key] = {
          configured: isSet,
          description,
          register_url: isSet ? undefined : REGISTRATION_URLS[key],
        };
      }
      const allOk = Object.values(status).every((s: any) => s.configured);
      const missingKeys = Object.entries(status)
        .filter(([, s]: any) => !s.configured)
        .map(([k]) => k);
      return JSON.stringify(
        {
          all_configured: allOk,
          missing_keys: missingKeys,
          note: allOk
            ? "All API keys are set. Every tool is fully operational."
            : `${missingKeys.length} optional key(s) missing. Tools requiring them will return setup instructions. Use swiss_set_api_key to configure them.`,
          keys: status,
        },
        null,
        2
      );
    },
  },
  {
    name: "swiss_set_api_key",
    description:
      "Store an optional API key. Keys are saved under ~/.swiss-apis-cli/keys and apply immediately for this CLI only.",
    input: {
      key_name: z.enum(["OTD_API_KEY", "ZEFIX_USER", "ZEFIX_PASS", "FOODREPO_API_KEY"]),
      value: z.string().min(1),
    },
    run: async (args) => {
      const key_name = args.key_name as keyof typeof KNOWN_KEYS;
      const value = args.value as string;
      persistKey(key_name, value);
      return JSON.stringify(
        {
          success: true,
          key: key_name,
          message: `${key_name} has been saved and is active immediately (swiss-apis-cli only).`,
          stored_at: KEYS_FILE_PATH,
        },
        null,
        2
      );
    },
  },
];
