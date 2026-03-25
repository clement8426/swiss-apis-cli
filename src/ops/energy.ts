import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const CKAN_BASE = "https://ckan.opendata.swiss/api/3/action";

export const energyTools: CliTool[] = [
  {
    name: "swiss_energy_search_datasets",
    description: "Search SFOE energy datasets on opendata.swiss.",
    input: {
      query: z.string(),
      rows: z.number().int().default(10),
    },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: { q: args.query, fq: "organization:bundesamt-fur-energie-bfe", rows: args.rows },
      });
      const datasets = resp.data.result?.results?.map((d: any) => ({
        title: d.title?.fr || d.title?.de,
        name: d.name,
        formats: [...new Set(d.resources?.map((r: any) => r.format))],
        urls: d.resources?.slice(0, 2).map((r: any) => r.url),
      }));
      return JSON.stringify(
        {
          note: "SFOE data — includes charging stations, hydropower stats (WASTA), etc.",
          datasets,
        },
        null,
        2
      );
    },
  },
  {
    name: "swiss_grid_energy_data",
    description: "Swissgrid-related datasets on opendata.swiss.",
    input: { query: z.string().default("energy grid") },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: { q: args.query, fq: "organization:swissgrid-ag", rows: 5 },
      });
      return JSON.stringify(
        {
          note: "Swissgrid energy data portal: https://www.swissgrid.ch/de/home/customers/topics/energy-data-ch.html",
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
