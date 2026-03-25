import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const CKAN_BASE = "https://ckan.opendata.swiss/api/3/action";

export const statisticsTools: CliTool[] = [
  {
    name: "swiss_statistics_search",
    description: "Search BFS/OFS datasets on opendata.swiss.",
    input: {
      query: z.string(),
      rows: z.number().int().default(10),
    },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: { q: args.query, fq: "organization:bundesamt-fur-statistik-bfs", rows: args.rows },
      });
      const datasets = resp.data.result?.results?.map((d: any) => ({
        title: d.title?.fr || d.title?.de,
        name: d.name,
        description: d.notes?.fr?.substring(0, 250),
        formats: [...new Set(d.resources?.map((r: any) => r.format))],
        urls: d.resources?.slice(0, 2).map((r: any) => r.url),
      }));
      return JSON.stringify({ total: resp.data.result?.count, datasets }, null, 2);
    },
  },
  {
    name: "swiss_snb_financial_data",
    description: "SNB-related datasets on opendata.swiss.",
    input: { query: z.string() },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: { q: args.query, fq: "organization:schweizerische-nationalbank-snb", rows: 5 },
      });
      return JSON.stringify(
        {
          note: "Swiss National Bank data portal: https://data.snb.ch/",
          api_endpoint: "https://data.snb.ch/api",
          datasets: resp.data.result?.results?.map((d: any) => ({
            title: d.title?.fr || d.title?.de,
            urls: d.resources?.map((r: any) => r.url),
          })),
        },
        null,
        2
      );
    },
  },
  {
    name: "swiss_postal_data",
    description: "Swiss postal data via OpenPLZ API.",
    input: {
      postal_code: z.string().optional(),
      municipality: z.string().optional(),
      canton: z.string().optional(),
    },
    run: async (args) => {
      const base = "https://openplzapi.org/ch";
      if (args.postal_code) {
        const resp = await axios.get(`${base}/Localities`, { params: { postalCode: args.postal_code } });
        return JSON.stringify(resp.data, null, 2);
      }
      if (args.municipality) {
        const resp = await axios.get(`${base}/Localities`, { params: { name: args.municipality } });
        return JSON.stringify(resp.data, null, 2);
      }
      return JSON.stringify(
        {
          note: "OpenPLZ API — Swiss postal codes, localities, cantons. Free, no auth.",
          api_base: "https://openplzapi.org/ch",
          endpoints: {
            localities: "GET /ch/Localities?postalCode=1201",
            cantons: "GET /ch/Cantons",
            streets: "GET /ch/Streets?name=Rue+de+Rive&postalCode=1204",
          },
          docs: "https://www.openplzapi.org/en/switzerland/",
        },
        null,
        2
      );
    },
  },
  {
    name: "swiss_migration_statistics",
    description: "SEM migration datasets on opendata.swiss.",
    input: { query: z.string().default("migration asylum population") },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: { q: args.query, fq: "organization:staatssekretariat-fur-migration-sem", rows: 5 },
      });
      return JSON.stringify(
        {
          note: "SEM stats portal: https://www.sem.admin.ch/sem/de/home/publiservice/statistik.html",
          datasets: resp.data.result?.results?.map((d: any) => ({
            title: d.title?.fr || d.title?.de,
            urls: d.resources?.map((r: any) => r.url),
          })),
        },
        null,
        2
      );
    },
  },
];
