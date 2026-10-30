import { Hono } from "hono"
import { pool, ensureSchema, getDatabaseName } from "./db.js"
import { verifyNeonAuthUser } from "./auth.js"
import {
  realtime,
  clanLeagueLiveQuery,
  allLeaguesLiveQuery,
} from "./realtime.js"
import {
  MOCK_CLANS,
  normalizeClanTag,
  encodeClanTag,
  getAllDemoPlayers,
  isClanTagQuery,
} from "../services/cocApi.js"

export const apiApp = new Hono()

const COC_API_BASE = "https://api.clashofclans.com/v1"

function getServerCocToken(reqHeaders) {
  const customToken =
    reqHeaders.get?.("x-coc-api-token") || reqHeaders.get?.("X-Coc-Api-Token")
  if (customToken && customToken.trim()) {
    return customToken.trim()
  }
  return (
    process.env.COC_API_TOKEN ||
    process.env.VITE_COC_API_TOKEN ||
    ""
  ).trim()
}

// ============================================================================
// 1. SYSTEM, AUTH & NEON STATUS ROUTES
// ============================================================================

/**
 * GET /api/neon/status
 * Health check for Lakebase Postgres, Neon Auth (JWKS), and Neon Realtime.
 */
apiApp.get("/api/neon/status", async (c) => {
  await ensureSchema()
  const dbRes = await pool.query(
    `SELECT current_database() AS db, now() AS server_time, (SELECT count(*)::int FROM cwl_leagues) AS leagues_count`
  )
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const sealedSample = await realtime.seal({ query: allLeaguesLiveQuery })

  return c.json({
    ok: true,
    branch: process.env.NEON_BRANCH || "production",
    postgres: {
      connected: true,
      database: dbRes.rows[0]?.db || getDatabaseName(),
      serverTime: dbRes.rows[0]?.server_time,
      savedLeaguesCount: dbRes.rows[0]?.leagues_count ?? 0,
    },
    auth: {
      configured: Boolean(process.env.NEON_AUTH_BASE_URL),
      baseUrl: process.env.NEON_AUTH_BASE_URL,
      jwksUrl: process.env.NEON_AUTH_JWKS_URL,
      user: user || null,
    },
    realtime: {
      configured: Boolean(
        process.env.NEON_REALTIME_URL && process.env.NEON_REALTIME_SECRET
      ),
      url: process.env.NEON_REALTIME_URL,
      sampleQueryFingerprint: sealedSample.queryFingerprint,
      sampleExpiresAt: sealedSample.expiresAt,
    },
    cocApi: {
      hasServerToken: Boolean(
        process.env.COC_API_TOKEN || process.env.VITE_COC_API_TOKEN
      ),
    },
  })
})

// ============================================================================
// 2. CLASH OF CLANS (CoC) API ROUTES (Server-Side Proxy & Fallback)
// ============================================================================

/**
 * GET /api/coc/clans
 * Searches clans via Clash of Clans API `GET /v1/clans` using server-side JWT.
 * Query params: name, warFrequency, minClanLevel, minMembers, maxMembers, minClanPoints, locationId, limit
 */
apiApp.get("/api/coc/clans", async (c) => {
  const token = getServerCocToken(c.req.raw.headers)
  const url = new URL(c.req.url)
  const queryString = url.searchParams.toString()

  if (!token) {
    return c.json(
      {
        message:
          "No COC_API_TOKEN configured on backend. Set COC_API_TOKEN in .env.local or use Demo Mode.",
      },
      401
    )
  }

  const upstreamRes = await fetch(`${COC_API_BASE}/clans?${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  const data = await upstreamRes.json().catch(() => ({}))
  return c.json(data, upstreamRes.status)
})

/**
 * GET /api/coc/clans/:clanTag
 * Fetches a single clan profile & full memberList via `GET /v1/clans/{clanTag}`.
 */
apiApp.get("/api/coc/clans/:clanTag", async (c) => {
  const token = getServerCocToken(c.req.raw.headers)
  const rawTag = c.req.param("clanTag")
  const encodedTag = encodeClanTag(rawTag)

  if (!token) {
    const normalized = normalizeClanTag(rawTag)
    const demoClan = MOCK_CLANS.find(
      (item) => item.tag.toUpperCase() === normalized.toUpperCase()
    )
    if (demoClan) {
      return c.json(demoClan)
    }
    return c.json({ message: "Missing COC_API_TOKEN on backend" }, 401)
  }

  const upstreamRes = await fetch(`${COC_API_BASE}/clans/${encodedTag}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  const data = await upstreamRes.json().catch(() => ({}))
  return c.json(data, upstreamRes.status)
})

/**
 * GET /api/coc/clans/:clanTag/members
 * Fetches a clan's member roster via `GET /v1/clans/{clanTag}/members`.
 */
apiApp.get("/api/coc/clans/:clanTag/members", async (c) => {
  const token = getServerCocToken(c.req.raw.headers)
  const encodedTag = encodeClanTag(c.req.param("clanTag"))

  if (!token) {
    return c.json({ message: "Missing COC_API_TOKEN on backend" }, 401)
  }

  const upstreamRes = await fetch(
    `${COC_API_BASE}/clans/${encodedTag}/members`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  )

  const data = await upstreamRes.json().catch(() => ({}))
  return c.json(data, upstreamRes.status)
})

/**
 * GET /api/coc/clans/:clanTag/currentwar/leaguegroup
 * Fetches active Clan War League (CWL) group & 7-day war rounds via
 * `GET /v1/clans/{clanTag}/currentwar/leaguegroup`.
 */
apiApp.get("/api/coc/clans/:clanTag/currentwar/leaguegroup", async (c) => {
  const token = getServerCocToken(c.req.raw.headers)
  const encodedTag = encodeClanTag(c.req.param("clanTag"))

  if (!token) {
    return c.json({ message: "Missing COC_API_TOKEN on backend" }, 401)
  }

  const upstreamRes = await fetch(
    `${COC_API_BASE}/clans/${encodedTag}/currentwar/leaguegroup`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  )

  const data = await upstreamRes.json().catch(() => ({}))
  return c.json(data, upstreamRes.status)
})

// ============================================================================
// 3. DATABASE (LAKEBASE POSTGRES) & NEON REALTIME LEAGUE ROUTES
// ============================================================================

/**
 * POST /api/leagues/live
 * Seals a deterministic SQL query with NEON_REALTIME_SECRET so the client
 * can subscribe via Neon Realtime WebSocket (`useLiveQuery`).
 */
apiApp.post("/api/leagues/live", async (c) => {
  await ensureSchema()
  const body = await c.req.json().catch(() => ({}))
  const clanTag =
    typeof body?.clanTag === "string" && body.clanTag.trim()
      ? body.clanTag.trim().toUpperCase()
      : null

  const query = clanTag ? clanLeagueLiveQuery(clanTag) : allLeaguesLiveQuery
  const sealedQuery = await realtime.seal({ query })
  return c.json(sealedQuery)
})

/**
 * GET /api/leagues
 * Lists saved CWL league setups from Lakebase Postgres (optionally filtered by `?clanTag=`).
 */
apiApp.get("/api/leagues", async (c) => {
  await ensureSchema()
  const clanTag = c.req.query("clanTag")
  if (clanTag) {
    const { rows } = await pool.query(
      `SELECT id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at
       FROM cwl_leagues
       WHERE clan_tag = $1
       ORDER BY updated_at DESC
       LIMIT 10`,
      [clanTag.trim().toUpperCase()]
    )
    return c.json({ items: rows })
  }

  const { rows } = await pool.query(
    `SELECT id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at
     FROM cwl_leagues
     ORDER BY updated_at DESC
     LIMIT 25`
  )
  return c.json({ items: rows, accounts: rows })
})

/**
 * GET /api/leagues/:clanTag
 * Retrieves a single clan's saved 7-day CWL setup from Lakebase Postgres.
 */
apiApp.get("/api/leagues/:clanTag", async (c) => {
  await ensureSchema()
  const clanTag = normalizeClanTag(c.req.param("clanTag"))
  const { rows } = await pool.query(
    `SELECT id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at
     FROM cwl_leagues
     WHERE clan_tag = $1
     LIMIT 1`,
    [clanTag]
  )
  if (rows.length === 0) {
    return c.json({ error: `No saved league setup for ${clanTag}` }, 404)
  }
  return c.json({ league: rows[0] })
})

/**
 * POST /api/leagues
 * Creates or updates a clan's 7-day CWL schedule in Lakebase Postgres (`cwl_leagues`)
 * and returns `pg_current_xact_id()::text AS txid` in one round trip for Neon Realtime.
 */
apiApp.post("/api/leagues", async (c) => {
  await ensureSchema()
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const body = await c.req.json()

  const clanTag = String(body.clanTag || "").trim().toUpperCase()
  const clanName = String(body.clanName || clanTag).trim()
  if (!clanTag) {
    return c.json({ error: "clanTag is required" }, 400)
  }

  const userId = user?.id || String(body.userId || "anonymous")
  const userEmail = user?.email || body.userEmail || null
  const lineupSize = Number(body.lineupSize) || 15
  const optedInTags = Array.isArray(body.optedInTags) ? body.optedInTags : []
  const scheduleByDay =
    body.scheduleByDay && typeof body.scheduleByDay === "object"
      ? body.scheduleByDay
      : {}
  const opponentsByDay =
    body.opponentsByDay && typeof body.opponentsByDay === "object"
      ? body.opponentsByDay
      : {}
  const availabilityByTag =
    body.availabilityByTag && typeof body.availabilityByTag === "object"
      ? body.availabilityByTag
      : {}
  const isPublished =
    typeof body.isPublished === "boolean" ? body.isPublished : false

  const id = clanTag

  const { rows } = await pool.query(
    `INSERT INTO cwl_leagues (
       id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11, now()
     )
     ON CONFLICT (id) DO UPDATE SET
       clan_name = EXCLUDED.clan_name,
       user_id = EXCLUDED.user_id,
       user_email = EXCLUDED.user_email,
       lineup_size = EXCLUDED.lineup_size,
       opted_in_tags = EXCLUDED.opted_in_tags,
       schedule_by_day = EXCLUDED.schedule_by_day,
       opponents_by_day = EXCLUDED.opponents_by_day,
       availability_by_tag = COALESCE(EXCLUDED.availability_by_tag, cwl_leagues.availability_by_tag),
       is_published = EXCLUDED.is_published,
       updated_at = now()
     RETURNING id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at, pg_current_xact_id()::text AS txid`,
    [
      id,
      clanTag,
      clanName,
      userId,
      userEmail,
      lineupSize,
      JSON.stringify(optedInTags),
      JSON.stringify(scheduleByDay),
      JSON.stringify(opponentsByDay),
      JSON.stringify(availabilityByTag),
      isPublished,
    ]
  )

  const saved = rows[0]
  return c.json({
    kind: "committed",
    txid: saved.txid,
    league: saved,
  })
})

/**
 * PUT /api/leagues/:clanTag/availability/:playerTag
 * Allows a clan member to opt in/out of the league and mark their 7-day availability
 * ("interested" | "preferably_not" | "absolutely_not", defaulting to "interested" for all 7 days)
 * before the admin publishes the schedule.
 */
apiApp.put("/api/leagues/:clanTag/availability/:playerTag", async (c) => {
  await ensureSchema()
  const clanTag = normalizeClanTag(c.req.param("clanTag"))
  const playerTag = normalizeClanTag(c.req.param("playerTag"))
  const body = await c.req.json().catch(() => ({}))

  const optedIn = typeof body.optedIn === "boolean" ? body.optedIn : true
  const clanName = String(body.clanName || clanTag).trim()
  const defaultDays = {
    1: "interested",
    2: "interested",
    3: "interested",
    4: "interested",
    5: "interested",
    6: "interested",
    7: "interested",
  }
  const days =
    body.days && typeof body.days === "object"
      ? { ...defaultDays, ...body.days }
      : defaultDays

  // Ensure a row exists for this clan
  const existingRes = await pool.query(
    `SELECT opted_in_tags, availability_by_tag FROM cwl_leagues WHERE clan_tag = $1 LIMIT 1`,
    [clanTag]
  )

  let optedInTags = []
  let availabilityByTag = {}

  if (existingRes.rows.length > 0) {
    optedInTags = Array.isArray(existingRes.rows[0].opted_in_tags)
      ? [...existingRes.rows[0].opted_in_tags]
      : []
    availabilityByTag =
      existingRes.rows[0].availability_by_tag &&
      typeof existingRes.rows[0].availability_by_tag === "object"
        ? { ...existingRes.rows[0].availability_by_tag }
        : {}
  }

  const normalizedUpper = playerTag.toUpperCase()
  const filteredTags = optedInTags.filter(
    (t) => String(t).toUpperCase() !== normalizedUpper
  )
  if (optedIn) {
    filteredTags.push(playerTag)
  }
  availabilityByTag[playerTag] = days

  const { rows } = await pool.query(
    `INSERT INTO cwl_leagues (
       id, clan_tag, clan_name, user_id, lineup_size, opted_in_tags, availability_by_tag, is_published, updated_at
     ) VALUES (
       $1, $1, $2, 'member-availability', 15, $3::jsonb, $4::jsonb, false, now()
     )
     ON CONFLICT (id) DO UPDATE SET
       opted_in_tags = $3::jsonb,
       availability_by_tag = $4::jsonb,
       updated_at = now()
     RETURNING id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at, pg_current_xact_id()::text AS txid`,
    [
      clanTag,
      clanName,
      JSON.stringify(filteredTags),
      JSON.stringify(availabilityByTag),
    ]
  )

  return c.json({
    kind: "committed",
    txid: rows[0].txid,
    league: rows[0],
  })
})

/**
 * POST /api/leagues/:clanTag/publish
 * Clan Admin endpoint to submit/publish (`isPublished: true`) or unpublish (`isPublished: false`)
 * the clan's 7-day CWL schedule so clan members can see it.
 */
apiApp.post("/api/leagues/:clanTag/publish", async (c) => {
  await ensureSchema()
  const clanTag = normalizeClanTag(c.req.param("clanTag"))
  const body = await c.req.json().catch(() => ({}))
  const isPublished =
    typeof body.isPublished === "boolean" ? body.isPublished : true

  const { rows } = await pool.query(
    `UPDATE cwl_leagues
     SET is_published = $2,
         updated_at = now()
     WHERE clan_tag = $1
     RETURNING id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at, pg_current_xact_id()::text AS txid`,
    [clanTag, isPublished]
  )

  if (rows.length === 0) {
    return c.json({ error: `League ${clanTag} not found` }, 404)
  }

  return c.json({
    kind: "committed",
    txid: rows[0].txid,
    league: rows[0],
  })
})

/**
 * PATCH /api/leagues/:clanTag/day/:day
 * Updates a single war day's player lineup or opponent name in Lakebase Postgres,
 * returning `txid` for Neon Realtime confirmation.
 */
apiApp.patch("/api/leagues/:clanTag/day/:day", async (c) => {
  await ensureSchema()
  const clanTag = normalizeClanTag(c.req.param("clanTag"))
  const day = String(c.req.param("day"))
  const body = await c.req.json()
  const playerTags = Array.isArray(body.playerTags) ? body.playerTags : []

  const { rows } = await pool.query(
    `UPDATE cwl_leagues
     SET schedule_by_day = jsonb_set(COALESCE(schedule_by_day, '{}'::jsonb), $2::text[], $3::jsonb, true),
         updated_at = now()
     WHERE clan_tag = $1
     RETURNING id, clan_tag, clan_name, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, updated_at, pg_current_xact_id()::text AS txid`,
    [clanTag, [day], JSON.stringify(playerTags)]
  )

  if (rows.length === 0) {
    return c.json({ error: `League ${clanTag} not found` }, 404)
  }

  return c.json({
    kind: "committed",
    txid: rows[0].txid,
    league: rows[0],
  })
})

/**
 * DELETE /api/leagues/:clanTag
 * Deletes a clan's saved CWL schedule from Lakebase Postgres.
 */
apiApp.delete("/api/leagues/:clanTag", async (c) => {
  await ensureSchema()
  const clanTag = normalizeClanTag(c.req.param("clanTag"))
  const { rows } = await pool.query(
    `DELETE FROM cwl_leagues WHERE clan_tag = $1 RETURNING id, pg_current_xact_id()::text AS txid`,
    [clanTag]
  )
  if (rows.length === 0) {
    return c.json({ error: `League ${clanTag} not found` }, 404)
  }
  return c.json({ kind: "committed", txid: rows[0].txid, deletedId: rows[0].id })
})

// ============================================================================
// 4. IN-GAME PLAYER SEARCH & USER IN-GAME ACCOUNTS ROUTES
// ============================================================================

/**
 * GET /api/coc/players
 * Searches in-game players by `?q=` (player name or #TAG) and optional `?clanTag=`.
 * Uses official CoC API `GET /v1/players/{playerTag}` when a live token + #TAG is used,
 * and searches across known clan rosters / demo players.
 */
apiApp.get("/api/coc/players", async (c) => {
  const token = getServerCocToken(c.req.raw.headers)
  const q = (c.req.query("q") || "").trim()
  const clanTag = (c.req.query("clanTag") || "").trim()

  // 1. If live CoC API token is present and query is a player tag, query GET /v1/players/{playerTag}
  if (token && isClanTagQuery(q)) {
    const encodedTag = encodeClanTag(q)
    const upstreamRes = await fetch(`${COC_API_BASE}/players/${encodedTag}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
    if (upstreamRes.ok) {
      const player = await upstreamRes.json()
      return c.json({ items: [player], source: "live" })
    }
  }

  // 2. Search across demo/cached player catalog
  const allPlayers = getAllDemoPlayers()
  const lower = q.toLowerCase()
  const cleanTag = lower.replace(/^#/, "")

  const matches = allPlayers.filter((p) => {
    if (
      clanTag &&
      p.clan?.tag?.toUpperCase() !== normalizeClanTag(clanTag).toUpperCase()
    ) {
      return false
    }
    if (!lower) return true
    return (
      p.name.toLowerCase().includes(lower) ||
      p.tag.toLowerCase().replace(/^#/, "").includes(cleanTag)
    )
  })

  // If the user typed a valid-looking `#TAG` not in the static catalog, synthesize a linkable player
  if (matches.length === 0 && isClanTagQuery(q)) {
    const normalized = normalizeClanTag(q)
    const defaultClan =
      MOCK_CLANS.find(
        (cl) =>
          clanTag &&
          cl.tag.toUpperCase() === normalizeClanTag(clanTag).toUpperCase()
      ) || MOCK_CLANS[0]
    return c.json({
      items: [
        {
          tag: normalized,
          name: `Chief ${normalized.slice(1)}`,
          townHallLevel: 16,
          expLevel: 210,
          trophies: 4800,
          role: "member",
          clan: {
            tag: defaultClan.tag,
            name: defaultClan.name,
            clanLevel: defaultClan.clanLevel,
            badgeUrls: defaultClan.badgeUrls,
          },
        },
      ],
      source: "demo",
    })
  }

  return c.json({ items: matches.slice(0, 20), source: "demo" })
})

/**
 * GET /api/accounts
 * Returns all linked in-game accounts for the authenticated online user.
 */
apiApp.get("/api/accounts", async (c) => {
  await ensureSchema()
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const userId = user?.id || c.req.query("userId")
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const { rows } = await pool.query(
    `SELECT id, user_id, player_tag, player_name, town_hall_level, trophies, role, clan_tag, clan_name, clan_badge_url, is_active, created_at, updated_at
     FROM user_ingame_accounts
     WHERE user_id = $1
     ORDER BY is_active DESC, created_at ASC`,
    [userId]
  )

  return c.json({ items: rows, accounts: rows })
})

/**
 * POST /api/accounts
 * Links one or more in-game player accounts (with their clan) to the online user.
 * Body can be `{ accounts: [...] }` or a single account `{ playerTag, playerName, clanTag, clanName, ... }`.
 */
apiApp.post("/api/accounts", async (c) => {
  await ensureSchema()
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const body = await c.req.json()
  const userId = user?.id || body.userId
  if (!userId) {
    return c.json({ error: "Unauthorized: missing user session" }, 401)
  }

  const rawList = Array.isArray(body.accounts) ? body.accounts : [body]
  const validAccounts = rawList
    .map((acc) => ({
      playerTag: normalizeClanTag(String(acc.playerTag || acc.tag || "")),
      playerName: String(acc.playerName || acc.name || "").trim(),
      townHallLevel: Number(acc.townHallLevel) || 16,
      trophies: Number(acc.trophies) || 0,
      role: String(acc.role || "member"),
      clanTag: normalizeClanTag(String(acc.clanTag || acc.clan?.tag || "")),
      clanName: String(acc.clanName || acc.clan?.name || "").trim(),
      clanBadgeUrl:
        acc.clanBadgeUrl ||
        acc.clan?.badgeUrls?.small ||
        acc.clan?.badgeUrls?.medium ||
        null,
      setActive: Boolean(acc.setActive),
    }))
    .filter(
      (acc) =>
        acc.playerTag.length >= 2 &&
        acc.playerName &&
        acc.clanTag.length >= 2 &&
        acc.clanName
    )

  if (validAccounts.length === 0) {
    return c.json(
      {
        error:
          "At least 1 valid in-game player account and its clan must be provided.",
      },
      400
    )
  }

  // Check if user already has any active account
  const existingRes = await pool.query(
    `SELECT player_tag, is_active FROM user_ingame_accounts WHERE user_id = $1`,
    [userId]
  )
  const hasExistingActive = existingRes.rows.some((r) => r.is_active)

  for (let i = 0; i < validAccounts.length; i++) {
    const acc = validAccounts[i]
    const id = `${userId}:${acc.playerTag}`
    const shouldActivate =
      acc.setActive || (!hasExistingActive && i === 0)

    if (shouldActivate) {
      await pool.query(
        `UPDATE user_ingame_accounts SET is_active = false WHERE user_id = $1`,
        [userId]
      )
    }

    await pool.query(
      `INSERT INTO user_ingame_accounts (
         id, user_id, player_tag, player_name, town_hall_level, trophies, role, clan_tag, clan_name, clan_badge_url, is_active, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now()
       )
       ON CONFLICT (id) DO UPDATE SET
         player_name = EXCLUDED.player_name,
         town_hall_level = EXCLUDED.town_hall_level,
         trophies = EXCLUDED.trophies,
         role = EXCLUDED.role,
         clan_tag = EXCLUDED.clan_tag,
         clan_name = EXCLUDED.clan_name,
         clan_badge_url = COALESCE(EXCLUDED.clan_badge_url, user_ingame_accounts.clan_badge_url),
         is_active = CASE WHEN EXCLUDED.is_active THEN true ELSE user_ingame_accounts.is_active END,
         updated_at = now()`,
      [
        id,
        userId,
        acc.playerTag,
        acc.playerName,
        acc.townHallLevel,
        acc.trophies,
        acc.role,
        acc.clanTag,
        acc.clanName,
        acc.clanBadgeUrl,
        shouldActivate,
      ]
    )
  }

  const { rows } = await pool.query(
    `SELECT id, user_id, player_tag, player_name, town_hall_level, trophies, role, clan_tag, clan_name, clan_badge_url, is_active, created_at, updated_at
     FROM user_ingame_accounts
     WHERE user_id = $1
     ORDER BY is_active DESC, created_at ASC`,
    [userId]
  )

  return c.json({ items: rows, accounts: rows })
})

/**
 * PATCH /api/accounts/:playerTag/activate
 * Switches the online user's active in-game account.
 */
apiApp.patch("/api/accounts/:playerTag/activate", async (c) => {
  await ensureSchema()
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const body = await c.req.json().catch(() => ({}))
  const userId = user?.id || body.userId
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const playerTag = normalizeClanTag(c.req.param("playerTag"))

  await pool.query(
    `UPDATE user_ingame_accounts
     SET is_active = (player_tag = $2),
         updated_at = CASE WHEN player_tag = $2 THEN now() ELSE updated_at END
     WHERE user_id = $1`,
    [userId, playerTag]
  )

  const { rows } = await pool.query(
    `SELECT id, user_id, player_tag, player_name, town_hall_level, trophies, role, clan_tag, clan_name, clan_badge_url, is_active, created_at, updated_at
     FROM user_ingame_accounts
     WHERE user_id = $1
     ORDER BY is_active DESC, created_at ASC`,
    [userId]
  )

  return c.json({ items: rows, accounts: rows })
})

/**
 * PATCH /api/accounts/:playerTag/clan
 * Updates the clan associated with one of the user's linked in-game accounts.
 */
apiApp.patch("/api/accounts/:playerTag/clan", async (c) => {
  await ensureSchema()
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const body = await c.req.json()
  const userId = user?.id || body.userId
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const playerTag = normalizeClanTag(c.req.param("playerTag"))
  const clanTag = normalizeClanTag(String(body.clanTag || ""))
  const clanName = String(body.clanName || "").trim()
  const clanBadgeUrl = body.clanBadgeUrl || null

  if (!clanTag || !clanName) {
    return c.json({ error: "clanTag and clanName are required" }, 400)
  }

  await pool.query(
    `UPDATE user_ingame_accounts
     SET clan_tag = $3,
         clan_name = $4,
         clan_badge_url = COALESCE($5, clan_badge_url),
         updated_at = now()
     WHERE user_id = $1 AND player_tag = $2`,
    [userId, playerTag, clanTag, clanName, clanBadgeUrl]
  )

  const { rows } = await pool.query(
    `SELECT id, user_id, player_tag, player_name, town_hall_level, trophies, role, clan_tag, clan_name, clan_badge_url, is_active, created_at, updated_at
     FROM user_ingame_accounts
     WHERE user_id = $1
     ORDER BY is_active DESC, created_at ASC`,
    [userId]
  )

  return c.json({ items: rows, accounts: rows })
})

/**
 * PATCH /api/accounts/:playerTag/role
 * Updates the role ("member" | "admin" | "coLeader" | "leader") for a linked in-game account.
 */
apiApp.patch("/api/accounts/:playerTag/role", async (c) => {
  await ensureSchema()
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const body = await c.req.json().catch(() => ({}))
  const userId = user?.id || body.userId
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const playerTag = normalizeClanTag(c.req.param("playerTag"))
  const role = String(body.role || "member").trim()

  await pool.query(
    `UPDATE user_ingame_accounts
     SET role = $3,
         updated_at = now()
     WHERE user_id = $1 AND player_tag = $2`,
    [userId, playerTag, role]
  )

  const { rows } = await pool.query(
    `SELECT id, user_id, player_tag, player_name, town_hall_level, trophies, role, clan_tag, clan_name, clan_badge_url, is_active, created_at, updated_at
     FROM user_ingame_accounts
     WHERE user_id = $1
     ORDER BY is_active DESC, created_at ASC`,
    [userId]
  )

  return c.json({ items: rows, accounts: rows })
})

/**
 * DELETE /api/accounts/:playerTag
 * Unlinks an in-game account, enforcing the rule that every online user MUST have at least 1 in-game account.
 */
apiApp.delete("/api/accounts/:playerTag", async (c) => {
  await ensureSchema()
  const user = await verifyNeonAuthUser(c.req.raw.headers)
  const userId = user?.id || c.req.query("userId")
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const playerTag = normalizeClanTag(c.req.param("playerTag"))

  const countRes = await pool.query(
    `SELECT count(*)::int AS total FROM user_ingame_accounts WHERE user_id = $1`,
    [userId]
  )
  if ((countRes.rows[0]?.total || 0) <= 1) {
    return c.json(
      {
        error:
          "Cannot remove your last in-game account. Every user must have at least 1 linked in-game player.",
      },
      400
    )
  }

  await pool.query(
    `DELETE FROM user_ingame_accounts WHERE user_id = $1 AND player_tag = $2`,
    [userId, playerTag]
  )

  // Ensure at least one remaining account is marked active
  const remainingRes = await pool.query(
    `SELECT player_tag, is_active FROM user_ingame_accounts WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  )
  if (
    remainingRes.rows.length > 0 &&
    !remainingRes.rows.some((r) => r.is_active)
  ) {
    await pool.query(
      `UPDATE user_ingame_accounts SET is_active = true WHERE user_id = $1 AND player_tag = $2`,
      [userId, remainingRes.rows[0].player_tag]
    )
  }

  const { rows } = await pool.query(
    `SELECT id, user_id, player_tag, player_name, town_hall_level, trophies, role, clan_tag, clan_name, clan_badge_url, is_active, created_at, updated_at
     FROM user_ingame_accounts
     WHERE user_id = $1
     ORDER BY is_active DESC, created_at ASC`,
    [userId]
  )

  return c.json({ items: rows, accounts: rows })
})
