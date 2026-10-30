export const BACKEND_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://0.0.0.0:8000"
).replace(/\/+$/, "")

const FALLBACK_LOCALHOST_URL = "http://127.0.0.1:8000"

let lastBackendMode = "unknown" // "live" | "mock" | "unknown"
const listeners = new Set()

export function getBackendMode() {
  return lastBackendMode
}

export function setBackendMode(mode) {
  if (lastBackendMode !== mode) {
    lastBackendMode = mode
    for (const fn of listeners) {
      try {
        fn(mode)
      } catch {
        // Ignore listener error
      }
    }
  }
}

export function subscribeBackendMode(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return res
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Calls the backend at `http://0.0.0.0:8000` (and `http://127.0.0.1:8000` on Windows browsers
 * where 0.0.0.0 is non-routable as a client destination).
 * If the backend is not responding or returns 5xx/404 when offline, invokes `mockFallback()`.
 */
export async function requestBackendWithMockFallback(
  path,
  options = {},
  mockFallback
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const primaryUrl = `${BACKEND_BASE_URL}${normalizedPath}`

  const candidateUrls = [primaryUrl]
  if (primaryUrl.includes("0.0.0.0:8000")) {
    candidateUrls.push(`${FALLBACK_LOCALHOST_URL}${normalizedPath}`)
  }

  for (const url of candidateUrls) {
    try {
      const response = await fetchWithTimeout(url, options, 2500)
      if (response.ok) {
        setBackendMode("live")
        return await response.json()
      }
      // If the backend responded with an explicit client validation error (400/401/403),
      // parse and surface it unless it's a missing route / server error
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const errData = await response.json().catch(() => ({}))
        if (errData?.error || errData?.message) {
          setBackendMode("live")
          throw new Error(errData.error || errData.message)
        }
      }
    } catch (err) {
      // If it was an explicit application error from a live backend, rethrow it
      if (lastBackendMode === "live" && err.name !== "AbortError" && !String(err.message).includes("Failed to fetch") && !String(err.message).includes("NetworkError") && !String(err.message).includes("Load failed")) {
        throw err
      }
      // Otherwise try next candidate URL or fall back to mock
    }
  }

  setBackendMode("mock")
  if (typeof mockFallback === "function") {
    return await mockFallback()
  }
  throw new Error(`Backend at ${BACKEND_BASE_URL} is not responding and no mock fallback was provided for ${normalizedPath}`)
}

