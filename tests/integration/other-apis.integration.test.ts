import { describe, it, expect } from "vitest";
import { invokeJson, invokeText } from "./helpers.js";

describe("[REAL API] setup & open data", () => {
  it("swiss_check_setup returns JSON status", async () => {
    const data = (await invokeJson("swiss_check_setup", {})) as {
      all_configured: boolean;
      keys: Record<string, { configured: boolean }>;
    };
    expect(typeof data.all_configured).toBe("boolean");
    expect(data.keys.OTD_API_KEY).toBeDefined();
  });

  it("swiss_health_search_datasets", async () => {
    const data = (await invokeJson("swiss_health_search_datasets", {
      query: "covid",
      rows: 3,
    })) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  it("swiss_health_get_dataset (BAG slug)", async () => {
    let data: { resources?: unknown[] };
    try {
      data = (await invokeJson("swiss_health_get_dataset", {
        dataset_slug: "covid-19-schweiz",
      })) as { resources?: unknown[] };
    } catch (e) {
      // Slug or CKAN may change — do not swallow assertion failures below
      console.warn("[skip] swiss_health_get_dataset:", e);
      return;
    }
    expect(data).toHaveProperty("resources");
    expect(Array.isArray(data.resources)).toBe(true);
  });

  it("swiss_health_get_versorgungsatlas", async () => {
    const data = (await invokeJson("swiss_health_get_versorgungsatlas", {
      indicator: "mortalite",
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_parliament_search", async () => {
    const data = (await invokeJson("swiss_parliament_search", {
      query: "climate",
      limit: 5,
    })) as Record<string, unknown> | unknown[];
    expect(data).toBeDefined();
  });

  it("swiss_parliament_persons", async () => {
    const data = (await invokeJson("swiss_parliament_persons", {
      parliament: "ch",
      limit: 5,
    })) as Record<string, unknown> | unknown[];
    expect(data).toBeDefined();
  });

  it("swiss_federal_law_search", async () => {
    const data = (await invokeJson("swiss_federal_law_search", {
      query: "protection",
    })) as unknown;
    expect(data).toBeDefined();
  });

  it("swiss_opendata_search_datasets", async () => {
    const data = (await invokeJson("swiss_opendata_search_datasets", {
      query: "population",
      rows: 5,
    })) as { datasets?: unknown[]; total?: number };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_energy_search_datasets", async () => {
    const data = (await invokeJson("swiss_energy_search_datasets", {
      query: "electricity",
      rows: 3,
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_grid_energy_data", async () => {
    const data = (await invokeJson("swiss_grid_energy_data", {
      query: "energy grid",
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_weather_search_meteoswiss", async () => {
    const data = (await invokeJson("swiss_weather_search_meteoswiss", {
      query: "temperature",
      rows: 3,
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_avalanche_data", async () => {
    const data = (await invokeJson("swiss_avalanche_data", {
      query: "avalanche",
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_hydro_data without station", async () => {
    const data = (await invokeJson("swiss_hydro_data", {})) as { note?: string; portal?: string };
    expect(data).toHaveProperty("note");
  });

  it("swiss_statistics_search", async () => {
    const data = (await invokeJson("swiss_statistics_search", {
      query: "population",
      rows: 3,
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_snb_financial_data", async () => {
    const data = (await invokeJson("swiss_snb_financial_data", {
      query: "exchange",
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_postal_data by postal code", async () => {
    const data = (await invokeJson("swiss_postal_data", {
      postal_code: "1201",
    })) as unknown;
    expect(data).toBeDefined();
  });

  it("swiss_migration_statistics", async () => {
    const data = (await invokeJson("swiss_migration_statistics", {
      query: "migration",
    })) as { datasets?: unknown[] };
    expect(data).toHaveProperty("datasets");
  });

  it("swiss_food_nutrition_database", async () => {
    const data = (await invokeJson("swiss_food_nutrition_database", {
      query: "gruyère",
    })) as { portal?: string };
    expect(data).toHaveProperty("portal");
  });
});

describe("[REAL API] optional credentials", () => {
  it("swiss_company_search when ZEFIX_USER and ZEFIX_PASS are set", async () => {
    if (!process.env.ZEFIX_USER?.trim() || !process.env.ZEFIX_PASS?.trim()) {
      console.warn("[skip] ZEFIX credentials not set");
      return;
    }
    const text = await invokeText("swiss_company_search", {
      name: "Migros",
      max_results: 3,
    });
    expect(text.trim().startsWith("[")).toBe(true);
    const data = JSON.parse(text) as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });

  it("swiss_food_search_products when FOODREPO_API_KEY is set", async () => {
    if (!process.env.FOODREPO_API_KEY?.trim()) {
      console.warn("[skip] FOODREPO_API_KEY not set");
      return;
    }
    const text = await invokeText("swiss_food_search_products", {
      page: 1,
    });
    expect(text.trim().startsWith("[")).toBe(true);
  });
});
