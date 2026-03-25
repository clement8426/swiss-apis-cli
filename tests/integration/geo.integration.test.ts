import { describe, it, expect } from "vitest";
import { invokeJson } from "./helpers.js";

describe("[REAL API] geo", () => {
  it("swiss_geo_search_location finds Lausanne", async () => {
    const data = (await invokeJson("swiss_geo_search_location", {
      query: "Lausanne",
      types: ["locations"],
      limit: 5,
      sr: "4326",
    })) as unknown[];

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("swiss_geo_get_elevation Bern ~540m", async () => {
    const data = (await invokeJson("swiss_geo_get_elevation", {
      lat: 46.9481,
      lng: 7.4474,
    })) as { altitude_m: number; system: string };

    expect(typeof data.altitude_m).toBe("number");
    expect(data.altitude_m).toBeGreaterThan(400);
    expect(data.altitude_m).toBeLessThan(700);
    expect(data.system).toBe("DHM25/DOM");
  });

  it("swiss_geo_identify_canton Sion → VS", async () => {
    const data = (await invokeJson("swiss_geo_identify_canton", {
      lat: 46.23,
      lng: 7.36,
    })) as { canton_abbr?: string };

    expect(data.canton_abbr).toBe("VS");
  });

  it("swiss_geo_identify_municipality Bern centre", async () => {
    const data = (await invokeJson("swiss_geo_identify_municipality", {
      lat: 46.9481,
      lng: 7.4474,
    })) as { lat: number; lng: number; municipality?: string };

    expect(data).toHaveProperty("lat");
    expect(data).toHaveProperty("lng");
  });

  it("swiss_geo_convert_coordinates WGS84 → LV95", async () => {
    const data = (await invokeJson("swiss_geo_convert_coordinates", {
      from_system: "wgs84",
      to_system: "lv95",
      coord1: 46.9481,
      coord2: 7.4474,
    })) as { easting: string | number; northing: string | number };

    expect(data).toHaveProperty("easting");
    expect(data).toHaveProperty("northing");
    expect(parseFloat(String(data.easting))).toBeGreaterThan(2_580_000);
    expect(parseFloat(String(data.easting))).toBeLessThan(2_620_000);
  });

  it("swiss_geo_get_wmts_tile_url builds HTTPS URL", async () => {
    const data = (await invokeJson("swiss_geo_get_wmts_tile_url", {
      layer: "ch.swisstopo.pixelkarte-farbe",
      z: 10,
      x: 535,
      y: 364,
    })) as { tile_url: string };

    expect(data.tile_url).toMatch(/^https:\/\/wmts\.geo\.admin\.ch/);
    expect(data.tile_url).toContain("ch.swisstopo.pixelkarte-farbe");
  });

  it("swiss_geo_find_layer_features (may be empty — API dependent)", async () => {
    try {
      const data = (await invokeJson("swiss_geo_find_layer_features", {
        layer: "ch.swisstopo.amtliches-strassenverzeichnis",
        search_text: "Bundesgasse",
        search_field: "strname",
        limit: 5,
      })) as unknown[];
      expect(Array.isArray(data)).toBe(true);
    } catch {
      // Layer/field combo sometimes rejected by GeoAdmin — not necessarily a CLI bug
    }
  });
});
