# ip-tools

Angular multi-project workspace (SCSS, component prefix `ip`).

```
projects/
  ip-lookup/      App: AbuseIPDB IP reputation check (Fluent 2 UI)
  abuseipdb/      Library: API client, mock client, models, IP parsing, text templates
  ui-styles/      Shared Fluent tokens + SCSS mixins (@use 'fluent' as f;)
```

## Run

```bash
npm install
npm start            # ng serve ip-lookup  ->  http://localhost:4200
npm run build        # production build of ip-lookup
npm run build:lib    # package the abuseipdb library to dist/abuseipdb
```

Development uses generated data (`useMock: true` in
`projects/ip-lookup/src/environments/environment.development.ts`). Set it to
`false` to call the real API. Requests go to `/abuseipdb/api/v2/check`, which
`projects/ip-lookup/proxy.conf.json` forwards to `https://api.abuseipdb.com`.

AbuseIPDB does not allow direct browser (CORS) calls, so production needs a
backend or reverse proxy that serves the same path. Point
`abuseIpdbBaseUrl` in `environment.ts` at it. For production, keep the API key
on the server rather than in the browser.

## Add another app

```bash
ng generate application <name> --prefix=ip --style=scss
```

Then, in `angular.json`, add the shared styles to the new app's build options:

```json
"stylePreprocessorOptions": { "includePaths": ["projects/ui-styles"] }
```

Import the library by its path alias (set in `tsconfig.json`, no build step needed):

```ts
import { provideAbuseIpdb, parseIpList } from '@ip-tools/abuseipdb';
```

## Notes

- Angular 20, standalone components, signals, zoneless change detection, new control flow.
- Bulk checks call `/check` once per address with 4 in parallel (`concurrency` in `provideAbuseIpdb`).
- The API key is held in memory only. The text template and separator are saved in localStorage.
- Quota in the header comes from the `X-RateLimit-*` response headers.
