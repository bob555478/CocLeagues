import pg from "pg"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

const { Pool, Client } = pg

function normalizeConnectionString(url) {
  if (!url) return ""
  return url.replace("sslmode=require", "sslmode=verify-full")
}

// Application query traffic uses the pooled connection (`DATABASE_URL`)
export const pool = new Pool({
  connectionString: normalizeConnectionString(process.env.DATABASE_URL),
})

// Prevent scale-to-zero idle disconnects from crashing the Node process
pool.on("error", (error) => {
  console.error("[Neon Postgres Pool Error]", error.message)
})

export function getDatabaseName() {
  try {
    const u = new URL(process.env.DATABASE_URL)
    return u.pathname.replace(/^\//, "") || "neondb"
  } catch {
    return "neondb"
  }
}

let schemaInitialized = false

/**
 * Runs DDL migrations over the direct/unpooled connection (`DATABASE_URL_UNPOOLED`)
 * per neon-postgres best practices.
 */
export async function ensureSchema() {
  if (schemaInitialized) return
  const directUrl = normalizeConnectionString(
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
  )
  const client = new Client({ connectionString: directUrl })
  await client.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS cwl_leagues (
        id TEXT PRIMARY KEY,
        clan_tag TEXT NOT NULL,
        clan_name TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_email TEXT,
        lineup_size INTEGER NOT NULL DEFAULT 15,
        opted_in_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        schedule_by_day JSONB NOT NULL DEFAULT '{}'::jsonb,
        opponents_by_day JSONB NOT NULL DEFAULT '{}'::jsonb,
        availability_by_tag JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_published BOOLEAN NOT NULL DEFAULT false,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE cwl_leagues
        ADD COLUMN IF NOT EXISTS availability_by_tag JSONB NOT NULL DEFAULT '{}'::jsonb;
      ALTER TABLE cwl_leagues
        ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

      CREATE TABLE IF NOT EXISTS user_ingame_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        player_tag TEXT NOT NULL,
        player_name TEXT NOT NULL,
        town_hall_level INTEGER NOT NULL DEFAULT 16,
        trophies INTEGER NOT NULL DEFAULT 0,
        role TEXT DEFAULT 'member',
        clan_tag TEXT NOT NULL,
        clan_name TEXT NOT NULL,
        clan_badge_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)
    schemaInitialized = true
  } finally {
    await client.end()
  }
}

