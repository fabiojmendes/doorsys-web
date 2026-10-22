# Doorsys

Mobile-first administration for customers, staff access credentials, and entry logs.
Built with React Router Framework SPA mode, TypeScript, Material UI, and Biome.
Errors remain visible in MUI alerts and field helper text; snackbars only confirm success.

## Development

Use Node.js 24 or newer and npm.

```sh
npm ci
cp .env.example .env
npm run dev
```

Set `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` in `.env`. Optionally set
`VITE_AUTH0_CALLBACK_URL`; otherwise the callback is the browser origin.
Configure the origin/callback and logout URL in Auth0, with API audience `doorsys-api`.
The application preserves refresh tokens and local-storage token caching.

Vite proxies `/api/*` to `http://localhost:3000/*`. Run the existing Doorsys API
there. The UI requires Auth0 and the real API; production has no authentication bypass.

```sh
npm run check       # Biome formatting, lint, and import checks; no writes
npm run lint        # Biome lint; no writes
npm run format      # Format source/configuration
npm run check:fix   # Apply safe Biome fixes
npm run typecheck   # Generate route types and check TypeScript
npm test           # Vitest tests with mocked API/Auth0
npm run build      # Static output in build/client
npm run preview    # Preview the static build
```

The preview server does not proxy the API; use `npm run dev` for local API-backed
workflows, or serve the production build behind the Caddy configuration below.
All routes keep their existing URLs. Customer and log filters live in URL search
parameters; log date boundaries use the browser's local timezone.

## Docker and Caddy

```sh
docker build \
  --build-arg VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com \
  --build-arg VITE_AUTH0_CLIENT_ID=your-client-id \
  -t doorsys-web .
```

Auth0 variables are public frontend configuration baked into the assets. Rebuild
the image when they change; `VITE_AUTH0_CALLBACK_URL` is an optional build argument.

The final image contains Caddy with the JWT plugin and static assets, with no Node
runtime. `config/Caddyfile` is a deployment template: replace the example hostname,
Auth0 tenant, certificate paths, and backend address for your environment. Mount
the configured Caddyfile and certificates at runtime:

```sh
docker run --rm -p 80:80 -p 443:443 -p 443:443/udp \
  -v "$PWD/config/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v /path/to/certificates:/etc/caddy/certs:ro \
  doorsys-web
```

Ensure the certificate paths in your Caddyfile match the mount and Caddy can reach
the existing API backend. Caddy validates Auth0 JWTs for `/api/*`, strips `/api`,
and proxies to the backend. Other paths fall back to `index.html` for direct links
and browser refreshes. API failures must remain API responses, never SPA HTML.

CI runs Biome, type checks, tests, and a production build before building the image.
Pull requests build without publishing; existing master/tag events publish to GHCR.

## Migration validation

Automated tests cover API contracts, Auth0 callback/session behavior, local-day
log filters, customer forms, credential actions, and persistent error recovery.
Before release, verify real Auth0 login/logout and the backend against a configured
environment. Check Customers, customer details, staff details, and Logs at 320px,
375px, and desktop widths, including long names/emails, keyboard navigation,
confirmation dialogs, and bottom safe-area spacing.
