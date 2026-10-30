export function getMockNeonStatus() {
  return {
    ok: true,
    source: "mock",
    branch: "mock-fallback",
    backendUrl: "http://0.0.0.0:8000",
    postgres: {
      connected: false,
      database: "Mock Store (Backend Offline)",
      serverTime: new Date().toISOString(),
    },
    auth: {
      configured: true,
      authenticated: false,
      user: null,
    },
    realtime: {
      configured: false,
      url: null,
    },
  }
}

