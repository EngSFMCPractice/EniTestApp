## Quick context

- This repo implements a Salesforce Marketing Cloud Custom Activity as a small Express app. The server runs from `app.js`. The activity UI is in `public/` and communicates with SFMC using JWTs.

## Architecture & data flow (concise)

- app.js: Express server, serves static `public/` and mounts journey-builder routes at `/jb`.
- routes/index.js: HTTP endpoints used by Journey Builder (`/save`, `/validate`, `/publish`, `/execute`, `/getPush`). These forward to `controllers/JourneyBuilderHandlers.js` or `functions/global-functions.js`.
- controllers/JourneyBuilderHandlers.js: primary handler logic for execute/validate/save/publish. `JourneyBuilderExecute` decodes the SFMC JWT (via `functions/global-functions.JWTdecode`), reads `inArguments`, replaces personalization tokens, then routes based on `Switch` field: `'on'` → posts to `API_URL`, `'sfmc'` → sends push via SFMC BU Child token, otherwise → inserts into WordPress (via `functions/wp-config.js`).
- public/: front-end custom activity code (see `public/js/customActivity.js` and `public/config.json`) — this is the code SFMC loads inside the Journey Builder canvas.
- functions/: helper modules (JWT decode, SFMC token retrieval, WP integration, cron upload to SFMC). Database helpers live in `db-config.js` (Postgres via `DATABASE_URL`).

## How to run locally (what an AI dev should do)

1. Install dependencies: `npm install` (package.json has only `start: node app.js`).
2. Create a `.env` with required environment variables observed in the code (examples below). The app uses `dotenv`.
3. Run: `npm start` (listens on `process.env.PORT`).

Minimal `.env` keys (inferred from code):
- PORT
- SFMC_JWT
- SFMC_ROOT_AUTH, SFMC_CLIENT_ID, SFMC_CLIENT_SECRET, SFMC_ACCOUNT_ID (parent account)
- SFMC_CLIENT_ID_BUCHILD, SFMC_CLIENT_SECRET_BUCHILD, SFMC_ACCOUNT_ID_BUCHILD (BU Child account for push sends)
- SFMC_ROOT_REST, SFMC_EXT_KEY
- API_URL
- WProotApi, WordpressUser, WordpressPsw
- DATABASE_URL

Only documentable facts are listed above; do not invent additional runtime steps.

## Project-specific patterns & conventions

- Environment-driven: Nearly all configuration is via `process.env` (no config builder). When adding features, prefer environment variables over hard-coded values.
- Status codes as numeric returns: controller functions (e.g., `JourneyBuilderExecute`) return numeric status codes (200/400/404/500) — route handlers use `res.sendStatus(<returned>)`. Preserve this pattern in new handlers.
- Logging pattern: the project logs errors to console and records push history via `functions/global-functions.logPushHistory` which writes to Postgres (`db-config.js`). If you add new failure points, call `logPushHistory` with the same shape used elsewhere (see `JourneyBuilderHandlers.js` for the example `logReq` shape).
- JWT handling: inbound JWT bodies are raw (the server uses `bodyParser.raw({type: 'application/jwt'})`). Use `functions/global-functions.JWTdecode(body, env.SFMC_JWT)` to decode posted JWTs.
- Personalization replacement: `JourneyBuilderExecute` replaces `${...}` tokens by looking up keys in a second inArgument object — when changing personalization logic, keep this two-element `inArguments` contract in mind.

## Integration points and external dependencies

- SFMC Parent Account: token retrieval via `functions/global-functions.getTokenSFMC()` and cron job in `functions/cron.js` (uses `SFMC_ROOT_AUTH`, `SFMC_ROOT_REST`, `SFMC_EXT_KEY`). Used for retrieving push definitions and uploading log history.
- SFMC BU Child Account: token retrieval via `functions/global-functions.getTokenSFMCBUChild()` used by `JourneyBuilderExecute` when `Switch='sfmc'` to send push messages via SFMC messaging API (uses `SFMC_ROOT_AUTH`, `SFMC_CLIENT_ID_BUCHILD`, `SFMC_CLIENT_SECRET_BUCHILD`, `SFMC_ACCOUNT_ID_BUCHILD`).
- WordPress: `functions/wp-config.js` posts to wp-json endpoints and expects `WProotApi`, `WordpressUser`, `WordpressPsw` env vars.
- Postgres: `db-config.js` uses `DATABASE_URL` and provides `insertLogHistory` and `getLogHistory` used by helpers and cron.

## Helpful examples for code changes

- Add a new Journey Builder endpoint: edit `routes/index.js` and call a new function exported by `controllers/JourneyBuilderHandlers.js`. Follow the existing pattern: `let result = await handler(req.body); res.sendStatus(result);`.
- To send a decoded, safe payload from the client: look at `public/js/customActivity.js` — server expects `inArguments` shaped like `[fields, personalizationMap]` and JWT-signed payloads.
- Verify a push with a contact: call `/jb/verifyPush` (POST) with `{pushID, contactID}`. The function `functions/global-functions.verifyPushOnSFMC` uses the parent account token to send a test push to SFMC; useful for configuration validation from the UI.

## What not to change without confirmation

- Do not change the numeric-return contract for controller handlers (they map directly to `res.sendStatus`).
- Avoid changing DB table names or schema assumptions unless you update `db-config.js` and the cron import logic.

## Where to look first when debugging

- Startup logs: `app.js` prints the port; ensure `PORT` is set.
- JWT parse errors: `functions/global-functions.JWTdecode` exceptions appear in controller logs.
- External API failures: check `API_URL` and WP endpoints — `JourneyBuilderHandlers` logs both the response and calls `logPushHistory` when something goes wrong.

---

If anything here looks incorrect or you want more detail on a specific file (for example `public/js/customActivity.js` or `functions/wp-config.js`), tell me which parts you want expanded and I will update this file accordingly.
