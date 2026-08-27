# Warsaw trip dashboard

A client-side, editable Warsaw trip dashboard for 30 August to 1 September 2026.

## Live site

https://relrtl-hub.github.io/wasaw-trip/

## What it includes

- Day-by-day route planning for Warsaw.
- Walking routes that use street-network geometry, not aerial straight lines.
- Interactive Leaflet map with route segments, place markers, popups, and optional place labels.
- Place groups: Core, Sightseeing, Shopping, Restaurants, and Utilities.
- Core map anchors, including Mercure Warszawa Grand, Viva Cuba Dance Studio, and Hotel Gromada Warszawa Centrum.
- Category and place selectors below the map, designed for cellular/mobile use.
- Custom Warsaw-place search through OpenStreetMap Nominatim.
- Local persistence for user-added places.
- Weather and currency status cards using live public APIs with a short browser cache.
- Travel Papers links for the flight tickets and hotel voucher.
- Google Maps handoff links for individual places and planned routes.

## Technology stack

### Client technology

- **React 19** for the application UI and component model.
- **React DOM 19** for browser rendering.
- **TypeScript 6** for typed application code and data models.
- **Vite 8** for development, bundling, and production builds.
- **`@vitejs/plugin-react`** for React support in Vite.
- **CSS** for the responsive dark/navy dashboard styling. There is no UI framework dependency.
- **Leaflet 1.9** for the interactive map engine.
- **React-Leaflet 5** for React components around Leaflet.
- **OpenStreetMap tiles and attribution** for the displayed map.
- **Browser Fetch API** for routing, geocoding, weather, and currency requests.
- **Browser `localStorage`** for device-local custom places and short-lived API caches.

### Development and quality tools

- **Node.js 20** in GitHub Actions.
- **npm** for dependency installation and scripts.
- **TypeScript project build** through `tsc -b`.
- **Oxlint** for linting.
- **Git** for version control.

### External services

The application is static, but the browser calls these public services at runtime:

- **OpenStreetMap tile servers** for map tiles.
- **OpenStreetMap Nominatim** for searching and geocoding custom Warsaw places.
- **OpenStreetMap routing** through `routing.openstreetmap.de` for street-based walking and driving directions.
- **Open-Meteo** for the Warsaw forecast.
- **Frankfurter** for PLN to EUR exchange rates.
- **ExchangeRate-API** for EUR to ILS exchange rates.
- **Google Maps** for navigation and place links opened by the user.

The application includes bundled street geometry for selected planned route legs. If live routing is unavailable and no bundled geometry exists, the route is shown as unavailable rather than drawing a misleading straight-line walking route.

## Repository structure

```text
.
├── .github/workflows/deploy.yml   GitHub Pages build and deployment workflow
├── public/travel-papers/           Static flight and hotel PDF files
├── src/
│   ├── components/WarsawMap.tsx    Leaflet map, markers, routes, and popups
│   ├── data/places.ts              Place data, groups, metadata, and map links
│   ├── data/routes.ts              Planned routes and route segments
│   ├── data/street-routes.ts       Bundled verified street geometry
│   ├── lib/live-data.ts            Weather, currency, and browser caching
│   ├── lib/routing.ts              Live/bundled street routing logic
│   ├── App.tsx                     Application state and page layout
│   └── App.css                     Responsive dashboard styles
├── index.html                      Vite HTML entry point
├── package.json                    Scripts and dependencies
├── package-lock.json               Locked npm dependency versions
└── vite.config.ts                  Vite configuration and Pages base path
```

## Local development

Requirements:

- Node.js and npm.
- Network access if you want live map tiles, routing, weather, currency, or place search.

Install dependencies and start the Vite development server:

```bash
npm ci
npm run dev
```

The terminal will show the local URL, normally:

```text
http://localhost:5173/
```

To serve the production build locally:

```bash
npm run build
npm run preview
```

## Checks

Run both checks before committing:

```bash
npm run build
npm run lint
```

`npm run build` runs the TypeScript project build and then creates the Vite `dist` output. `npm run lint` runs Oxlint.

## GitHub usage and automatic deployment

Repository:

https://github.com/relrtl-hub/wasaw-trip

The production site is hosted with GitHub Pages and deployed by GitHub Actions. The workflow is stored at:

```text
.github/workflows/deploy.yml
```

### Automatic deployment flow

1. A commit is pushed to the `main` branch.
2. GitHub Actions starts the `Deploy Warsaw trip dashboard` workflow.
3. The workflow checks out the repository.
4. It sets up Node.js 20 with npm dependency caching.
5. It runs `npm ci`.
6. It runs `npm run build`.
7. The generated `dist` directory is uploaded as a Pages artifact.
8. A deployment job publishes that artifact to the `github-pages` environment.
9. GitHub Pages serves the new build at:

   https://relrtl-hub.github.io/wasaw-trip/

The workflow can also be started manually with GitHub Actions using `workflow_dispatch`.

### Important Vite setting

GitHub Pages serves this project under the repository path `/wasaw-trip/`, not from the domain root. `vite.config.ts` therefore sets:

```ts
base: '/wasaw-trip/'
```

This ensures JavaScript, CSS, and Travel Papers links work on the Pages URL.

### Useful Git commands

```bash
git status
git log --oneline --decorate -5
git add .
git commit -m "describe the change"
git push origin main
```

Pushing to `main` is a deployment action because it triggers the workflow. Review the diff and run the checks before pushing.

## Internal storage and data flow

This is a static frontend. It has no application server, backend database, user account system, or shared cloud storage.

### Bundled data

The following data is stored in the repository and included in the built site:

- Predefined places and their metadata in `src/data/places.ts`.
- Planned route definitions in `src/data/routes.ts`.
- Selected offline street geometries in `src/data/street-routes.ts`.
- The flight and hotel PDFs under `public/travel-papers/`.

Anything under `public/` is copied into `dist` during the build. Because GitHub Pages is public, the Travel Papers PDFs are downloadable by anyone who can access the deployed site after they are pushed. Do not add private documents unless that visibility is acceptable.

### User-added places

Custom places are stored in the current browser and device using this key:

```text
warsaw-trip-custom-places
```

The value is JSON containing user-added place records. It is written when the custom-place list changes and loaded when the app starts.

Consequences:

- Custom places remain available after refreshing the same browser profile.
- They are not committed to Git.
- They are not synchronized to another phone, computer, or browser.
- Private browsing, clearing site data, changing browser profiles, or removing the site storage can remove them.
- Only records marked as user-added can be deleted through the UI.

### Weather and currency cache

Weather and currency responses use browser `localStorage` under namespaced keys:

```text
warsaw-trip:weather
warsaw-trip:currency
```

Each cached value includes a timestamp and is considered valid for 30 minutes. Expired or malformed cache entries are ignored and replaced after a successful API request. If storage is unavailable, the app continues without caching.

### Runtime requests

The browser requests live data directly from the public services listed above. No API key, password, token, or secret is required by the application, and no credentials should be committed to this repository.

## Deployment and storage limitations

- GitHub Pages deploys files; it does not provide a database for this app.
- Browser-local data belongs to the person and browser that created it.
- Static PDFs in `public/` are part of the deployed site and should be treated as public assets.
- External API availability, rate limits, map tiles, and live route results can change independently of this repository.
- The app uses bundled route geometry as an offline fallback for selected legs and reports an unavailable state when a safe street route cannot be shown.
