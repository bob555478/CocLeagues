# API Routes Changelog (`API_ROUTES_CHANGES.md`)

This document describes all additions and changes made to [`API_ROUTES.md`](./API_ROUTES.md) to support:
1. Targeting the external backend at **`http://0.0.0.0:8000/`** (via [`src/services/backendClient.js`](./src/services/backendClient.js)) with automatic fallback to [`src/mocks/`](./src/mocks/index.js) when the backend is not responding.
2. **In-Game Player Search** during Registration and Account Management (`GET /api/coc/players`).
3. **Multi-Account In-Game Player & Clan Linking** (`user_ingame_accounts` table and `/api/accounts*` endpoints).
4. **Role-Based Schedule Access** (`Normal User / Member` read-only schedule view vs `Clan Admin / Leader` editable schedule view via `PATCH /api/accounts/:playerTag/role`).
5. **Pre-Publish Member Opt-In & 7-Day Availability (`Interested` / `Preferably Not` / `Absolutely Not`) & Admin Schedule Submission (`is_published`)** (`PUT /api/leagues/:clanTag/availability/:playerTag` and `POST /api/leagues/:clanTag/publish`).

---

## 1. Backend Base URL & Mock Fallback Architecture

- **Primary Backend Base URL**: `http://0.0.0.0:8000` (configurable via `VITE_BACKEND_URL`).
- **Fallback Behavior**: Every API call in [`src/services/cocApi.js`](./src/services/cocApi.js), [`src/lib/neonAuth.js`](./src/lib/neonAuth.js), and [`src/lib/neonRealtime.js`](./src/lib/neonRealtime.js) uses `requestBackendWithMockFallback()` in [`src/services/backendClient.js`](./src/services/backendClient.js). If `http://0.0.0.0:8000/` is unreachable or times out, the client automatically serves responses from the modular mock directory:
  - [`src/mocks/clansMock.js`](./src/mocks/clansMock.js) — Mock clans, full 40–50 member rosters, CWL league groups, and player search catalog.
  - [`src/mocks/accountsMock.js`](./src/mocks/accountsMock.js) — Mock linked in-game player accounts (`user_ingame_accounts`).
  - [`src/mocks/leaguesMock.js`](./src/mocks/leaguesMock.js) — Mock 7-day CWL schedules (`cwl_leagues`).
  - [`src/mocks/statusMock.js`](./src/mocks/statusMock.js) — Mock `/api/neon/status` response indicating offline/mock mode.

---

## 2. New Database Table Added (`user_ingame_accounts`)

To support linking one online user (`user_id`) to one or more Clash of Clans in-game players (`player_tag`) and their assigned clan (`clan_tag`), the following table was added to the database schema:

```sql
CREATE TABLE IF NOT EXISTS user_ingame_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  player_tag TEXT NOT NULL,
  player_name TEXT NOT NULL,
  town_hall_level INTEGER NOT NULL DEFAULT 16,
  trophies INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'member',
  clan_tag TEXT NOT NULL,
  clan_name TEXT NOT NULL,
  clan_badge_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ingame_accounts_user_id
  ON user_ingame_accounts (user_id);
```

Additionally, two columns were added to the existing `cwl_leagues` table to store member availability preferences and whether the Clan Admin has submitted/published the schedule:

```sql
ALTER TABLE cwl_leagues
  ADD COLUMN IF NOT EXISTS availability_by_tag JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE cwl_leagues
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
```

---

## 3. New Routes Added to `API_ROUTES.md`

### A. Clash of Clans Player Search Route

#### `GET /api/coc/players`
- **Purpose**: Searches Clash of Clans in-game players by name or `#TAG` so users can link their online account to their in-game player(s) and automatically detect the player's current clan.
- **Query Parameters**:
  - `q` (optional `string`): Player name substring or player tag (e.g. `Artorius` or `#P902L8Q`).
  - `clanTag` (optional `string`): Filter results to a specific clan tag (e.g. `#2PP`).
- **Response (`200 OK`)**:
  ```json
  {
    "items": [
      {
        "tag": "#P902L8Q",
        "name": "Artorius",
        "townHallLevel": 17,
        "expLevel": 254,
        "trophies": 5890,
        "role": "leader",
        "clan": {
          "tag": "#2PP",
          "name": "The Order",
          "clanLevel": 28,
          "badgeUrls": {
            "small": "...",
            "medium": "..."
          }
        }
      }
    ],
    "source": "live"
  }
  ```

---

### B. User Linked In-Game Accounts Routes (`/api/accounts`)

#### 1. `GET /api/accounts`
- **Purpose**: Lists all Clash of Clans in-game player accounts linked to the authenticated online user (`ORDER BY is_active DESC, created_at ASC`).
- **Query Parameters / Headers**:
  - `Authorization: Bearer <neon_auth_jwt>` (or `?userId=<id>` fallback).
- **Response (`200 OK`)**:
  ```json
  {
    "items": [
      {
        "id": "user_123:#P902L8Q",
        "user_id": "user_123",
        "player_tag": "#P902L8Q",
        "player_name": "Artorius",
        "town_hall_level": 17,
        "trophies": 5890,
        "role": "leader",
        "clan_tag": "#2PP",
        "clan_name": "The Order",
        "clan_badge_url": "...",
        "is_active": true,
        "created_at": "2026-10-30T12:00:00.000Z",
        "updated_at": "2026-10-30T12:00:00.000Z"
      }
    ],
    "accounts": [ ... ]
  }
  ```

#### 2. `POST /api/accounts`
- **Purpose**: Links one or more in-game players and their assigned clan to the online user (used during Registration and in the "Manage Linked In-Game Accounts" modal). Automatically marks the first linked account as `is_active = true` if the user has no active account yet.
- **Request Body**:
  ```json
  {
    "userId": "user_123",
    "accounts": [
      {
        "playerTag": "#P902L8Q",
        "playerName": "Artorius",
        "townHallLevel": 17,
        "trophies": 5890,
        "role": "leader",
        "clanTag": "#2PP",
        "clanName": "The Order",
        "clanBadgeUrl": "...",
        "isActive": true
      }
    ]
  }
  ```
- **Response (`200 OK`)**: Returns `{ "items": [...], "accounts": [...] }` with the user's updated list of linked in-game accounts.

#### 3. `PATCH /api/accounts/:playerTag/activate`
- **Purpose**: Switches the user's currently active in-game player (`is_active = true` for `:playerTag`, `is_active = false` for all other accounts of that user). Switching the active player automatically switches the UI to that player's clan and weekly schedule.
- **Request Body**: `{ "userId": "user_123" }`
- **Response (`200 OK`)**: Returns `{ "items": [...], "accounts": [...] }`.

#### 4. `PATCH /api/accounts/:playerTag/clan`
- **Purpose**: Updates the clan (`clan_tag`, `clan_name`, `clan_badge_url`) assigned to a specific linked in-game player.
- **Request Body**:
  ```json
  {
    "userId": "user_123",
    "clanTag": "#2Q89J0L2",
    "clanName": "Apex Legends CoC",
    "clanBadgeUrl": "..."
  }
  ```
- **Response (`200 OK`)**: Returns `{ "items": [...], "accounts": [...] }`.

#### 5. `PATCH /api/accounts/:playerTag/role`
- **Purpose**: Updates the clan role (`"member"` vs `"leader"` / `"coLeader"` / `"admin"`) of a linked in-game player, determining whether the user views the CWL schedule in **Member (Read-Only)** mode or **Clan Admin (Editable)** mode.
- **Request Body**:
  ```json
  {
    "userId": "user_123",
    "role": "leader"
  }
  ```
- **Response (`200 OK`)**: Returns `{ "items": [...], "accounts": [...] }`.

#### 6. `DELETE /api/accounts/:playerTag`
- **Purpose**: Unlinks an in-game player from the user's profile.
- **Validation Rule**: Enforces that a user **must have at least 1 linked in-game player**. If the user only has `1` linked account left, returns `400 Bad Request` with `{ "error": "Cannot remove your last in-game account. Every user must have at least 1 linked in-game player." }`. If the deleted account was active, promotes the first remaining account to `is_active = true`.
- **Response (`200 OK`)**: Returns `{ "items": [...], "accounts": [...] }`.

---

### C. Member Pre-Publish Availability & Admin Schedule Submission Routes (`/api/leagues`)

#### 1. `PUT /api/leagues/:clanTag/availability/:playerTag`
- **Purpose**: Before the Clan Admin publishes the CWL schedule (`is_published = false`), clan members can mark whether they are opting in to the league (`optedIn: true | false`) and set their availability for each of the 7 war days (`"interested"` | `"preferably_not"` | `"absolutely_not"`). When a member opts in, all 7 days default to `"interested"`.
- **Request Body**:
  ```json
  {
    "clanName": "The Order",
    "optedIn": true,
    "days": {
      "1": "interested",
      "2": "interested",
      "3": "preferably_not",
      "4": "absolutely_not",
      "5": "interested",
      "6": "interested",
      "7": "interested"
    }
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "kind": "committed",
    "txid": "10482",
    "league": {
      "id": "#2PP",
      "clan_tag": "#2PP",
      "clan_name": "The Order",
      "opted_in_tags": ["#P902L8Q"],
      "availability_by_tag": {
        "#P902L8Q": {
          "1": "interested",
          "2": "interested",
          "3": "preferably_not",
          "4": "absolutely_not",
          "5": "interested",
          "6": "interested",
          "7": "interested"
        }
      },
      "is_published": false
    }
  }
  ```

#### 2. `POST /api/leagues/:clanTag/publish` (and `isPublished` in `POST /api/leagues`)
- **Purpose**: Allows a Clan Admin to submit/publish (`isPublished: true`) the 7-day CWL schedule so that normal clan members can see the final schedule and which days they are playing, or unpublish (`isPublished: false`) to re-open pre-league availability.
- **Request Body**:
  ```json
  {
    "isPublished": true
  }
  ```
- **Response (`200 OK`)**: Returns `{ "kind": "committed", "txid": "...", "league": { ..., "is_published": true } }`.


