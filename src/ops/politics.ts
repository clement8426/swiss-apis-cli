import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const CKAN_BASE = "https://ckan.opendata.swiss/api/3/action";
const PARLDATA_BASE = "https://api.openparldata.ch";

export const politicsTools: CliTool[] = [
  {
    name: "swiss_parliament_search",
    description: "Search Swiss parliamentary business via OpenParlData (fallback: CKAN).",
    input: {
      query: z.string(),
      parliament: z.string().optional(),
      limit: z.number().int().default(10),
    },
    run: async (args) => {
      const params: Record<string, unknown> = { q: args.query, limit: args.limit };
      if (args.parliament) params.parliament = args.parliament;
      try {
        const resp = await axios.get(`${PARLDATA_BASE}/business`, { params });
        return JSON.stringify(resp.data, null, 2);
      } catch {
        const resp2 = await axios.get(`${CKAN_BASE}/package_search`, {
          params: {
            q: args.query,
            fq: "organization:schweizerische-bundesversammlung",
            rows: args.limit,
          },
        });
        return JSON.stringify(
          {
            note: "OpenParlData API: https://api.openparldata.ch/documentation | GUI: https://openparldata.ch/searchservice",
            fallback_results: resp2.data.result?.results?.map((d: any) => ({
              title: d.title?.fr || d.title?.de,
              urls: d.resources?.map((r: any) => r.url),
            })),
          },
          null,
          2
        );
      }
    },
  },
  {
    name: "swiss_parliament_persons",
    description: "Parliament members via OpenParlData.",
    input: {
      parliament: z.string().default("ch"),
      limit: z.number().int().default(20),
    },
    run: async (args) => {
      try {
        const resp = await axios.get(`${PARLDATA_BASE}/persons`, {
          params: { parliament: args.parliament, limit: args.limit },
        });
        return JSON.stringify(resp.data, null, 2);
      } catch {
        return JSON.stringify(
          {
            api_docs: "https://api.openparldata.ch/documentation",
            github: "https://github.com/OpendataCH/OpenParlDataCH",
            note: "Covers 78 national, cantonal, and municipal parliaments in Switzerland and Liechtenstein",
          },
          null,
          2
        );
      }
    },
  },
  {
    name: "swiss_federal_law_search",
    description: "Search Swiss federal legislation via Fedlex SPARQL.",
    input: { query: z.string() },
    run: async (args) => {
      const query = args.query as string;
      const sparql = `
        SELECT ?uri ?title ?shortTitle ?date WHERE {
          ?uri a <https://fedlex.data.admin.ch/vocabulary/legal-taxonomy/in-force> .
          ?uri <http://www.w3.org/2000/01/rdf-schema#label> ?title .
          FILTER(LANG(?title) = "fr")
          FILTER(CONTAINS(LCASE(?title), LCASE("${query}")))
        } LIMIT 10
      `;
      try {
        const resp = await axios.get("https://fedlex.data.admin.ch/sparqlendpoint", {
          params: { query: sparql, format: "json" },
        });
        return JSON.stringify(resp.data?.results?.bindings, null, 2);
      } catch {
        return JSON.stringify(
          {
            note: "Fedlex — Swiss federal law platform",
            portal: "https://www.fedlex.admin.ch/",
            sparql_endpoint: "https://fedlex.data.admin.ch/sparqlendpoint",
            search_hint: `Try searching on https://www.fedlex.admin.ch for: ${query}`,
          },
          null,
          2
        );
      }
    },
  },
];
