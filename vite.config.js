import path from "path"
import { fileURLToPath } from "url"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) {
      process.env[k] = v
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_BACKEND_URL": JSON.stringify(
        env.VITE_BACKEND_URL || "http://0.0.0.0:8000"
      ),
      "import.meta.env.VITE_NEON_AUTH_URL": JSON.stringify(
        env.VITE_NEON_AUTH_URL || env.NEON_AUTH_BASE_URL || ""
      ),
      "import.meta.env.VITE_NEON_REALTIME_URL": JSON.stringify(
        env.VITE_NEON_REALTIME_URL || env.NEON_REALTIME_URL || ""
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
