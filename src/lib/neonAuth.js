import { createAuthClient } from "@neondatabase/auth"
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters"
import { requestBackendWithMockFallback } from "@/services/backendClient"
import {
  getMockUserAccounts,
  linkMockUserAccounts,
  activateMockUserAccount,
  updateMockUserAccountClan,
  updateMockUserAccountRole,
  deleteMockUserAccount,
} from "@/mocks"

const neonAuthUrl =
  import.meta.env.VITE_NEON_AUTH_URL ||
  "https://ep-bold-water-b7mnmm4c.neonauth.c-13.us-east-1.aws.neon.tech/neondb/auth"

export const authClient = createAuthClient(neonAuthUrl, {
  adapter: BetterAuthReactAdapter(),
})

export async function getAuthBearerHeaders() {
  try {
    if (typeof authClient.token === "function") {
      const { data } = await authClient.token()
      if (data?.token) {
        return { Authorization: `Bearer ${data.token}` }
      }
    }
    const { data } = await authClient.getSession()
    const sessionToken = data?.session?.token
    if (sessionToken) {
      return { Authorization: `Bearer ${sessionToken}` }
    }
  } catch {
    // Unauthenticated or session expired
  }
  return {}
}

/**
 * Returns true if the linked in-game account has admin privileges ("leader", "coLeader", or "admin").
 */
export function isIngameAccountAdmin(account) {
  if (!account) return false
  const role = String(account.role || "").toLowerCase()
  return (
    role === "leader" ||
    role === "coleader" ||
    role === "co-leader" ||
    role === "admin"
  )
}

/**
 * Fetch all in-game Clash of Clans accounts linked to the online user
 * via GET http://0.0.0.0:8000/api/accounts, falling back to src/mocks/accountsMock.js.
 */
export async function fetchUserIngameAccounts(userId) {
  const headers = await getAuthBearerHeaders()
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : ""
  const data = await requestBackendWithMockFallback(
    `/api/accounts${qs}`,
    { headers },
    () => getMockUserAccounts(userId)
  )
  return data?.accounts || data?.items || []
}

/**
 * Link one or more in-game player accounts (with their clan) to the online user
 * via POST http://0.0.0.0:8000/api/accounts, falling back to src/mocks/accountsMock.js.
 */
export async function linkIngameAccounts(accounts, userId) {
  const headers = await getAuthBearerHeaders()
  const list = Array.isArray(accounts) ? accounts : [accounts]
  const data = await requestBackendWithMockFallback(
    "/api/accounts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        userId,
        accounts: list,
      }),
    },
    () => linkMockUserAccounts(userId, list)
  )
  return data?.accounts || data?.items || []
}

/**
 * Switch the active in-game player account for the online user
 * via PATCH http://0.0.0.0:8000/api/accounts/:playerTag/activate, falling back to src/mocks/accountsMock.js.
 */
export async function switchActiveIngameAccount(playerTag, userId) {
  const headers = await getAuthBearerHeaders()
  const data = await requestBackendWithMockFallback(
    `/api/accounts/${encodeURIComponent(playerTag)}/activate`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ userId }),
    },
    () => activateMockUserAccount(userId, playerTag)
  )
  return data?.accounts || data?.items || []
}

/**
 * Update the clan of a linked in-game player account
 * via PATCH http://0.0.0.0:8000/api/accounts/:playerTag/clan, falling back to src/mocks/accountsMock.js.
 */
export async function updateIngameAccountClan(playerTag, clan, userId) {
  const headers = await getAuthBearerHeaders()
  const data = await requestBackendWithMockFallback(
    `/api/accounts/${encodeURIComponent(playerTag)}/clan`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        userId,
        clanTag: clan.tag || clan.clanTag,
        clanName: clan.name || clan.clanName,
        clanBadgeUrl:
          clan.badgeUrls?.small || clan.badgeUrls?.medium || clan.clanBadgeUrl,
      }),
    },
    () => updateMockUserAccountClan(userId, playerTag, clan)
  )
  return data?.accounts || data?.items || []
}

/**
 * Update the role ("member" vs "leader"/"coLeader"/"admin") of a linked in-game player account
 * via PATCH http://0.0.0.0:8000/api/accounts/:playerTag/role, falling back to src/mocks/accountsMock.js.
 */
export async function updateIngameAccountRole(playerTag, role, userId) {
  const headers = await getAuthBearerHeaders()
  const data = await requestBackendWithMockFallback(
    `/api/accounts/${encodeURIComponent(playerTag)}/role`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ userId, role }),
    },
    () => updateMockUserAccountRole(userId, playerTag, role)
  )
  return data?.accounts || data?.items || []
}

/**
 * Remove a linked in-game player account (enforces keeping at least 1)
 * via DELETE http://0.0.0.0:8000/api/accounts/:playerTag, falling back to src/mocks/accountsMock.js.
 */
export async function deleteIngameAccount(playerTag, userId) {
  const headers = await getAuthBearerHeaders()
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : ""
  const data = await requestBackendWithMockFallback(
    `/api/accounts/${encodeURIComponent(playerTag)}${qs}`,
    {
      method: "DELETE",
      headers,
    },
    () => deleteMockUserAccount(userId, playerTag)
  )
  return data?.accounts || data?.items || []
}
