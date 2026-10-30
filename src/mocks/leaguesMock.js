import { getMockClanDetails, normalizeTag } from "./clansMock"
import {
  DEFAULT_OPPONENTS,
  generateFairLeagueSchedule,
  MIN_PLAYS_FOR_OPTED_IN,
  createDefaultPlayerAvailability,
} from "@/lib/leagueRules"

const LEAGUES_STORAGE_KEY = "coc_mock_cwl_leagues_v2"

function readAllMockLeaguesStore() {
  if (typeof localStorage === "undefined") return {}
  try {
    const raw = localStorage.getItem(LEAGUES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAllMockLeaguesStore(store) {
  if (typeof localStorage === "undefined") return
  try {
    localStorage.setItem(LEAGUES_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage quota errors
  }
}

function buildDefaultMockLeagueForClan(clanTag) {
  const normalized = normalizeTag(clanTag)
  const clan = getMockClanDetails(normalized)
  const members = Array.isArray(clan.memberList) ? clan.memberList : []
  const lineupSize = 15
  const maxFor3Wars = Math.floor((lineupSize * 7) / MIN_PLAYS_FOR_OPTED_IN)
  const optedInTags = members
    .filter((m) => m.warPreference !== "out")
    .slice(0, maxFor3Wars)
    .map((m) => m.tag)

  const availabilityByTag = {}
  for (const tag of optedInTags) {
    availabilityByTag[tag] = createDefaultPlayerAvailability()
  }

  const scheduleByDay = generateFairLeagueSchedule({
    members,
    optedInTags,
    lineupSize,
    availabilityByTag,
  })

  const now = new Date().toISOString()
  return {
    id: normalized,
    clan_tag: normalized,
    clan_name: clan.name,
    user_id: "mock-leader",
    user_email: "leader@clan.gg",
    lineup_size: lineupSize,
    opted_in_tags: optedInTags,
    schedule_by_day: scheduleByDay,
    opponents_by_day: { ...DEFAULT_OPPONENTS },
    availability_by_tag: availabilityByTag,
    is_published: false,
    created_at: now,
    updated_at: now,
  }
}

export function listMockLeagues(clanTag = null) {
  const store = readAllMockLeaguesStore()
  if (clanTag) {
    const normalized = normalizeTag(clanTag)
    if (!store[normalized]) {
      store[normalized] = buildDefaultMockLeagueForClan(normalized)
      writeAllMockLeaguesStore(store)
    }
    return {
      items: [store[normalized]],
      source: "mock",
    }
  }
  const items = Object.values(store)
  return { items, source: "mock" }
}

export function getMockLeagueByClanTag(clanTag) {
  const normalized = normalizeTag(clanTag)
  const store = readAllMockLeaguesStore()
  if (!store[normalized]) {
    store[normalized] = buildDefaultMockLeagueForClan(normalized)
    writeAllMockLeaguesStore(store)
  }
  return {
    league: store[normalized],
    source: "mock",
  }
}

export function saveMockLeague(payload = {}) {
  const normalized = normalizeTag(payload.clanTag || payload.id || "#2PP")
  const store = readAllMockLeaguesStore()
  const existing =
    store[normalized] || buildDefaultMockLeagueForClan(normalized)
  const now = new Date().toISOString()

  const updated = {
    ...existing,
    id: normalized,
    clan_tag: normalized,
    clan_name: payload.clanName || existing.clan_name,
    user_id: payload.userId || existing.user_id || "mock-user",
    user_email: payload.userEmail || existing.user_email || null,
    lineup_size: Number(payload.lineupSize) || existing.lineup_size || 15,
    opted_in_tags: Array.isArray(payload.optedInTags)
      ? payload.optedInTags
      : existing.opted_in_tags,
    schedule_by_day:
      payload.scheduleByDay && typeof payload.scheduleByDay === "object"
        ? payload.scheduleByDay
        : existing.schedule_by_day,
    opponents_by_day:
      payload.opponentsByDay && typeof payload.opponentsByDay === "object"
        ? payload.opponentsByDay
        : existing.opponents_by_day,
    availability_by_tag:
      payload.availabilityByTag && typeof payload.availabilityByTag === "object"
        ? payload.availabilityByTag
        : existing.availability_by_tag || {},
    is_published:
      typeof payload.isPublished === "boolean"
        ? payload.isPublished
        : Boolean(existing.is_published),
    updated_at: now,
  }

  store[normalized] = updated
  writeAllMockLeaguesStore(store)

  return {
    kind: "committed",
    txid: `mock-${Date.now()}`,
    league: updated,
    source: "mock",
  }
}

export function updateMockPlayerAvailability(
  clanTag,
  playerTag,
  { optedIn = true, days = null, clanName = null } = {}
) {
  const normalizedClan = normalizeTag(clanTag)
  const normalizedPlayer = normalizeTag(playerTag)
  const store = readAllMockLeaguesStore()
  const existing =
    store[normalizedClan] || buildDefaultMockLeagueForClan(normalizedClan)

  const currentOptedIn = Array.isArray(existing.opted_in_tags)
    ? existing.opted_in_tags.filter(
        (t) => String(t).toUpperCase() !== normalizedPlayer.toUpperCase()
      )
    : []

  if (optedIn) {
    currentOptedIn.push(normalizedPlayer)
  }

  const defaultDays = createDefaultPlayerAvailability()
  const nextAvailabilityByTag = {
    ...(existing.availability_by_tag || {}),
    [normalizedPlayer]:
      days && typeof days === "object"
        ? { ...defaultDays, ...days }
        : defaultDays,
  }

  const updated = {
    ...existing,
    clan_name: clanName || existing.clan_name,
    opted_in_tags: currentOptedIn,
    availability_by_tag: nextAvailabilityByTag,
    updated_at: new Date().toISOString(),
  }

  store[normalizedClan] = updated
  writeAllMockLeaguesStore(store)

  return {
    kind: "committed",
    txid: `mock-${Date.now()}`,
    league: updated,
    source: "mock",
  }
}

export function publishMockLeague(clanTag, { isPublished = true } = {}) {
  const normalized = normalizeTag(clanTag)
  const store = readAllMockLeaguesStore()
  const existing =
    store[normalized] || buildDefaultMockLeagueForClan(normalized)

  const updated = {
    ...existing,
    is_published: Boolean(isPublished),
    updated_at: new Date().toISOString(),
  }

  store[normalized] = updated
  writeAllMockLeaguesStore(store)

  return {
    kind: "committed",
    txid: `mock-${Date.now()}`,
    league: updated,
    source: "mock",
  }
}

export function updateMockLeagueDay(clanTag, day, playerTags = []) {
  const normalized = normalizeTag(clanTag)
  const store = readAllMockLeaguesStore()
  const existing =
    store[normalized] || buildDefaultMockLeagueForClan(normalized)

  const updated = {
    ...existing,
    schedule_by_day: {
      ...(existing.schedule_by_day || {}),
      [String(day)]: Array.isArray(playerTags) ? playerTags : [],
    },
    updated_at: new Date().toISOString(),
  }

  store[normalized] = updated
  writeAllMockLeaguesStore(store)

  return {
    kind: "committed",
    txid: `mock-${Date.now()}`,
    league: updated,
    source: "mock",
  }
}

export function deleteMockLeague(clanTag) {
  const normalized = normalizeTag(clanTag)
  const store = readAllMockLeaguesStore()
  delete store[normalized]
  writeAllMockLeaguesStore(store)

  return {
    kind: "committed",
    txid: `mock-${Date.now()}`,
    deletedId: normalized,
    source: "mock",
  }
}
