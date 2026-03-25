import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const GEOADMIN_BASE = "https://api3.geo.admin.ch/rest/services";
const REFRAME_BASE = "https://geodesy.geo.admin.ch/reframe";
const WMTS_BASE = "https://wmts.geo.admin.ch/1.0.0";

export const geoTools: CliTool[] = [
  {
    name: "swiss_geo_search_location",
    description:
      "Search for any Swiss location: cities, addresses, communes, postal codes, points of interest.",
    input: {
      query: z.string(),
      types: z.array(z.enum(["locations", "featuresearch"])).default(["locations"]),
      limit: z.number().int().default(10),
      sr: z.enum(["4326", "2056", "21781"]).default("4326"),
    },
    run: async (args) => {
      const types = args.types as string[];
      const resp = await axios.get(`${GEOADMIN_BASE}/api/SearchServer`, {
        params: {
          type: types.join(","),
          searchText: args.query,
          limit: args.limit,
          sr: args.sr,
        },
      });
      return JSON.stringify(resp.data.results ?? [], null, 2);
    },
  },
  {
    name: "swiss_geo_get_elevation",
    description:
      "Get elevation (altitude in meters) for WGS84 coordinates using official swisstopo REFRAME.",
    input: { lat: z.number(), lng: z.number() },
    run: async (args) => {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const lv = await axios.get(`${REFRAME_BASE}/wgs84tolv95`, {
        params: { easting: lng, northing: lat, altitude: 0, format: "json" },
      });
      const { easting, northing } = lv.data;
      const heightResp = await axios.get("https://api3.geo.admin.ch/rest/services/height", {
        params: { easting, northing, sr: 2056 },
      });
      return JSON.stringify(
        { lat, lng, altitude_m: parseFloat(heightResp.data.height), system: "DHM25/DOM" },
        null,
        2
      );
    },
  },
  {
    name: "swiss_geo_identify_canton",
    description: "Identify which Swiss canton a coordinate belongs to.",
    input: { lat: z.number(), lng: z.number() },
    run: async (args) => {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const lv = await axios.get(`${REFRAME_BASE}/wgs84tolv95`, {
        params: { easting: lng, northing: lat, altitude: 0, format: "json" },
      });
      const { easting: e, northing: n } = lv.data;
      const resp = await axios.get(`${GEOADMIN_BASE}/all/MapServer/identify`, {
        params: {
          geometry: `${e},${n}`,
          geometryType: "esriGeometryPoint",
          layers: "all:ch.swisstopo.swissboundaries3d-kanton-flaeche.fill",
          mapExtent: `${e - 10000},${n - 10000},${e + 10000},${n + 10000}`,
          imageDisplay: "100,100,96",
          returnGeometry: false,
          sr: 2056,
          tolerance: 50,
        },
      });
      const result = resp.data.results?.[0]?.attributes;
      return JSON.stringify(
        {
          lat,
          lng,
          canton_name: result?.name,
          canton_abbr: result?.ak,
          bfs_number: result?.kantonsnr,
        },
        null,
        2
      );
    },
  },
  {
    name: "swiss_geo_identify_municipality",
    description: "Identify which Swiss municipality (commune) a coordinate belongs to.",
    input: { lat: z.number(), lng: z.number() },
    run: async (args) => {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const lv = await axios.get(`${REFRAME_BASE}/wgs84tolv95`, {
        params: { easting: lng, northing: lat, altitude: 0, format: "json" },
      });
      const { easting: e, northing: n } = lv.data;
      const resp = await axios.get(`${GEOADMIN_BASE}/all/MapServer/identify`, {
        params: {
          geometry: `${e},${n}`,
          geometryType: "esriGeometryPoint",
          layers: "all:ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill",
          mapExtent: `${e - 5000},${n - 5000},${e + 5000},${n + 5000}`,
          imageDisplay: "100,100,96",
          returnGeometry: false,
          sr: 2056,
          tolerance: 50,
        },
      });
      const r = resp.data.results?.[0]?.attributes;
      return JSON.stringify(
        { lat, lng, municipality: r?.name, bfs_nr: r?.gemeindenummer, canton: r?.ak },
        null,
        2
      );
    },
  },
  {
    name: "swiss_geo_convert_coordinates",
    description: "Convert coordinates between WGS84, LV95, LV03 via REFRAME.",
    input: {
      from_system: z.enum(["wgs84", "lv95", "lv03"]),
      to_system: z.enum(["wgs84", "lv95", "lv03"]),
      coord1: z.number(),
      coord2: z.number(),
    },
    run: async (args) => {
      const from_system = args.from_system as string;
      const to_system = args.to_system as string;
      const coord1 = args.coord1 as number;
      const coord2 = args.coord2 as number;
      const endpointMap: Record<string, Record<string, string>> = {
        wgs84: { lv95: "wgs84tolv95", lv03: "wgs84tolv03" },
        lv95: { wgs84: "lv95towgs84", lv03: "lv95tolv03" },
        lv03: { wgs84: "lv03towgs84", lv95: "lv03tolv95" },
      };
      const endpoint = endpointMap[from_system]?.[to_system];
      if (!endpoint) throw new Error(`Conversion ${from_system} → ${to_system} not supported`);
      const params = { northing: coord1, easting: coord2, altitude: 0, format: "json" };
      const resp = await axios.get(`${REFRAME_BASE}/${endpoint}`, { params });
      return JSON.stringify(resp.data, null, 2);
    },
  },
  {
    name: "swiss_geo_get_wmts_tile_url",
    description: "Generate a swisstopo WMTS tile URL.",
    input: {
      layer: z
        .enum([
          "ch.swisstopo.pixelkarte-farbe",
          "ch.swisstopo.pixelkarte-grau",
          "ch.swisstopo.swissimage",
          "ch.swisstopo.landeskarte-farbe",
          "ch.swisstopo.swisstlm3d-wanderwege",
        ])
        .default("ch.swisstopo.pixelkarte-farbe"),
      z: z.number().int().min(0).max(18),
      x: z.number().int(),
      y: z.number().int(),
    },
    run: async (args) => {
      const layer = args.layer as string;
      const zl = args.z as number;
      const x = args.x as number;
      const y = args.y as number;
      const url = `${WMTS_BASE}/${layer}/default/current/3857/${zl}/${x}/${y}.jpeg`;
      return JSON.stringify(
        { tile_url: url, attribution: "© swisstopo", note: "Free to use, no API key required" },
        null,
        2
      );
    },
  },
  {
    name: "swiss_geo_find_layer_features",
    description: "Search features in a swisstopo map layer by text.",
    input: {
      layer: z.string(),
      search_text: z.string(),
      search_field: z.string(),
      limit: z.number().int().default(10),
    },
    run: async (args) => {
      const resp = await axios.get(`${GEOADMIN_BASE}/all/MapServer/find`, {
        params: {
          layer: args.layer,
          searchText: args.search_text,
          searchField: args.search_field,
          returnGeometry: false,
          limit: args.limit,
        },
      });
      return JSON.stringify(resp.data.results ?? [], null, 2);
    },
  },
];
