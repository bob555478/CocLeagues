import { createRealtime, rawSql } from "@neon/realtime/server"
import dotenv from "dotenv"
import { getDatabaseName } from "./db.js"

dotenv.config({ path: ".env.local" })
dotenv.config()

export const realtime = createRealtime({
  secret: process.env.NEON_REALTIME_SECRET,
  db: getDatabaseName(),
})

/**
 * Deterministic read-only live SQL query for a specific clan's CWL setup rows.
 * Follows neon-realtime rules: single SELECT, no semicolon, $1 parameter placeholder.
 */
export function clanLeagueLiveQuery(clanTag) {
  return rawSql(
    `SELECT id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at FROM cwl_leagues WHERE clan_tag = $1 ORDER BY updated_at DESC LIMIT 10`,
    [clanTag]
  )
}

/**
 * Deterministic read-only live SQL query for all saved CWL league setups.
 */
export const allLeaguesLiveQuery = rawSql(
  `SELECT id, clan_tag, clan_name, user_id, user_email, lineup_size, opted_in_tags, schedule_by_day, opponents_by_day, availability_by_tag, is_published, updated_at FROM cwl_leagues ORDER BY updated_at DESC LIMIT 25`
)

