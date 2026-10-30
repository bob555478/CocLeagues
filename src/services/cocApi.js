import { requestBackendWithMockFallback } from "./backendClient"
import {
  MOCK_CLANS,
  searchMockClans,
  getMockClanDetails,
  getMockClanMembers,
  getMockClanLeagueGroup,
  getAllMockPlayers,
  searchMockIngamePlayers,
  normalizeTag,
  isTagQuery,
} from "@/mocks"

const STORAGE_TOKEN_KEY = "coc_api_token"
const STORAGE_MODE_KEY = "coc_api_mode" // "auto" | "live" | "demo"

export { MOCK_CLANS }

export const WAR_FREQUENCIES = [
  { value: "any", label: "Any War Frequency" },
  { value: "always", label: "Always" },
  { value: "moreThanOncePerWeek", label: "Twice a Week" },
  { value: "oncePerWeek", label: "Once a Week" },
  { value: "lessThenOncePerWeek", label: "Rarely" },
  { value: "never", label: "Never" },
]

export const COMMON_LOCATIONS = [
  { value: "any", label: "Any Location" },
  { value: "32000006", label: "International" },
  { value: "32000249", label: "United States" },
  { value: "32000248", label: "United Kingdom" },
  { value: "32000116", label: "Israel" },
  { value: "32000094", label: "Germany" },
  { value: "32000087", label: "France" },
  { value: "32000048", label: "Canada" },
  { value: "32000121", label: "Japan" },
  { value: "32000113", label: "India" },
  { value: "32000038", label: "Brazil" },
]

export const DEFAULT_FILTERS = {
  warFrequency: "any",
  minClanLevel: 1,
  minMembers: 1,
  maxMembers: 50,
  minClanPoints: "",
  locationId: "any",
  limit: 20,
}

export function getStoredApiToken() {
  return (
    localStorage.getItem(STORAGE_TOKEN_KEY) ||
    import.meta.env.VITE_COC_API_TOKEN ||
    ""
  ).trim()
}

export function setStoredApiToken(token) {
  if (token && token.trim()) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token.trim())
  } else {
    localStorage.removeItem(STORAGE_TOKEN_KEY)
  }
}

export function getStoredApiMode() {
  return localStorage.getItem(STORAGE_MODE_KEY) || "auto"
}

export function setStoredApiMode(mode) {
  localStorage.setItem(STORAGE_MODE_KEY, mode)
}

export function isClanTagQuery(query) {
  return isTagQuery(query)
}

export function normalizeClanTag(tag) {
  return normalizeTag(tag)
}

export function encodeClanTag(tag) {
  return encodeURIComponent(normalizeClanTag(tag))
}

function getCocAuthHeaders() {
  const token = getStoredApiToken()
  const headers = { Accept: "application/json" }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * Searches for clans via the backend at http://0.0.0.0:8000/api/coc/clans,
 * or falls back to src/mocks/clansMock.js when the backend is not responding.
 */
export async function searchClans(queryOrOptions = "", filters = DEFAULT_FILTERS) {
  const rawQuery =
    typeof queryOrOptions === "object" && queryOrOptions !== null
      ? queryOrOptions.name || queryOrOptions.q || ""
      : String(queryOrOptions || "")
  const trimmedQuery = rawQuery.trim()
  const headers = getCocAuthHeaders()

  // 1. Direct Clan Tag lookup: GET /api/coc/clans/:clanTag
  if (isClanTagQuery(trimmedQuery)) {
    const encodedTag = encodeClanTag(trimmedQuery)
    return requestBackendWithMockFallback(
      `/api/coc/clans/${encodedTag}`,
      { headers },
      () => {
        const items = searchMockClans(trimmedQuery, filters)
        return {
          items,
          source: "mock",
          endpoint: `GET /api/coc/clans/${encodedTag}`,
        }
      }
    ).then((data) => {
      if (Array.isArray(data?.items)) return data
      if (data?.tag) {
        return {
          items: [data],
          source: "live",
          endpoint: `GET /api/coc/clans/${encodedTag}`,
        }
      }
      return { items: [], source: "live" }
    })
  }

  // 2. Clan Search with query parameters: GET /api/coc/clans
  const searchParams = new URLSearchParams()
  if (trimmedQuery.length > 0) {
    searchParams.set("name", trimmedQuery)
  }
  if (filters.warFrequency && filters.warFrequency !== "any") {
    searchParams.set("warFrequency", filters.warFrequency)
  }
  if (Number(filters.minClanLevel) > 1) {
    searchParams.set("minClanLevel", String(filters.minClanLevel))
  }
  if (Number(filters.minMembers) > 1) {
    searchParams.set("minMembers", String(filters.minMembers))
  }
  if (Number(filters.maxMembers) < 50) {
    searchParams.set("maxMembers", String(filters.maxMembers))
  }
  if (Number(filters.minClanPoints) > 0) {
    searchParams.set("minClanPoints", String(filters.minClanPoints))
  }
  if (filters.locationId && filters.locationId !== "any") {
    searchParams.set("locationId", String(filters.locationId))
  }
  searchParams.set("limit", String(filters.limit || 20))

  const qs = searchParams.toString()
  return requestBackendWithMockFallback(
    `/api/coc/clans${qs ? `?${qs}` : ""}`,
    { headers },
    () => ({
      items: searchMockClans(trimmedQuery, filters),
      source: "mock",
      endpoint: `GET /api/coc/clans?${qs}`,
    })
  )
}

/**
 * Fetches full clan details via GET http://0.0.0.0:8000/api/coc/clans/:clanTag,
 * falling back to src/mocks/clansMock.js if the backend is not responding.
 */
export async function getClanDetails(clanTag) {
  const encodedTag = encodeClanTag(clanTag)
  return requestBackendWithMockFallback(
    `/api/coc/clans/${encodedTag}`,
    { headers: getCocAuthHeaders() },
    () => getMockClanDetails(clanTag)
  )
}

/**
 * Fetches clan members list via GET http://0.0.0.0:8000/api/coc/clans/:clanTag/members,
 * falling back to src/mocks/clansMock.js if the backend is not responding.
 */
export async function getClanMembers(clanTag) {
  const encodedTag = encodeClanTag(clanTag)
  return requestBackendWithMockFallback(
    `/api/coc/clans/${encodedTag}/members`,
    { headers: getCocAuthHeaders() },
    () => getMockClanMembers(clanTag)
  )
}

/**
 * Fetches active CWL league group via GET http://0.0.0.0:8000/api/coc/clans/:clanTag/currentwar/leaguegroup,
 * falling back to src/mocks/clansMock.js if the backend is not responding.
 */
export async function getClanLeagueGroup(clanTag) {
  const encodedTag = encodeClanTag(clanTag)
  return requestBackendWithMockFallback(
    `/api/coc/clans/${encodedTag}/currentwar/leaguegroup`,
    { headers: getCocAuthHeaders() },
    () => getMockClanLeagueGroup(clanTag)
  )
}

/**
 * Returns all mock players across all demo clans.
 */
export function getAllDemoPlayers() {
  return getAllMockPlayers()
}

/**
 * Searches in-game players via GET http://0.0.0.0:8000/api/coc/players,
 * falling back to src/mocks/clansMock.js if the backend is not responding.
 */
export async function searchIngamePlayers(query = "", clanTag = "") {
  const q = String(query || "").trim()
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (clanTag) params.set("clanTag", clanTag)
  const qs = params.toString()

  const data = await requestBackendWithMockFallback(
    `/api/coc/players${qs ? `?${qs}` : ""}`,
    { headers: getCocAuthHeaders() },
    () => searchMockIngamePlayers(q, clanTag)
  )

  if (Array.isArray(data)) {
    return { items: data, source: "live" }
  }
  return {
    items: data?.items || [],
    source: data?.source || "live",
  }
}
