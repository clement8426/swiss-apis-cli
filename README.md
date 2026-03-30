# swiss-apis-cli

Command-line interface to query **Swiss public data and open APIs** from the terminal. Commands are named with a `swiss_*` prefix (for example `swiss_transport_connections`, `swiss_geo_get_elevation`). Run `swiss list` to see every command and a short description.

**Runtime:** Node.js 18+.

## What it talks to

The CLI calls (or points to) the services below. Availability, rate limits, and terms of use are defined by each operator—not by this project.

| Domain | Service | Role in the CLI |
|--------|---------|------------------|
| **Public transport** | [transport.opendata.ch](https://transport.opendata.ch) (`/v1`) | Station boards, connections, station/location search. |
| **Public transport (real-time)** | [OpenTransportData Swiss](https://opentransportdata.swiss) | GTFS real-time feeds via `api.opentransportdata.swiss` (API key required). |
| **Maps & geodesy** | [swisstopo / geo.admin.ch](https://www.geo.admin.ch) | `api3.geo.admin.ch` — search, identify canton/municipality, elevation; `geodesy.geo.admin.ch/reframe` — coordinate transforms; `wmts.geo.admin.ch` — WMTS tile URL helpers. |
| **Open government data** | [opendata.swiss](https://opendata.swiss) CKAN API | `ckan.opendata.swiss/api/3/action` — dataset search for health (BAG), energy, MeteoSwiss-related datasets, BFS statistics, SNB, SEM migration, etc. |
| **Federal law** | [Fedlex](https://www.fedlex.admin.ch) | SPARQL endpoint `fedlex.data.admin.ch/sparqlendpoint` for in-force legislation search. |
| **Parliament** | [OpenParlData CH](https://openparldata.ch) | `api.openparldata.ch` — search and person listings. |
| **Electricity grid** | [Swissgrid](https://www.swissgrid.ch) (open data) | Energy datasets and references surfaced via CKAN / Swissgrid-related queries in the CLI. |
| **Hydrology** | [hydrodaten.admin.ch](https://www.hydrodaten.admin.ch) | Hydrological data; linked open data via `environment.ld.admin.ch` (LINDAS) where applicable. |
| **Avalanches / snow** | [SLF](https://www.slf.ch) | Avalanche and snow-related open data (often via opendata.swiss CKAN). |
| **Weather** | [MeteoSwiss](https://www.meteoswiss.admin.ch) open data | Datasets catalogued on opendata.swiss. |
| **Health** | BAG / FOPH datasets on opendata.swiss; [Versorgungsatlas](https://www.versorgungsatlas.ch/) | CKAN search and dataset metadata; atlas references where implemented. |
| **Postal & places** | [OpenPLZ API](https://www.openplzapi.org) | `openplzapi.org/ch` — localities, postal codes (no API key). |
| **National Bank** | [data.snb.ch](https://data.snb.ch) | SNB datasets on opendata.swiss plus API endpoint `data.snb.ch/api` in responses. |
| **Commercial register** | [ZEFIX](https://www.zefix.admin.ch) | `ZefixPublicREST` — company search and related calls (account required). |
| **Food products** | [FoodRepo](https://www.foodrepo.org) | `foodrepo.org/api/v3` — product search (API token). |
| **Food composition** | [Nährwertdaten (FSVO)](https://naehrwertdaten.ch/) | The `swiss_food_nutrition_database` command returns **links and hints** to the official portal; it does not scrape or call a separate JSON API. |
| **Migration statistics** | [SEM](https://www.sem.admin.ch) | SEM statistics portal links plus SEM datasets via opendata.swiss CKAN. |

## Install

```bash
npm install -g swiss-apis-cli
```

From a clone, run `npm install && npm run build`, then `node dist/cli.js` or use `npm run dev` with `tsx`.

## Configuration

1. **Optional `.env`** in the **current working directory** when you run `swiss` — copy `.env.example` to `.env` and set only what you need. Comments in `.env.example` link to official registration pages.
2. **Optional key file:** `~/.swiss-apis-cli/keys` (lines `KEY=value`). Values are merged into the process environment if not already set.

Variables used by the CLI:

| Variable | Used for |
|----------|----------|
| `OTD_API_KEY` | GTFS real-time / OpenTransportData Swiss |
| `ZEFIX_USER`, `ZEFIX_PASS` | ZEFIX REST API |
| `FOODREPO_API_KEY` | FoodRepo product API |

## Usage

```bash
swiss list
swiss list --json

swiss info swiss_transport_stationboard

swiss call swiss_transport_stationboard '{"station":"Bern","limit":3}'
echo '{"from":"Bern","to":"Genève"}' | swiss call swiss_transport_connections -
swiss call swiss_geo_get_elevation @args.json

swiss doctor    # same as swiss call swiss_check_setup
```

`swiss check_setup` (and `swiss doctor`) summarizes which optional credentials are present—without printing secret values.

## Tests

- `npm test` — fast tests, **no network** (registry, validation, local `swiss_check_setup` behaviour).
- `npm run test:integration` — **live HTTP** against the public services above. Requires internet; may fail if an upstream API is down or has changed.
- `npm run test:all` — runs both.

Some integration cases are skipped unless `OTD_API_KEY`, `ZEFIX_*`, or `FOODREPO_API_KEY` are set.

## Licence

MIT — see [LICENSE](LICENSE).
