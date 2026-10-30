import { MOCK_CLANS, normalizeTag } from "./clansMock"

const ACCOUNTS_STORAGE_KEY = "coc_mock_user_ingame_accounts_v1"

function getDefaultSeedAccounts(userId) {
  const defaultClan = MOCK_CLANS[0]
  return [
    {
      id: `${userId}:#P902L8Q`,
      user_id: userId,
      player_tag: "#P902L8Q",
      player_name: "Artorius",
      town_hall_level: 17,
      trophies: 5890,
      role: "leader",
      clan_tag: defaultClan.tag,
      clan_name: defaultClan.name,
      clan_badge_url: defaultClan.badgeUrls.small,
      is_active: true,
      created_at: "2026-10-30T12:00:00.000Z",
      updated_at: "2026-10-30T12:00:00.000Z",
    },
    {
      id: `${userId}:#2PP014Q`,
      user_id: userId,
      player_tag: "#2PP014Q",
      player_name: "RootRider",
      town_hall_level: 16,
      trophies: 5120,
      role: "member",
      clan_tag: defaultClan.tag,
      clan_name: defaultClan.name,
      clan_badge_url: defaultClan.badgeUrls.small,
      is_active: false,
      created_at: "2026-10-30T12:01:00.000Z",
      updated_at: "2026-10-30T12:01:00.000Z",
    },
  ]
}

function readAllMockAccountsStore() {
  if (typeof localStorage === "undefined") return {}
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAllMockAccountsStore(store) {
  if (typeof localStorage === "undefined") return
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage quota errors
  }
}

function sortAccounts(list) {
  return [...list].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1
    if (!a.is_active && b.is_active) return 1
    return String(a.created_at).localeCompare(String(b.created_at))
  })
}

export function getMockUserAccounts(userId = "demo-user") {
  const store = readAllMockAccountsStore()
  let list = store[userId]
  if (!Array.isArray(list) || list.length === 0) {
    list = getDefaultSeedAccounts(userId)
    store[userId] = list
    writeAllMockAccountsStore(store)
  }
  const sorted = sortAccounts(list)
  return { items: sorted, accounts: sorted, source: "mock" }
}

export function linkMockUserAccounts(userId = "demo-user", rawAccounts = []) {
  const store = readAllMockAccountsStore()
  const existing = Array.isArray(store[userId]) ? [...store[userId]] : []

  const incoming = (Array.isArray(rawAccounts) ? rawAccounts : [rawAccounts])
    .map((acc) => ({
      playerTag: normalizeTag(acc.playerTag || acc.tag || ""),
      playerName: String(acc.playerName || acc.name || "").trim(),
      townHallLevel: Number(acc.townHallLevel) || 16,
      trophies: Number(acc.trophies) || 4500,
      role: String(acc.role || "member"),
      clanTag: normalizeTag(acc.clanTag || acc.clan?.tag || "#2PP"),
      clanName: String(acc.clanName || acc.clan?.name || "The Order").trim(),
      clanBadgeUrl:
        acc.clanBadgeUrl ||
        acc.clan?.badgeUrls?.small ||
        MOCK_CLANS[0].badgeUrls.small,
      isActive: Boolean(acc.isActive || acc.setActive),
    }))
    .filter((acc) => acc.playerTag.length >= 2 && acc.playerName)

  const now = new Date().toISOString()

  for (let i = 0; i < incoming.length; i++) {
    const acc = incoming[i]
    const shouldActivate =
      acc.isActive || (!existing.some((r) => r.is_active) && i === 0)

    if (shouldActivate) {
      for (const item of existing) {
        item.is_active = false
      }
    }

    const idx = existing.findIndex(
      (r) => r.player_tag.toUpperCase() === acc.playerTag.toUpperCase()
    )

    const record = {
      id: `${userId}:${acc.playerTag}`,
      user_id: userId,
      player_tag: acc.playerTag,
      player_name: acc.playerName,
      town_hall_level: acc.townHallLevel,
      trophies: acc.trophies,
      role: acc.role,
      clan_tag: acc.clanTag,
      clan_name: acc.clanName,
      clan_badge_url: acc.clanBadgeUrl,
      is_active: shouldActivate,
      created_at: idx >= 0 ? existing[idx].created_at : now,
      updated_at: now,
    }

    if (idx >= 0) {
      existing[idx] = record
    } else {
      existing.push(record)
    }
  }

  store[userId] = existing
  writeAllMockAccountsStore(store)
  const sorted = sortAccounts(existing)
  return { items: sorted, accounts: sorted, source: "mock" }
}

export function activateMockUserAccount(userId = "demo-user", playerTag) {
  const normalized = normalizeTag(playerTag)
  const store = readAllMockAccountsStore()
  const existing = Array.isArray(store[userId])
    ? store[userId]
    : getDefaultSeedAccounts(userId)

  const updated = existing.map((acc) => ({
    ...acc,
    is_active: acc.player_tag.toUpperCase() === normalized.toUpperCase(),
    updated_at:
      acc.player_tag.toUpperCase() === normalized.toUpperCase()
        ? new Date().toISOString()
        : acc.updated_at,
  }))

  store[userId] = updated
  writeAllMockAccountsStore(store)
  const sorted = sortAccounts(updated)
  return { items: sorted, accounts: sorted, source: "mock" }
}

export function updateMockUserAccountClan(
  userId = "demo-user",
  playerTag,
  clan = {}
) {
  const normalized = normalizeTag(playerTag)
  const store = readAllMockAccountsStore()
  const existing = Array.isArray(store[userId])
    ? store[userId]
    : getDefaultSeedAccounts(userId)

  const updated = existing.map((acc) => {
    if (acc.player_tag.toUpperCase() !== normalized.toUpperCase()) return acc
    return {
      ...acc,
      clan_tag: normalizeTag(clan.clanTag || clan.tag || acc.clan_tag),
      clan_name: String(clan.clanName || clan.name || acc.clan_name).trim(),
      clan_badge_url:
        clan.clanBadgeUrl ||
        clan.badgeUrls?.small ||
        clan.badgeUrls?.medium ||
        acc.clan_badge_url,
      updated_at: new Date().toISOString(),
    }
  })

  store[userId] = updated
  writeAllMockAccountsStore(store)
  const sorted = sortAccounts(updated)
  return { items: sorted, accounts: sorted, source: "mock" }
}

export function updateMockUserAccountRole(
  userId = "demo-user",
  playerTag,
  role = "member"
) {
  const normalized = normalizeTag(playerTag)
  const store = readAllMockAccountsStore()
  const existing = Array.isArray(store[userId])
    ? store[userId]
    : getDefaultSeedAccounts(userId)

  const updated = existing.map((acc) => {
    if (acc.player_tag.toUpperCase() !== normalized.toUpperCase()) return acc
    return {
      ...acc,
      role: String(role || "member"),
      updated_at: new Date().toISOString(),
    }
  })

  store[userId] = updated
  writeAllMockAccountsStore(store)
  const sorted = sortAccounts(updated)
  return { items: sorted, accounts: sorted, source: "mock" }
}

export function deleteMockUserAccount(userId = "demo-user", playerTag) {
  const normalized = normalizeTag(playerTag)
  const store = readAllMockAccountsStore()
  const existing = Array.isArray(store[userId])
    ? store[userId]
    : getDefaultSeedAccounts(userId)

  if (existing.length <= 1) {
    throw new Error(
      "Cannot remove your last in-game account. Every user must have at least 1 linked in-game player."
    )
  }

  const next = existing.filter(
    (acc) => acc.player_tag.toUpperCase() !== normalized.toUpperCase()
  )
  if (next.length > 0 && !next.some((a) => a.is_active)) {
    next[0] = { ...next[0], is_active: true }
  }

  store[userId] = next
  writeAllMockAccountsStore(store)
  const sorted = sortAccounts(next)
  return { items: sorted, accounts: sorted, source: "mock" }
}

