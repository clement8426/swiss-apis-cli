import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const ZEFIX_BASE = "https://www.zefix.admin.ch/ZefixPublicREST/api/v1";
const CKAN_BASE = "https://ckan.opendata.swiss/api/3/action";

export const businessTools: CliTool[] = [
  {
    name: "swiss_company_search",
    description: "Search ZEFIX (requires ZEFIX_USER / ZEFIX_PASS).",
    input: {
      name: z.string(),
      canton: z.string().optional(),
      active_only: z.boolean().default(true),
      max_results: z.number().int().default(20),
    },
    run: async (args) => {
      const user = process.env.ZEFIX_USER;
      const pass = process.env.ZEFIX_PASS;
      if (!user || !pass) {
        return "ZEFIX_USER and ZEFIX_PASS not set. Register free at: https://www.zefix.admin.ch\nSwagger: https://www.zefix.admin.ch/ZefixPublicREST/swagger-ui/index.html";
      }
      const body: Record<string, unknown> = {
        name: args.name,
        activeOnly: args.active_only,
        maxEntries: args.max_results,
      };
      if (args.canton) body.canton = args.canton;
      const resp = await axios.post(`${ZEFIX_BASE}/company/search`, body, {
        auth: { username: user, password: pass },
        headers: { "Content-Type": "application/json" },
      });
      const companies = resp.data.list?.map((c: any) => ({
        name: c.name,
        uid: c.uid,
        chid: c.chid,
        legal_form: c.legalForm?.nameFr || c.legalForm?.nameDe,
        canton: c.canton,
        address: c.address,
        status: c.status,
        purpose: c.purpose,
      }));
      return JSON.stringify(companies, null, 2);
    },
  },
  {
    name: "swiss_company_by_uid",
    description: "Company details by UID (ZEFIX credentials required).",
    input: { uid: z.string() },
    run: async (args) => {
      const user = process.env.ZEFIX_USER;
      const pass = process.env.ZEFIX_PASS;
      if (!user || !pass) return "Set ZEFIX_USER and ZEFIX_PASS env vars.";
      const uid = args.uid as string;
      const cleanUid = uid.replace(/[.\-]/g, "").replace("CHE", "CHE-");
      const resp = await axios.get(`${ZEFIX_BASE}/company/uid/${cleanUid}`, {
        auth: { username: user, password: pass },
      });
      return JSON.stringify(resp.data, null, 2);
    },
  },
  {
    name: "swiss_company_publications",
    description: "SOGC publications for a company (ZEFIX credentials required).",
    input: { uid: z.string() },
    run: async (args) => {
      const user = process.env.ZEFIX_USER;
      const pass = process.env.ZEFIX_PASS;
      if (!user || !pass) return "Set ZEFIX_USER and ZEFIX_PASS env vars.";
      const resp = await axios.get(`${ZEFIX_BASE}/sogcpublication/uid/${args.uid}`, {
        auth: { username: user, password: pass },
      });
      return JSON.stringify(resp.data, null, 2);
    },
  },
  {
    name: "swiss_opendata_search_datasets",
    description: "Search opendata.swiss CKAN catalog.",
    input: {
      query: z.string(),
      organization: z.string().optional(),
      format: z.enum(["CSV", "JSON", "XML", "GeoJSON", "WMS", "WFS"]).optional(),
      rows: z.number().int().default(10),
    },
    run: async (args) => {
      const fq: string[] = [];
      if (args.organization) fq.push(`organization:${args.organization}`);
      if (args.format) fq.push(`res_format:${args.format}`);
      const resp = await axios.get(`${CKAN_BASE}/package_search`, {
        params: {
          q: args.query,
          fq: fq.join(" "),
          rows: args.rows,
          sort: "score desc",
        },
      });
      const datasets = resp.data.result?.results?.map((d: any) => ({
        title: d.title?.fr || d.title?.de || d.title?.en,
        name: d.name,
        organization: d.organization?.name,
        description: d.notes?.fr?.substring(0, 200),
        formats: d.resources?.map((r: any) => r.format).filter(Boolean),
        download_urls: d.resources?.slice(0, 3).map((r: any) => r.url),
        last_modified: d.metadata_modified,
      }));
      return JSON.stringify({ total: resp.data.result?.count, datasets }, null, 2);
    },
  },
];
