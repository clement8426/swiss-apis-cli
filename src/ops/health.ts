import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const CKAN_BASE = "https://ckan.opendata.swiss/api/3/action";

export const healthTools: CliTool[] = [
  {
    name: "swiss_health_search_datasets",
    description:
      "Search BAG datasets on opendata.swiss (infectious diseases, hospitalizations, mortality, etc.).",
    input: {
      query: z.string(),
      rows: z.number().int().default(10),
    },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: {
          q: args.query,
          fq: "organization:bundesamt-fur-gesundheit-bag",
          rows: args.rows,
        },
      });
      const datasets = resp.data.result?.results?.map((d: any) => ({
        title: d.title?.fr || d.title?.de,
        name: d.name,
        description: d.notes?.fr?.substring(0, 300),
        formats: [...new Set(d.resources?.map((r: any) => r.format))],
        urls: d.resources?.slice(0, 2).map((r: any) => r.url),
      }));
      return JSON.stringify(datasets, null, 2);
    },
  },
  {
    name: "swiss_health_get_dataset",
    description: "Get metadata and download URLs for a BAG dataset by slug.",
    input: { dataset_slug: z.string() },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_show`, {
        params: { id: args.dataset_slug },
      });
      const d = resp.data.result;
      return JSON.stringify(
        {
          title: d.title,
          description: d.notes,
          resources: d.resources?.map((r: any) => ({
            name: r.name,
            format: r.format,
            url: r.url,
            last_modified: r.last_modified,
          })),
        },
        null,
        2
      );
    },
  },
  {
    name: "swiss_health_get_versorgungsatlas",
    description: "Swiss Health Atlas indicators (BAG) via opendata.swiss search.",
    input: { indicator: z.string() },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: {
          q: args.indicator,
          fq: "organization:bundesamt-fur-gesundheit-bag",
          rows: 5,
        },
      });
      return JSON.stringify(
        {
          note: "Data from Swiss Health Care Atlas (versorgungsatlas.ch)",
          source: "https://www.versorgungsatlas.ch/",
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
