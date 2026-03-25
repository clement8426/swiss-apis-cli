import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const CKAN_BASE = "https://ckan.opendata.swiss/api/3/action";
const HYDRO_BASE = "https://www.hydrodaten.admin.ch";

export const weatherTools: CliTool[] = [
  {
    name: "swiss_weather_search_meteoswiss",
    description: "Search MeteoSwiss open datasets on opendata.swiss.",
    input: {
      query: z.string(),
      rows: z.number().int().default(10),
    },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: {
          q: args.query,
          fq: "organization:bundesamt-fur-meteorologie-und-klimatologie-meteoschweiz",
          rows: args.rows,
        },
      });
      const datasets = resp.data.result?.results?.map((d: any) => ({
        title: d.title?.fr || d.title?.de,
        name: d.name,
        formats: [...new Set(d.resources?.map((r: any) => r.format))],
        urls: d.resources?.slice(0, 3).map((r: any) => r.url),
      }));
      return JSON.stringify(
        {
          note: "MeteoSwiss OGD: https://www.meteoswiss.admin.ch/services-and-publications/service/open-data.html",
          datasets,
        },
        null,
        2
      );
    },
  },
  {
    name: "swiss_avalanche_data",
    description: "SLF / avalanche datasets on opendata.swiss.",
    input: { query: z.string().default("avalanche snow") },
    run: async (args) => {
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: { q: args.query, fq: "organization:slf-wsl", rows: 5 },
      });
      return JSON.stringify(
        {
          note: "SLF Data Service: https://www.slf.ch/en/services-and-products/slf-data-service/",
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
    name: "swiss_hydro_data",
    description: "Hydrological data from hydrodaten.admin.ch.",
    input: { station_id: z.string().optional() },
    run: async (args) => {
      if (args.station_id) {
        const resp = await axios.get(`${HYDRO_BASE}/de/zustand/messdaten/messdaten.json`, {
          params: { station: args.station_id },
        });
        return JSON.stringify(resp.data, null, 2);
      }
      return JSON.stringify(
        {
          note: "Swiss hydrological data from BAFU",
          portal: "https://www.hydrodaten.admin.ch/",
          lindas_endpoint: "https://environment.ld.admin.ch/.well-known/void/dataset/hydro",
          usage: "Provide a station_id to get specific measurements",
        },
        null,
        2
      );
    },
  },
];
