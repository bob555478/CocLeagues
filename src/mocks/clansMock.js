/**
 * All mock Clash of Clans clans, members, and player search datasets.
 * Used as fallback when the backend at http://0.0.0.0:8000/ is not responding.
 */

export function createBadgeDataUrl(primaryColor, secondaryColor, level) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="100%" stop-color="${secondaryColor}" />
      </linearGradient>
    </defs>
    <path d="M10 8 L54 8 L54 34 C54 47 32 58 32 58 C32 58 10 47 10 34 Z" fill="url(#g)" stroke="#fbbf24" stroke-width="4" stroke-linejoin="round"/>
    <path d="M18 14 L46 14 L46 32 C46 41 32 49 32 49 C32 49 18 41 18 32 Z" fill="rgba(0,0,0,0.22)"/>
    <text x="32" y="37" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="800" font-size="16">${level}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const DEMO_PLAYER_NAMES = [
  "DragonSlayer",
  "PekkaSmash",
  "QueenCharge",
  "LavaLoon",
  "RootRider",
  "HybridMaster",
  "YetiBlimp",
  "SuperArcher",
  "FlameFlinger",
  "GolemKing",
  "HogRider99",
  "MinerMania",
  "BowlerBounce",
  "WitchSlap",
  "WardenWalk",
  "RoyalChamp",
  "BarbarianKing",
  "SneakyGoblin",
  "ElectroTitan",
  "IceGolem",
  "FireballWiz",
  "RecallSpell",
  "FreezeFrame",
  "RageValk",
  "BatWave",
  "SkellyDonut",
  "ZapQuake",
  "BlizzardPro",
  "SuiHero",
  "SiegeBarracks",
  "LogLauncher",
  "BattleDrill",
  "WallWrecker",
  "StoneSlammer",
  "AirSweeper",
  "EagleArtillery",
  "Scattershot",
  "Monolith",
  "SpellTower",
  "InfernoBeam",
  "XBowMaster",
  "TeslaFarm",
  "TornadoTrap",
  "SeekingMine",
  "BuilderHut",
  "GrandWarden",
  "MinionPrince",
  "RocketLoon",
  "SuperWall",
  "Headhunter",
]

export const MOCK_CLANS = [
  {
    tag: "#2PP",
    name: "The Order",
    type: "inviteOnly",
    description:
      "Competitive CWL & War Clan! Looking for active TH15-TH17 three-star specialists. Discord mandatory for league wars.",
    location: {
      id: 32000006,
      name: "International",
      isCountry: false,
    },
    isFamilyFriendly: true,
    badgeUrls: {
      small: createBadgeDataUrl("#7c3aed", "#4c1d95", 28),
      medium: createBadgeDataUrl("#7c3aed", "#4c1d95", 28),
      large: createBadgeDataUrl("#7c3aed", "#4c1d95", 28),
    },
    clanLevel: 28,
    clanPoints: 54820,
    clanBuilderBasePoints: 48210,
    clanCapitalPoints: 5120,
    capitalLeague: { id: 85000021, name: "Legend League" },
    requiredTrophies: 4600,
    warFrequency: "always",
    warWinStreak: 19,
    warWins: 642,
    warTies: 12,
    warLosses: 88,
    isWarLogPublic: true,
    warLeague: { id: 48000018, name: "Champion League I" },
    members: 49,
    labels: [
      { id: 56000000, name: "Clan Wars" },
      { id: 56000001, name: "Clan War League" },
      { id: 56000004, name: "Competitive" },
    ],
    memberList: [
      {
        tag: "#P902L8Q",
        name: "Artorius",
        role: "leader",
        townHallLevel: 17,
        expLevel: 254,
        trophies: 5890,
        donations: 4120,
      },
      {
        tag: "#28YJ99R",
        name: "ValkyrieQueen",
        role: "coLeader",
        townHallLevel: 17,
        expLevel: 241,
        donations: 3890,
        trophies: 5740,
      },
      {
        tag: "#88GLP2Q",
        name: "ShadowStrike",
        role: "coLeader",
        townHallLevel: 16,
        expLevel: 229,
        donations: 2940,
        trophies: 5610,
      },
      {
        tag: "#99QJV02",
        name: "FrostGiant",
        role: "admin",
        townHallLevel: 16,
        expLevel: 218,
        donations: 2150,
        trophies: 5490,
      },
    ],
  },
  {
    tag: "#2Q89J0L2",
    name: "Apex Legends CoC",
    type: "inviteOnly",
    description:
      "Back-to-back wars | Champion II CWL | Max Clan Games & 1600+ Raid Medals every weekend. Apply in-game with war layout ready.",
    location: {
      id: 32000249,
      name: "United States",
      isCountry: true,
      countryCode: "US",
    },
    isFamilyFriendly: true,
    badgeUrls: {
      small: createBadgeDataUrl("#dc2626", "#7f1d1d", 24),
      medium: createBadgeDataUrl("#dc2626", "#7f1d1d", 24),
      large: createBadgeDataUrl("#dc2626", "#7f1d1d", 24),
    },
    clanLevel: 24,
    clanPoints: 49310,
    clanBuilderBasePoints: 41900,
    clanCapitalPoints: 4680,
    capitalLeague: { id: 85000020, name: "Titan League I" },
    requiredTrophies: 4000,
    warFrequency: "always",
    warWinStreak: 11,
    warWins: 485,
    warTies: 5,
    warLosses: 94,
    isWarLogPublic: true,
    warLeague: { id: 48000017, name: "Champion League II" },
    members: 47,
    labels: [
      { id: 56000001, name: "Clan War League" },
      { id: 56000016, name: "Clan Capital" },
      { id: 56000009, name: "Active Donators" },
    ],
    memberList: [
      {
        tag: "#L08V2YR",
        name: "BlazeKing",
        role: "leader",
        townHallLevel: 17,
        expLevel: 248,
        trophies: 5620,
        donations: 5210,
      },
      {
        tag: "#Q92LV8P",
        name: "ElectroWiz",
        role: "coLeader",
        townHallLevel: 16,
        expLevel: 225,
        trophies: 5410,
        donations: 3100,
      },
    ],
  },
  {
    tag: "#8QU8J9LP",
    name: "Tribe Gaming",
    type: "closed",
    description:
      "Official Esports & Championship Roster. Home of World Championship finalists and top Legend League pushers.",
    location: {
      id: 32000249,
      name: "United States",
      isCountry: true,
      countryCode: "US",
    },
    isFamilyFriendly: true,
    badgeUrls: {
      small: createBadgeDataUrl("#ea580c", "#9a3412", 31),
      medium: createBadgeDataUrl("#ea580c", "#9a3412", 31),
      large: createBadgeDataUrl("#ea580c", "#9a3412", 31),
    },
    clanLevel: 31,
    clanPoints: 59400,
    clanBuilderBasePoints: 53100,
    clanCapitalPoints: 5690,
    capitalLeague: { id: 85000021, name: "Legend League" },
    requiredTrophies: 5200,
    warFrequency: "always",
    warWinStreak: 27,
    warWins: 812,
    warTies: 19,
    warLosses: 61,
    isWarLogPublic: true,
    warLeague: { id: 48000018, name: "Champion League I" },
    members: 50,
    labels: [
      { id: 56000004, name: "Competitive" },
      { id: 56000001, name: "Clan War League" },
      { id: 56000002, name: "Trophy Pushing" },
    ],
    memberList: [
      {
        tag: "#2Y8P9LQ",
        name: "Chronos",
        role: "leader",
        townHallLevel: 17,
        expLevel: 265,
        trophies: 6120,
        donations: 6410,
      },
      {
        tag: "#9LP08VR",
        name: "Nebula",
        role: "coLeader",
        townHallLevel: 17,
        expLevel: 259,
        trophies: 6045,
        donations: 4820,
      },
    ],
  },
  {
    tag: "#9VG082CP",
    name: "Israel Elite",
    type: "inviteOnly",
    description:
      "Top Israeli War & League Clan! Active community, organized CWL 30v30 & 15v15 splits, friendly challenges daily.",
    location: {
      id: 32000116,
      name: "Israel",
      isCountry: true,
      countryCode: "IL",
    },
    isFamilyFriendly: true,
    badgeUrls: {
      small: createBadgeDataUrl("#2563eb", "#1e3a8a", 26),
      medium: createBadgeDataUrl("#2563eb", "#1e3a8a", 26),
      large: createBadgeDataUrl("#2563eb", "#1e3a8a", 26),
    },
    clanLevel: 26,
    clanPoints: 51290,
    clanBuilderBasePoints: 44800,
    clanCapitalPoints: 4920,
    capitalLeague: { id: 85000021, name: "Legend League" },
    requiredTrophies: 4200,
    warFrequency: "always",
    warWinStreak: 8,
    warWins: 590,
    warTies: 7,
    warLosses: 112,
    isWarLogPublic: true,
    warLeague: { id: 48000016, name: "Champion League III" },
    members: 48,
    labels: [
      { id: 56000000, name: "Clan Wars" },
      { id: 56000001, name: "Clan War League" },
      { id: 56000008, name: "Friendly" },
    ],
    memberList: [
      {
        tag: "#88VL90P",
        name: "KingDavid",
        role: "leader",
        townHallLevel: 17,
        expLevel: 251,
        trophies: 5710,
        donations: 4900,
      },
      {
        tag: "#20PL89G",
        name: "IronDome",
        role: "coLeader",
        townHallLevel: 17,
        expLevel: 239,
        trophies: 5580,
        donations: 3650,
      },
    ],
  },
  {
    tag: "#2G9P8Q0V",
    name: "Royal Knights",
    type: "open",
    description:
      "Chill war twice a week, max Clan Games, Capital Peak lvl 10. Everyone welcome as long as you use both war attacks!",
    location: {
      id: 32000248,
      name: "United Kingdom",
      isCountry: true,
      countryCode: "GB",
    },
    isFamilyFriendly: true,
    badgeUrls: {
      small: createBadgeDataUrl("#059669", "#064e3b", 18),
      medium: createBadgeDataUrl("#059669", "#064e3b", 18),
      large: createBadgeDataUrl("#059669", "#064e3b", 18),
    },
    clanLevel: 18,
    clanPoints: 38450,
    clanBuilderBasePoints: 34200,
    clanCapitalPoints: 3910,
    capitalLeague: { id: 85000018, name: "Champion League I" },
    requiredTrophies: 2800,
    warFrequency: "moreThanOncePerWeek",
    warWinStreak: 4,
    warWins: 312,
    warTies: 3,
    warLosses: 108,
    isWarLogPublic: true,
    warLeague: { id: 48000015, name: "Master League I" },
    members: 42,
    labels: [
      { id: 56000003, name: "Clan Games" },
      { id: 56000016, name: "Clan Capital" },
      { id: 56000011, name: "Relaxed" },
    ],
    memberList: [
      {
        tag: "#P09L2QV",
        name: "SirLancelot",
        role: "leader",
        townHallLevel: 16,
        expLevel: 215,
        trophies: 4920,
        donations: 2850,
      },
    ],
  },
  {
    tag: "#PY802L9C",
    name: "Nightfall Academy",
    type: "inviteOnly",
    description:
      "Feeder & development clan for Nightfall Esports. Weekly war practice, base building workshops, and Master II CWL.",
    location: {
      id: 32000094,
      name: "Germany",
      isCountry: true,
      countryCode: "DE",
    },
    isFamilyFriendly: true,
    badgeUrls: {
      small: createBadgeDataUrl("#0284c7", "#0c4a6e", 15),
      medium: createBadgeDataUrl("#0284c7", "#0c4a6e", 15),
      large: createBadgeDataUrl("#0284c7", "#0c4a6e", 15),
    },
    clanLevel: 15,
    clanPoints: 32910,
    clanBuilderBasePoints: 29800,
    clanCapitalPoints: 3420,
    capitalLeague: { id: 85000016, name: "Champion League III" },
    requiredTrophies: 2400,
    warFrequency: "oncePerWeek",
    warWinStreak: 3,
    warWins: 198,
    warTies: 2,
    warLosses: 64,
    isWarLogPublic: true,
    warLeague: { id: 48000014, name: "Master League II" },
    members: 36,
    labels: [
      { id: 56000013, name: "Teaching" },
      { id: 56000000, name: "Clan Wars" },
      { id: 56000012, name: "Newbie Friendly" },
    ],
    memberList: [
      {
        tag: "#Q88L2P9",
        name: "NightHawk",
        role: "leader",
        townHallLevel: 15,
        expLevel: 198,
        trophies: 4410,
        donations: 1940,
      },
    ],
  },
]

export function normalizeTag(tag = "") {
  const clean = String(tag).trim().toUpperCase().replace(/^#/, "")
  return `#${clean}`
}

export function isTagQuery(query) {
  if (!query) return false
  const trimmed = String(query).trim().toUpperCase()
  if (trimmed.startsWith("#") && trimmed.length >= 3) {
    return /^#[0289PYLQGRJCUV]+$/i.test(trimmed)
  }
  return false
}

export function buildFullDemoMemberList(clan) {
  const existing = Array.isArray(clan.memberList) ? clan.memberList : []
  const targetCount = clan.members || 40
  const result = existing.map((m, idx) => ({
    ...m,
    clanRank: idx + 1,
    warPreference: m.warPreference || "in",
  }))

  const tagPrefix = clan.tag.replace(/[^A-Z0-9]/gi, "").slice(0, 3) || "2PP"
  const baseTrophies = result[result.length - 1]?.trophies || 5200

  for (let i = result.length; i < targetCount; i++) {
    const name = DEMO_PLAYER_NAMES[i % DEMO_PLAYER_NAMES.length]
    const th = i < 12 ? 17 : i < 24 ? 16 : i < 35 ? 15 : 14
    const role =
      i === 0 ? "leader" : i < 5 ? "coLeader" : i < 14 ? "admin" : "member"
    const warPreference = i < 32 ? "in" : "out"
    result.push({
      tag: `#${tagPrefix}${String(i + 10).padStart(3, "0")}Q`,
      name: i >= DEMO_PLAYER_NAMES.length ? `${name}_${i + 1}` : name,
      role,
      townHallLevel: th,
      expLevel: Math.max(150, 245 - i * 2),
      trophies: Math.max(2600, baseTrophies - (i - existing.length + 1) * 45),
      donations: Math.max(150, 2800 - i * 50),
      clanRank: i + 1,
      warPreference,
    })
  }

  return result
}

export function searchMockClans(query = "", filters = {}) {
  const q = String(query || "").trim().toLowerCase()
  const isTag = isTagQuery(query)

  return MOCK_CLANS.filter((clan) => {
    if (isTag) {
      return clan.tag.toLowerCase().includes(q)
    }
    if (q) {
      const matchesName = clan.name.toLowerCase().includes(q)
      const matchesTag = clan.tag.toLowerCase().includes(q.replace(/^#/, ""))
      if (!matchesName && !matchesTag) return false
    }

    if (filters.warFrequency && filters.warFrequency !== "any") {
      if (clan.warFrequency !== filters.warFrequency) return false
    }

    if (filters.minClanLevel && Number(filters.minClanLevel) > 1) {
      if (clan.clanLevel < Number(filters.minClanLevel)) return false
    }

    if (filters.minMembers && Number(filters.minMembers) > 1) {
      if (clan.members < Number(filters.minMembers)) return false
    }

    if (filters.maxMembers && Number(filters.maxMembers) < 50) {
      if (clan.members > Number(filters.maxMembers)) return false
    }

    if (filters.minClanPoints && Number(filters.minClanPoints) > 0) {
      if (clan.clanPoints < Number(filters.minClanPoints)) return false
    }

    if (filters.locationId && filters.locationId !== "any") {
      if (String(clan.location?.id) !== String(filters.locationId)) return false
    }

    return true
  }).slice(0, Number(filters.limit) || 20)
}

export function getMockClanDetails(clanTag) {
  const normalized = normalizeTag(clanTag)
  const found =
    MOCK_CLANS.find((c) => c.tag.toUpperCase() === normalized.toUpperCase()) ||
    MOCK_CLANS[0]
  return {
    ...found,
    tag: normalized,
    memberList: buildFullDemoMemberList(found),
  }
}

export function getMockClanMembers(clanTag) {
  const details = getMockClanDetails(clanTag)
  return {
    items: details.memberList || [],
    source: "mock",
  }
}

export function getMockClanLeagueGroup(clanTag) {
  const details = getMockClanDetails(clanTag)
  return {
    state: "inWar",
    season: "2026-10",
    clans: [
      {
        tag: details.tag,
        name: details.name,
        clanLevel: details.clanLevel,
        badgeUrls: details.badgeUrls,
        members: details.memberList,
      },
      ...MOCK_CLANS.filter((c) => c.tag !== details.tag)
        .slice(0, 7)
        .map((c) => ({
          tag: c.tag,
          name: c.name,
          clanLevel: c.clanLevel,
          badgeUrls: c.badgeUrls,
        })),
    ],
    rounds: Array.from({ length: 7 }, (_, i) => ({
      warTags: [`#WAR_DAY_${i + 1}_1`, `#WAR_DAY_${i + 1}_2`],
    })),
    source: "mock",
  }
}

export function getAllMockPlayers() {
  const players = []
  for (const clan of MOCK_CLANS) {
    const roster = buildFullDemoMemberList(clan)
    for (const member of roster) {
      players.push({
        tag: member.tag,
        name: member.name,
        townHallLevel: member.townHallLevel || 16,
        expLevel: member.expLevel || 200,
        trophies: member.trophies || 4500,
        role: member.role || "member",
        warPreference: member.warPreference || "in",
        clan: {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,
        },
      })
    }
  }
  return players
}

export function searchMockIngamePlayers(query = "", clanTag = "") {
  const q = String(query || "").trim()
  const allPlayers = getAllMockPlayers()
  const lower = q.toLowerCase()
  const cleanTag = lower.replace(/^#/, "")

  const matches = allPlayers.filter((p) => {
    if (
      clanTag &&
      p.clan?.tag?.toUpperCase() !== normalizeTag(clanTag).toUpperCase()
    ) {
      return false
    }
    if (!lower) return true
    return (
      p.name.toLowerCase().includes(lower) ||
      p.tag.toLowerCase().replace(/^#/, "").includes(cleanTag)
    )
  })

  if (matches.length === 0 && isTagQuery(q)) {
    const normalized = normalizeTag(q)
    const defaultClan =
      MOCK_CLANS.find(
        (c) =>
          clanTag && c.tag.toUpperCase() === normalizeTag(clanTag).toUpperCase()
      ) || MOCK_CLANS[0]
    return {
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
      source: "mock",
    }
  }

  return {
    items: matches.slice(0, 20),
    source: "mock",
  }
}

