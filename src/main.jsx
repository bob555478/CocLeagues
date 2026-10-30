import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RealtimeProvider } from "@neon/realtime-react"
import { realtimeClient } from "@/lib/neonRealtime"
import "./index.css"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RealtimeProvider client={realtimeClient}>
      <App />
    </RealtimeProvider>
  </StrictMode>
)
