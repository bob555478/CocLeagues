# CoC Leagues Backend API Routes

The frontend communicates with the backend at **`http://0.0.0.0:8000/`** (configurable via `VITE_BACKEND_URL` in [`src/services/backendClient.js`](./src/services/backendClient.js)). If the backend at `http://0.0.0.0:8000/` is unreachable, all routes automatically fall back to the mock datasets and handlers in [`src/mocks/`](./src/mocks/index.js).

> See [`API_ROUTES_CHANGES.md`](./API_ROUTES_CHANGES.md) for a detailed changelog of all routes added/updated beyond the original specification.

---

## 1. Clash of Clans (CoC) API Routes
These routes run on the backend so your Clash of Clans JWT (`COC_API_TOKEN`) stays on the server and avoids browser CORS restrictions against `https://api.clashofclans.com/v1`.

| Method & Route | Upstream CoC Endpoint | Explanation |
| :--- | :--- | :--- |
| **`GET /api/coc/clans`** | `GET /v1/clans` | **Search Clans**: Searches clans by `name` (min 3 chars) and filters (`warFrequency`, `minClanLevel`, `minMembers`, `maxMembers`, `minClanPoints`, `locationId`, `limit`). Attaches the server's `Authorization: Bearer <COC_API_TOKEN>` header. |
| **`GET /api/coc/clans/:clanTag`** | `GET /v1/clans/{clanTag}` | **Get Clan Profile & Full Roster**: URL-encodes the `#TAG` (`%23TAG`) and fetches a clan's full metadata, war league, and `memberList` (Town Hall levels, roles, trophies, war preferences) used to populate the CWL League Setup page. |
| **`GET /api/coc/clans/:clanTag/members`** | `GET /v1/clans/{clanTag}/members` | **Get Clan Members List**: Fetches only the clan's current member roster for refreshing player opt-in status or Town Hall levels without pulling full clan metadata. |
| **`GET /api/coc/clans/:clanTag/currentwar/leaguegroup`** | `GET /v1/clans/{clanTag}/currentwar/leaguegroup` | **Get Active CWL Group & Rounds**: Fetches the active 7-day Clan War League group, the 6 opponent clans in your group, and the war tags for each of the 7 CWL rounds. |
| **`GET /api/coc/players`** | `GET /v1/players/{playerTag}` | **Search In-Game Players**: Searches Clash of Clans players by name or `#TAG` (used during Registration and Account Management to link an online user to their in-game player(s) and detect their clan). |

---

## 2. Database (Lakebase Postgres) & CWL League Organization Routes
These routes read and write your clan's 7-day CWL schedule in the `cwl_leagues` table in Lakebase Postgres (`DATABASE_URL`). Every mutating route returns `pg_current_xact_id()::text AS txid` in a single round trip so Neon Realtime (`awaitTxId`) can confirm live UI updates immediately.

| Method & Route | DB Operation | Explanation |
| :--- | :--- | :--- |
| **`GET /api/leagues`** | `SELECT ... FROM cwl_leagues` | **List Saved League Setups**: Returns saved CWL league schedules from Lakebase Postgres. Accepts an optional `?clanTag=%232PP` query parameter to filter by a specific clan. |
| **`GET /api/leagues/:clanTag`** | `SELECT ... WHERE clan_tag = $1` | **Get Clan's Saved CWL Setup**: Loads a specific clan's saved 7-day schedule (`lineup_size` of 15/25/30, `opted_in_tags`, `schedule_by_day` for Days 1–7, `opponents_by_day`, `availability_by_tag`, and `is_published`). |
| **`POST /api/leagues`** | `INSERT ... ON CONFLICT (id) DO UPDATE ... RETURNING ..., txid` | **Save / Upsert Full 7-Day CWL Schedule**: Verifies the user's Neon Auth Bearer token (`verifyNeonAuthUser`), upserts the clan's complete 7-day schedule, opted-in roster, availability map, publish state (`is_published`), and daily lineup size (`15`, `25`, `30`) into `cwl_leagues`, and returns `{ kind: "committed", txid, league }`. |
| **`PUT /api/leagues/:clanTag/availability/:playerTag`** | `INSERT INTO cwl_leagues ... ON CONFLICT (id) DO UPDATE SET opted_in_tags = $3, availability_by_tag = $4` | **Save Member CWL Opt-In & 7-Day Availability**: Allows a clan member (before the schedule is published) to opt in/out (`optedIn`) and mark each war day (`1`–`7`) as `"interested"`, `"preferably_not"`, or `"absolutely_not"` (defaulting to `"interested"` for the entire week when opted in). |
| **`POST /api/leagues/:clanTag/publish`** | `UPDATE cwl_leagues SET is_published = $2 WHERE clan_tag = $1 RETURNING ..., txid` | **Submit / Publish Schedule to Clan (Admin)**: Allows a Clan Admin to submit/publish (`isPublished: true`) or unpublish (`isPublished: false`) the clan's CWL schedule so clan members can view their assigned war days. |
| **`PATCH /api/leagues/:clanTag/day/:day`** | `UPDATE cwl_leagues SET schedule_by_day = jsonb_set(...) RETURNING ..., txid` | **Update Single War Day Lineup**: Updates only Day `1`–`7`'s assigned player array in Postgres using `jsonb_set` and returns `{ kind: "committed", txid, league }`. |
| **`DELETE /api/leagues/:clanTag`** | `DELETE FROM cwl_leagues WHERE clan_tag = $1 RETURNING id, txid` | **Reset / Delete Saved League Setup**: Removes a clan's saved schedule from Lakebase Postgres and returns its `txid`. |

---

## 3. Neon Realtime & Auth / System Routes
These routes connect the frontend to **Neon Realtime** (live SQL WebSocket subscriptions) and **Neon Auth** (Managed Better Auth).

| Method & Route | Neon Service | Explanation |
| :--- | :--- | :--- |
| **`POST /api/leagues/live`** | **Neon Realtime** (`@neon/realtime/server`) | **Seal Live SQL Query**: Takes `{ clanTag }` in the request body, builds a deterministic parameterized query (`clanLeagueLiveQuery(clanTag)`), and seals it on the backend using `NEON_REALTIME_SECRET` (`realtime.seal({ query })`). Returns a short-lived `SealedLiveQuery` capability that the React frontend passes to `useLiveQuery()` to receive live Postgres updates over WebSocket. |
| **`GET /api/neon/status`** | **Postgres + Auth + Realtime** | **Backend & Services Health Check**: Verifies connectivity to Lakebase Postgres (`SELECT current_database(), now()`), validates the caller's Neon Auth JWT against `NEON_AUTH_JWKS_URL`, and verifies Neon Realtime query sealing. |

---

## 4. User Linked In-Game Accounts Routes (`user_ingame_accounts`)
These routes link an online Neon Auth user to one or many Clash of Clans in-game players and their assigned clans, enforcing that every online user has at least 1 linked in-game account and can switch between them easily.

| Method & Route | DB Operation | Explanation |
| :--- | :--- | :--- |
| **`GET /api/accounts`** | `SELECT ... FROM user_ingame_accounts WHERE user_id = $1` | **List Linked In-Game Accounts**: Returns all in-game Clash of Clans player accounts (`player_tag`, `player_name`, `town_hall_level`, `clan_tag`, `clan_name`, `is_active`) linked to the authenticated online user. |
| **`POST /api/accounts`** | `INSERT INTO user_ingame_accounts ... ON CONFLICT (id) DO UPDATE` | **Link In-Game Account(s) & Clan**: Links one or more in-game players and their clan to the online user (used during Registration and in the "Manage In-Game Accounts" modal). Automatically sets the first linked player as `is_active = true`. |
| **`PATCH /api/accounts/:playerTag/activate`** | `UPDATE user_ingame_accounts SET is_active = (player_tag = $2)` | **Switch Active In-Game Player**: Switches the online user's active in-game character in a single click so the app context and clan switcher reflect the selected player. |
| **`PATCH /api/accounts/:playerTag/clan`** | `UPDATE user_ingame_accounts SET clan_tag = $3, clan_name = $4` | **Update In-Game Player's Clan**: Changes the clan associated with a specific linked in-game player. |
| **`PATCH /api/accounts/:playerTag/role`** | `UPDATE user_ingame_accounts SET role = $3 WHERE user_id = $1 AND player_tag = $2` | **Update In-Game Player's Role**: Updates the player's role (`"member"` for read-only normal user vs `"leader"` / `"coLeader"` / `"admin"` for schedule-editing clan admin). |
| **`DELETE /api/accounts/:playerTag`** | `DELETE FROM user_ingame_accounts WHERE user_id = $1 AND player_tag = $2` | **Remove Linked In-Game Account**: Removes a linked in-game player from the online user's profile, enforcing that the user cannot delete their last remaining in-game account (`total <= 1` returns HTTP 400). |


