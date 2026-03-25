import { z } from "zod";
import axios from "axios";
import type { CliTool } from "../types.js";

const TRANSPORT_BASE = "https://transport.opendata.ch/v1";
const OTD_BASE = "https://api.opentransportdata.swiss";

export const transportTools: CliTool[] = [
  {
    name: "swiss_transport_stationboard",
    description: "Get next departures from a Swiss public transport station. No API key needed.",
    input: {
      station: z.string().describe("Station name, e.g. 'Genève', 'Zürich HB', 'Bern'"),
      limit: z.number().int().min(1).max(40).default(10),
      transportations: z.array(z.enum(["train", "tram", "bus", "boat", "cableway"])).optional(),
    },
    run: async (args) => {
      const station = args.station as string;
      const limit = args.limit as number;
      const transportations = args.transportations as string[] | undefined;
      const params: Record<string, unknown> = { station, limit };
      if (transportations) params.transportations = transportations.join("&transportations[]=");
      const resp = await axios.get(`${TRANSPORT_BASE}/stationboard`, { params });
      const board = resp.data;
      const summary = board.stationboard?.slice(0, limit).map((d: any) => ({
        line: d.name,
        destination: d.to,
        departure: d.stop?.departure,
        delay: d.stop?.delay ?? 0,
        platform: d.stop?.platform,
        category: d.category,
      }));
      return JSON.stringify({ station: board.station?.name, departures: summary }, null, 2);
    },
  },
  {
    name: "swiss_transport_connections",
    description: "Find train/bus connections between two Swiss locations. No API key needed.",
    input: {
      from: z.string(),
      to: z.string(),
      via: z.string().optional(),
      datetime: z.string().optional(),
      limit: z.number().int().min(1).max(6).default(3),
    },
    run: async (args) => {
      const params: Record<string, unknown> = {
        from: args.from,
        to: args.to,
        limit: args.limit,
      };
      if (args.via) params.via = args.via;
      if (args.datetime) params.datetime = args.datetime;
      const resp = await axios.get(`${TRANSPORT_BASE}/connections`, { params });
      const connections = resp.data.connections?.map((c: any) => ({
        departure: c.from?.departure,
        arrival: c.to?.arrival,
        duration: c.duration,
        transfers: c.transfers,
        products: c.products,
        sections: c.sections?.map((s: any) => ({
          departure: s.departure?.station?.name,
          arrival: s.arrival?.station?.name,
          line: s.journey?.name,
          category: s.journey?.category,
        })),
      }));
      return JSON.stringify(connections, null, 2);
    },
  },
  {
    name: "swiss_transport_station_search",
    description: "Search for Swiss public transport stations by name or coordinates.",
    input: {
      query: z.string().optional(),
      lat: z.number().optional(),
      lon: z.number().optional(),
      limit: z.number().int().default(5),
    },
    run: async (args) => {
      const params: Record<string, unknown> = { limit: args.limit };
      if (args.query) params.query = args.query;
      if (args.lat != null && args.lon != null) {
        params["x"] = args.lon;
        params["y"] = args.lat;
      }
      const resp = await axios.get(`${TRANSPORT_BASE}/locations`, { params });
      return JSON.stringify(resp.data.stations, null, 2);
    },
  },
  {
    name: "swiss_transport_gtfs_realtime",
    description: "Get real-time GTFS data from opentransportdata.swiss. Requires OTD_API_KEY.",
    input: {
      feed_type: z.enum(["trip_updates", "vehicle_positions", "alerts"]),
    },
    run: async (args) => {
      const feed_type = args.feed_type as string;
      const apiKey = process.env.OTD_API_KEY;
      if (!apiKey) {
        return "OTD_API_KEY environment variable not set. Register free at: https://api-manager.opentransportdata.swiss/";
      }
      const endpoints: Record<string, string> = {
        trip_updates: `${OTD_BASE}/gtfsrttripupdates/v1`,
        vehicle_positions: `${OTD_BASE}/gtfsrtvehicleposition/v1`,
        alerts: `${OTD_BASE}/gtfsrtalerts/v1`,
      };
      const resp = await axios.get(endpoints[feed_type], {
        headers: { Authorization: `Bearer ${apiKey}` },
        responseType: "arraybuffer",
      });
      return `GTFS-RT ${feed_type} feed fetched (${resp.data.byteLength} bytes). Use a protobuf decoder to parse.`;
    },
  },
];
