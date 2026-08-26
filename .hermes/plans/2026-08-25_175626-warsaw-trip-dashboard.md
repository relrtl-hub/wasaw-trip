# Warsaw Trip Dashboard Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a mobile-first Warsaw trip dashboard for 30 August to 1 September 2026, deployable as a static GitHub Pages site, with itinerary routes, map-based points of interest, live travel status, and editable trip content.

**Architecture:** Use a React + TypeScript + Vite single-page app. Store public trip content as typed local data in the repository, render the map with Leaflet and OpenStreetMap tiles, and fetch weather and exchange rates client-side with caching and graceful offline fallbacks. Private document storage is intentionally deferred; the first version will include clearly marked placeholders only.

**Tech Stack:** React, TypeScript, Vite, Leaflet, React-Leaflet, CSS modules or a small tokenized stylesheet, Open-Meteo, Frankfurter/ECB, GitHub Pages via GitHub Actions.

---

## Product decisions already confirmed

- Trip dates: **30 August to 1 September 2026**.
- Project folder: `C:\Users\relrt\multica\warsaw-trip`.
- Dashboard language: English.
- Document handling for the first version: placeholders only, no passport/insurance uploads yet.
- Restaurant selection: use best-value judgment and show price bands rather than a hard price cutoff.
- Map provider default: Leaflet + OpenStreetMap, avoiding a Google Maps API key.
- Approval workflow: build in small phases, show a working preview after each phase, and wait for approval before the next phase.

## Safety and privacy boundary

Passport IDs, insurance details, phone-plan information, and hotel vouchers are sensitive. They must not be committed to a public repository or embedded in a public GitHub Pages build. The initial release contains empty document cards and a later phase can add a local browser vault using IndexedDB, with optional client-side encryption. Any cross-device sync would require a separate authenticated backend and explicit approval.

## Primary surface and layout direction

This is primarily an **Explore** surface with a secondary **Monitor** surface. The user needs to browse a city, compare places, and see route state quickly. Avoid a marketing hero and generic equal-weight card grids.

Proposed layout:

- Mobile: compact header, date tabs, route cards, then map; bottom navigation for `Overview`, `Map`, `Routes`, and `Essentials`.
- Desktop: persistent left rail for trip/date/route controls, large map canvas in the center, right detail drawer for selected places and live status.
- Visual language: an original urban field-guide style, warm paper background, ink/navy text, one amber route accent, three route colors, restrained borders, and editorial typography. No gradients or decorative dashboard filler.
- Important interaction: route cards outside the map toggle their corresponding colored polyline and fit the map bounds; selecting a POI opens its detail drawer and highlights its marker.

## Data model

Create typed data modules so all content can be edited without touching UI code:

- `src/data/trip.ts`: trip dates, hotel, high-level notes.
- `src/data/places.ts`: hotel, supplied POIs, recommended historical sites, Holocaust memorials that are not museums, shopping, and restaurants.
- `src/data/routes.ts`: route segments, ordered place IDs, travel mode, duration target, route color, and day grouping.
- `src/data/essentials.ts`: placeholder cards for passport, insurance, phone plan, and hotel voucher.
- `src/lib/geo.ts`: distance and route utility functions.
- `src/lib/live-data.ts`: weather and exchange-rate fetchers, normalization, cache, and failure states.

Every place should have a stable ID, category, address, latitude/longitude, source URL, rating metadata when verified, price band when relevant, tags, and a short reason to visit. Do not present unverified ratings as facts.

## Route requirements

- Day 1: taxi to Warsaw Old Town, a 3 to 4 hour walking route through the historic core and back toward the hotel, then a second segment to Centrum Praskie Koneser with an optional walking return.
- Days 2 and 3: two approximately 3 hour shopping-focused routes per day, starting from Mercure Warszawa Grand, using the supplied shopping places plus approved recommendations.
- Route cards must show duration, walking/driving split, stop count, and the places included.
- The user can toggle routes independently, show all routes, hide all routes, and change the active route color only through the route data configuration.
- Add-place flow: form for name, category, address, optional coordinates, notes, and optional URL; new places persist locally in browser storage and can be removed or edited.

### Navigation-grade map behavior

The map is a planning and navigation handoff tool, not a decorative illustration. Use Leaflet with OpenStreetMap tiles and real route geometry from OSRM or openrouteservice. Do not draw straight lines between places as the final route.

- Store verified coordinates for every POI and the hotel anchor.
- Request walking geometry from a pedestrian-capable routing provider, not a generic driving profile. If only a driving-profile OSRM endpoint is available, do not present its duration as a walking ETA; label the route estimate clearly and link to Google Maps for live walking navigation.
- Request driving geometry for taxi segments.
- Render the returned geometry as selectable colored polylines with distance, duration, and a route source timestamp.
- Show the ordered stop list and the next leg, with a clear distinction between planning estimates and live navigation.
- Provide `Open in Google Maps` for every place, each route leg, and each full route using Google Maps directions URLs. On mobile, the link should hand off to the Google Maps app when available.
- Include an optional `Export route` action that produces a shareable Google Maps directions link and a simple GPX/KML export if the routing provider supports it.
- Add a visible disclaimer that the dashboard plans the route; Google Maps remains the source of truth for live closures, crossings, transit changes, and turn-by-turn navigation.

## Live status requirements

- Weather panel: daily high/low or daytime/night temperature for each trip date, precipitation probability or rain indicator, and the relevant rain window when the provider exposes it.
- Currency panel: PLN to EUR and EUR to ILS, with retrieval timestamp, source, loading state, cached state, and a visible stale-data warning.
- APIs must be isolated behind adapters so a provider can be replaced without changing components.
- The app must still render the itinerary, map, and routes if either live API fails.

## Phased implementation and approval gates

### Phase 1: Foundation and visual shell

Create the Vite app, global design tokens, responsive layout, navigation, empty map region, date switcher, and placeholder cards. Add local development and production build scripts. Verify the app runs locally and the production build completes. Pause for visual approval.

### Phase 2: Map and place catalog

Add Leaflet/OpenStreetMap, the hotel anchor, all user-supplied places, category filters, marker selection, place detail panel, and distance-from-hotel calculations. Geocode or verify coordinates before adding them to data. Verify marker selection and mobile map behavior. Pause for content and map approval.

### Phase 3: Routes and route controls

Add the three-day route data, route cards, colored polylines, toggle state, map fitting, stop details, walking/driving labels, and day-specific route grouping. Start with reasonable draft routes, clearly label them as drafts until distances and travel times are verified. Pause for itinerary approval.

### Phase 4: Recommendations research pass

Research and add historical places, non-museum Holocaust memorials, inexpensive shopping, and inexpensive highly rated restaurants near the hotel and route corridors. Prefer places that are open and practical without reservations. Capture source URLs, rating source/date, price band, and why each place is included. Present the recommendation shortlist for approval before merging it into the app.

### Phase 5: Weather and exchange rates

Implement live provider adapters, daily cache, loading/error/offline states, and the trip-date status cards. Verify with real API responses and test a simulated API failure. Pause for approval of the presentation and data freshness behavior.

### Phase 6: Essentials placeholders and add-place editor

Add the four document placeholder cards with clear privacy copy, plus the local add/edit/delete POI flow. Do not add document upload until separately approved. Verify persistence after reload and safe empty states.

### Phase 7: Polish, accessibility, and deployment

Test responsive breakpoints, keyboard navigation, focus states, reduced motion, marker and route contrast, empty/error states, and print-friendly essentials. Configure GitHub Pages deployment, document the deploy steps, run the production build, and verify the deployed site URL after publishing.

## Proposed repository structure

```text
C:\Users\relrt\multica\warsaw-trip
├── .github/workflows/deploy.yml
├── .hermes/plans/2026-08-25_175626-warsaw-trip-dashboard.md
├── public/
├── src/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── tests/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Validation checklist

- `npm run build` succeeds.
- App loads on a narrow mobile viewport and a desktop viewport.
- All supplied places render as markers and have stable IDs.
- Hotel distance is calculated from Mercure Warszawa Grand, not from the user's current location.
- Each route can be toggled from outside the map and is visibly differentiated.
- Add-place data survives a reload and can be removed.
- Weather and exchange rates show source, timestamp, and graceful failure states.
- No sensitive document content is present in repository files or the deployed build.
- The GitHub Pages build works from a clean checkout.

## Risks and tradeoffs

- OpenStreetMap tiles are convenient and keyless, but public tile usage has fair-use limits. Keep the app lightweight and avoid aggressive tile prefetching.
- Google review ratings change. Store the source and verification date, and avoid claiming a rating is current without a source.
- Client-side live APIs may be blocked by network or CORS conditions. Cached last-known data and a manual refresh control are required.
- A public static site cannot protect secrets. Document uploads need a separate privacy design later.
- Walking routes drawn as straight segments are useful for planning but are not turn-by-turn navigation. Link out to a navigation app for final directions.

## First implementation handoff

Start with Phase 1 only. After the local preview is visible, ask for approval of the visual direction before implementing map data, routes, and live services. This keeps the project additive and reviewable instead of producing one large opaque build.
