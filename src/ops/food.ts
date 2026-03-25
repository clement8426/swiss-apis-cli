import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const FOODREPO_BASE = "https://www.foodrepo.org/api/v3";

export const foodTools: CliTool[] = [
  {
    name: "swiss_food_search_products",
    description: "FoodRepo product search (requires FOODREPO_API_KEY).",
    input: {
      query: z.string().optional(),
      barcode: z.string().optional(),
      page: z.number().int().default(1),
    },
    run: async (args) => {
      const apiKey = process.env.FOODREPO_API_KEY;
      if (!apiKey) {
        return "FOODREPO_API_KEY not set. Register free at: https://www.foodrepo.org/en/users/sign_up\nDocs: https://www.foodrepo.org/api-docs/swaggers/v3";
      }
      const params: Record<string, unknown> = { page: args.page };
      if (args.barcode) params.barcodes = args.barcode;
      const resp = await axios.get(`${FOODREPO_BASE}/products`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token token="${apiKey}"`,
        },
        params,
      });
      const products = resp.data.data?.map((p: any) => ({
        id: p.id,
        name_fr: p.display_name_translations?.fr,
        name_de: p.display_name_translations?.de,
        barcode: p.barcode,
        brands: p.brands,
        nutrients: p.nutrients,
        ingredients: p.ingredients_text_translations?.fr,
        image: p.images?.[0]?.medium?.url,
      }));
      return JSON.stringify(products, null, 2);
    },
  },
  {
    name: "swiss_food_nutrition_database",
    description: "Pointers to Swiss Food Composition Database (FSVO).",
    input: { query: z.string() },
    run: async (args) => {
      const query = args.query as string;
      return JSON.stringify(
        {
          note: "Swiss Food Composition Database (FSVO)",
          portal: "https://naehrwertdaten.ch/",
          api_info: "Download data at: https://naehrwertdaten.ch/de/downloads/",
          search_hint: `Search for '${query}' at https://naehrwertdaten.ch/de/naehrwertsuche/`,
        },
        null,
        2
      );
    },
  },
];
