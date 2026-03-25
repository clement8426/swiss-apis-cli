import { describe, it, expect } from "vitest";
import { invokeJson, invokeText } from "./helpers.js";

describe("[REAL API] transport", () => {
  it("swiss_transport_stationboard returns departures for Genève", async () => {
    const data = (await invokeJson("swiss_transport_stationboard", {
      station: "Genève",
      limit: 5,
    })) as { station?: string; departures?: unknown[] };

    expect(data).toHaveProperty("station");
    expect(typeof data.station).toBe("string");
    expect(Array.isArray(data.departures)).toBe(true);
    if (data.departures && data.departures.length > 0) {
      const d = data.departures[0] as Record<string, unknown>;
      expect(d).toHaveProperty("line");
      expect(d).toHaveProperty("destination");
      expect(d).toHaveProperty("departure");
      expect(typeof d.delay).toBe("number");
    }
  });

  it("swiss_transport_connections Bern → Zürich HB", async () => {
    const data = (await invokeJson("swiss_transport_connections", {
      from: "Bern",
      to: "Zürich HB",
      limit: 2,
    })) as unknown[];

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    const conn = data[0] as Record<string, unknown>;
    expect(conn).toHaveProperty("departure");
    expect(conn).toHaveProperty("arrival");
    expect(conn).toHaveProperty("duration");
    expect(typeof conn.transfers).toBe("number");
  });

  it("swiss_transport_station_search finds Lausanne", async () => {
    const data = (await invokeJson("swiss_transport_station_search", {
      query: "Lausanne",
      limit: 5,
    })) as unknown[];

    expect(Array.isArray(data)).toBe(true);
  });

  it("swiss_transport_gtfs_realtime when OTD_API_KEY is set", async () => {
    if (!process.env.OTD_API_KEY?.trim()) {
      console.warn("[skip] OTD_API_KEY not set — skipping GTFS realtime");
      return;
    }
    const text = await invokeText("swiss_transport_gtfs_realtime", {
      feed_type: "alerts",
    });
    expect(text).toMatch(/GTFS-RT|bytes/i);
  });
});
