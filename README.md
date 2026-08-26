# Warsaw trip dashboard

A private, editable Warsaw trip dashboard for 30 August to 1 September 2026.

## Live site

https://relrtl-hub.github.io/wasaw-trip/

## Local development

```bash
npm ci
npm run dev
```

## Checks

```bash
npm run build
npm run lint
```

## Deployment

A push to `main` runs `.github/workflows/deploy.yml`, builds the Vite app, and deploys the `dist` artifact to GitHub Pages. Added places are stored in the browser's local storage and are not synced through GitHub.
