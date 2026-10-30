import { createRealtimeClient } from "@neon/realtime/client"
import { getAuthBearerHeaders } from "./neonAuth"
import { requestBackendWithMockFallback } from "@/services/backendClient"
import {
  getMockLeagueByClanTag,
  saveMockLeague,
  updateMockPlayerAvailability,
  publishMockLeague,
  getMockNeonStatus,
} from "@/mocks"

const realtimeUrl =
  import.meta.env.VITE_NEON_REALTIME_URL ||
  "wss://ep-bold-water-b7mnmm4c.rt.c-13.us-east-1.aws.neon.tech/"

// One singleton RealtimeClient per app so subscriptions share the WebSocket connection
export const realtimeClient = createRealtimeClient({
  url: realtimeUrl,
})

export async function fetchLeagueByClanTag(clanTag) {
  const authHeaders = await getAuthBearerHeaders()
  return requestBackendWithMockFallback(
    `/api/leagues/${encodeURIComponent(clanTag)}`,
    { headers: authHeaders },
    () => getMockLeagueByClanTag(clanTag)
  )
}

export async function fetchSealedLeagueQuery(clanTag = null) {
  const authHeaders = await getAuthBearerHeaders()
  return requestBackendWithMockFallback(
    "/api/leagues/live",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ clanTag }),
    },
    () => {
      const mockRes = getMockLeagueByClanTag(clanTag)
      return {
        mockMode: true,
        clanTag,
        league: mockRes.league,
      }
    }
  )
}

export async function saveLeagueToNeonPostgres(payload) {
  const authHeaders = await getAuthBearerHeaders()
  return requestBackendWithMockFallback(
    "/api/leagues",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    },
    () => saveMockLeague(payload)
  )
}

/**
 * Saves a player's CWL opt-in status and 7-day availability preferences
 * ("interested" | "preferably_not" | "absolutely_not", defaulting to "interested" for all 7 days).
 */
export async function savePlayerAvailabilityToBackend({
  clanTag,
  clanName,
  playerTag,
  optedIn,
  days,
}) {
  const authHeaders = await getAuthBearerHeaders()
  return requestBackendWithMockFallback(
    `/api/leagues/${encodeURIComponent(clanTag)}/availability/${encodeURIComponent(playerTag)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        clanName,
        optedIn,
        days,
      }),
    },
    () =>
      updateMockPlayerAvailability(clanTag, playerTag, {
        optedIn,
        days,
        clanName,
      })
  )
}

/**
 * Publishes (`isPublished: true`) or unpublishes (`isPublished: false`) a clan's CWL schedule.
 */
export async function publishLeagueScheduleToBackend({
  clanTag,
  isPublished = true,
}) {
  const authHeaders = await getAuthBearerHeaders()
  return requestBackendWithMockFallback(
    `/api/leagues/${encodeURIComponent(clanTag)}/publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ isPublished }),
    },
    () => publishMockLeague(clanTag, { isPublished })
  )
}

export async function fetchNeonStatus() {
  const authHeaders = await getAuthBearerHeaders()
  return requestBackendWithMockFallback(
    "/api/neon/status",
    {
      headers: {
        ...authHeaders,
      },
    },
    () => getMockNeonStatus()
  )
}
