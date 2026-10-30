export const CWL_DAYS = [1, 2, 3, 4, 5, 6, 7]

export const WAR_SIZE_PRESETS = [15, 25, 30]

export const MIN_PLAYS_FOR_OPTED_IN = 3

export const AVAILABILITY_STATUS = {
  INTERESTED: "interested",
  PREFERABLY_NOT: "preferably_not",
  ABSOLUTELY_NOT: "absolutely_not",
}

export const AVAILABILITY_OPTIONS = [
  {
    value: AVAILABILITY_STATUS.INTERESTED,
    label: "Interested",
    shortLabel: "Interested",
    description: "Ready & available to attack on this war day",
  },
  {
    value: AVAILABILITY_STATUS.PREFERABLY_NOT,
    label: "Preferably Not",
    shortLabel: "Preferably Not",
    description: "Prefer to sit out if possible, but can fill if needed",
  },
  {
    value: AVAILABILITY_STATUS.ABSOLUTELY_NOT,
    label: "Absolutely Not",
    shortLabel: "Absolutely Not",
    description: "Unavailable — won't be able to attack on this day",
  },
]

export const DEFAULT_OPPONENTS = {
  1: "Opponent Clan #1",
  2: "Opponent Clan #2",
  3: "Opponent Clan #3",
  4: "Opponent Clan #4",
  5: "Opponent Clan #5",
  6: "Opponent Clan #6",
  7: "Bonus / Final Round Clan",
}

export function createEmptySchedule() {
  return {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  }
}

/**
 * Default availability when a player opts in: "interested" for all 7 war days.
 */
export function createDefaultPlayerAvailability() {
  return {
    1: AVAILABILITY_STATUS.INTERESTED,
    2: AVAILABILITY_STATUS.INTERESTED,
    3: AVAILABILITY_STATUS.INTERESTED,
    4: AVAILABILITY_STATUS.INTERESTED,
    5: AVAILABILITY_STATUS.INTERESTED,
    6: AVAILABILITY_STATUS.INTERESTED,
    7: AVAILABILITY_STATUS.INTERESTED,
  }
}

/**
 * Looks up a player's availability for a given day ("interested" | "preferably_not" | "absolutely_not").
 * Defaults to "interested" if not explicitly set.
 */
export function getPlayerDayAvailability(
  availabilityByTag = {},
  playerTag,
  day
) {
  if (!playerTag || !availabilityByTag) return AVAILABILITY_STATUS.INTERESTED
  const direct = availabilityByTag[playerTag]
  if (direct && direct[day]) return direct[day]

  const upper = String(playerTag).toUpperCase()
  for (const [k, val] of Object.entries(availabilityByTag)) {
    if (String(k).toUpperCase() === upper && val && val[day]) {
      return val[day]
    }
  }
  return AVAILABILITY_STATUS.INTERESTED
}

/**
 * Returns full 7-day availability map for a player, defaulting every day to "interested".
 */
export function getPlayerWeekAvailability(availabilityByTag = {}, playerTag) {
  const result = createDefaultPlayerAvailability()
  for (const day of CWL_DAYS) {
    result[day] = getPlayerDayAvailability(availabilityByTag, playerTag, day)
  }
  return result
}

function getAvailabilityPriorityScore(status) {
  if (status === AVAILABILITY_STATUS.INTERESTED) return 2
  if (status === AVAILABILITY_STATUS.PREFERABLY_NOT) return 1
  return 0
}

/**
 * Evaluates the current 7-day CWL lineup against the README league rules:
 * 1. The league is 7 days long (battling opponent clans each war day).
 * 2. Each day a set amount of players can play (e.g. 15, 25, 30).
 * 3. Every clan member that opted in must play at least 3 times.
 */
export function evaluateLeagueRules({
  members = [],
  optedInTags = [],
  scheduleByDay = createEmptySchedule(),
  lineupSize = 15,
}) {
  const optedInSet = new Set(optedInTags)

  // Count how many days each player is scheduled to play
  const daysPlayedByTag = {}
  for (const m of members) {
    daysPlayedByTag[m.tag] = 0
  }

  for (const day of CWL_DAYS) {
    const dayTags = scheduleByDay[day] || []
    for (const tag of dayTags) {
      daysPlayedByTag[tag] = (daysPlayedByTag[tag] || 0) + 1
    }
  }

  // Per-day lineup status
  const dayStatuses = CWL_DAYS.map((day) => {
    const assignedTags = scheduleByDay[day] || []
    const count = assignedTags.length
    return {
      day,
      count,
      lineupSize,
      remaining: Math.max(0, lineupSize - count),
      isComplete: count === lineupSize,
      isOverfilled: count > lineupSize,
      isUnderfilled: count < lineupSize,
    }
  })

  const completedDaysCount = dayStatuses.filter((d) => d.isComplete).length
  const overfilledDaysCount = dayStatuses.filter((d) => d.isOverfilled).length

  const optedInMembers = members.filter((m) => optedInSet.has(m.tag))
  const compliantOptedIn = optedInMembers.filter(
    (m) => (daysPlayedByTag[m.tag] || 0) >= MIN_PLAYS_FOR_OPTED_IN
  )
  const underplayedOptedIn = optedInMembers.filter(
    (m) => (daysPlayedByTag[m.tag] || 0) < MIN_PLAYS_FOR_OPTED_IN
  )

  const totalSlotCapacity = lineupSize * CWL_DAYS.length
  const minSlotsRequired = optedInMembers.length * MIN_PLAYS_FOR_OPTED_IN
  const maxOptedInFor3Plays = Math.floor(
    totalSlotCapacity / MIN_PLAYS_FOR_OPTED_IN
  )
  const hasEnoughTotalCapacity = minSlotsRequired <= totalSlotCapacity

  const isAllDaysValid =
    completedDaysCount === CWL_DAYS.length && overfilledDaysCount === 0
  const isAllOptedInMin3 =
    optedInMembers.length > 0 && underplayedOptedIn.length === 0

  return {
    daysPlayedByTag,
    dayStatuses,
    completedDaysCount,
    overfilledDaysCount,
    optedInMembers,
    compliantOptedIn,
    underplayedOptedIn,
    totalSlotCapacity,
    minSlotsRequired,
    maxOptedInFor3Plays,
    hasEnoughTotalCapacity,
    isAllDaysValid,
    isAllOptedInMin3,
    isFullyCompliant:
      isAllDaysValid && isAllOptedInMin3 && hasEnoughTotalCapacity,
  }
}

/**
 * Generates a balanced 7-day CWL rotation for opted-in members:
 * - Excludes players who marked "absolutely_not" on a given day
 * - Prioritizes players who marked "interested" over "preferably_not"
 * - Prioritizes opted-in players who have fewer than 3 wars so every opted-in player
 *   gets at least 3 wars (when mathematically possible)
 * - Balances remaining slots fairly by clan rank / Town Hall
 */
export function generateFairLeagueSchedule({
  members = [],
  optedInTags = [],
  lineupSize = 15,
  availabilityByTag = {},
}) {
  const optedInSet = new Set(optedInTags)
  const pool = members.filter((m) => optedInSet.has(m.tag))
  const schedule = createEmptySchedule()

  if (pool.length === 0) {
    return schedule
  }

  const playCounts = {}
  for (const p of pool) {
    playCounts[p.tag] = 0
  }

  for (const day of CWL_DAYS) {
    // Exclude players who marked "absolutely_not" for this war day
    const eligiblePool = pool.filter(
      (p) =>
        getPlayerDayAvailability(availabilityByTag, p.tag, day) !==
        AVAILABILITY_STATUS.ABSOLUTELY_NOT
    )

    const dailyTarget = Math.min(lineupSize, eligiblePool.length)

    const candidates = [...eligiblePool].sort((a, b) => {
      const availA = getAvailabilityPriorityScore(
        getPlayerDayAvailability(availabilityByTag, a.tag, day)
      )
      const availB = getAvailabilityPriorityScore(
        getPlayerDayAvailability(availabilityByTag, b.tag, day)
      )
      const countA = playCounts[a.tag]
      const countB = playCounts[b.tag]
      const needsMinA = countA < MIN_PLAYS_FOR_OPTED_IN ? 1 : 0
      const needsMinB = countB < MIN_PLAYS_FOR_OPTED_IN ? 1 : 0

      // 1. Prefer "interested" over "preferably_not"
      if (availA !== availB) {
        return availB - availA
      }
      // 2. Prefer players who still need wars to reach the 3-war minimum
      if (needsMinA !== needsMinB) {
        return needsMinB - needsMinA
      }
      // 3. Fewest total plays so far
      if (countA !== countB) {
        return countA - countB
      }
      return (a.clanRank || 0) - (b.clanRank || 0)
    })

    const chosenForDay = candidates.slice(0, dailyTarget)
    schedule[day] = chosenForDay.map((p) => p.tag)

    for (const p of chosenForDay) {
      playCounts[p.tag] += 1
    }
  }

  return schedule
}
