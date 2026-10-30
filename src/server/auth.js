import { createRemoteJWKSet, jwtVerify } from "jose"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

const authBaseUrl = process.env.NEON_AUTH_BASE_URL || ""
const jwksUrl =
  process.env.NEON_AUTH_JWKS_URL ||
  (authBaseUrl ? `${authBaseUrl.replace(/\/$/, "")}/.well-known/jwks.json` : "")

const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null

/**
 * Verifies a Neon Auth (Managed Better Auth) JWT against NEON_AUTH_JWKS_URL,
 * or falls back to verifying a session token against NEON_AUTH_BASE_URL/get-session.
 */
export async function verifyNeonAuthUser(headers) {
  const authHeader =
    headers.get?.("Authorization") || headers.get?.("authorization") || ""
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : ""

  if (!token) {
    return null
  }

  // 1. Verify EdDSA JWT against NEON_AUTH_JWKS_URL
  if (jwks && authBaseUrl) {
    try {
      const origin = new URL(authBaseUrl).origin
      const { payload } = await jwtVerify(token, jwks, {
        issuer: origin,
      })
      if (payload?.sub) {
        return {
          id: String(payload.sub),
          email: payload.email ? String(payload.email) : null,
          name: payload.name ? String(payload.name) : null,
        }
      }
    } catch {
      // Fall through to session lookup if token is an opaque session token
    }
  }

  // 2. Fallback: verify session token via Managed Better Auth /get-session
  if (authBaseUrl) {
    try {
      const res = await fetch(`${authBaseUrl.replace(/\/$/, "")}/get-session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const body = await res.json()
        const user = body?.user || body?.data?.user
        if (user?.id) {
          return {
            id: String(user.id),
            email: user.email || null,
            name: user.name || null,
          }
        }
      }
    } catch {
      // Ignore network errors on fallback
    }
  }

  return null
}

