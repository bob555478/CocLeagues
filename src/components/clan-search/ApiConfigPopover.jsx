import { useState } from "react"
import { KeyRoundIcon, CheckCircle2Icon, FlaskConicalIcon, ExternalLinkIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  getStoredApiToken,
  setStoredApiToken,
  getStoredApiMode,
  setStoredApiMode,
} from "@/services/cocApi"

export function ApiConfigPopover({ onConfigChanged }) {
  const [token, setToken] = useState(() => getStoredApiToken())
  const [mode, setMode] = useState(() => getStoredApiMode())
  const [open, setOpen] = useState(false)

  const isLiveActive =
    mode === "live" || (mode === "auto" && Boolean(token.trim()))

  function handleSave() {
    setStoredApiToken(token)
    setStoredApiMode(mode)
    setOpen(false)
    onConfigChanged?.()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" />
        }
      >
        {isLiveActive ? (
          <>
            <CheckCircle2Icon className="size-3.5 text-emerald-500" />
            <span>CoC API: Live</span>
          </>
        ) : (
          <>
            <FlaskConicalIcon className="size-3.5 text-amber-500" />
            <span>CoC API: Demo Mode</span>
          </>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-3 p-3.5">
        <PopoverHeader>
          <PopoverTitle className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRoundIcon className="size-4 text-primary" />
              Clash of Clans API
            </span>
            <Badge variant={isLiveActive ? "default" : "secondary"}>
              {isLiveActive ? "Live v1" : "Demo"}
            </Badge>
          </PopoverTitle>
          <PopoverDescription className="text-xs">
            Requests proxy through <code className="font-mono">/api/coc</code> to{" "}
            <code className="font-mono">api.clashofclans.com/v1</code>.
          </PopoverDescription>
        </PopoverHeader>

        <div className="space-y-1.5">
          <Label className="text-xs">Data Source Mode</Label>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {[
              { id: "auto", label: "Auto" },
              { id: "live", label: "Live API" },
              { id: "demo", label: "Demo" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded-md py-1 text-xs font-medium transition-colors ${
                  mode === item.id
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="coc-jwt-token" className="text-xs">
            Bearer JWT Token (or <code className="font-mono">VITE_COC_API_TOKEN</code>)
          </Label>
          <Input
            id="coc-jwt-token"
            type="password"
            placeholder="eyJ0eXAiOiJKV1QiLCJhbGci..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <a
            href="https://developer.clashofclans.com/#/documentation"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            Get a token at developer.clashofclans.com
            <ExternalLinkIcon className="size-3" />
          </a>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setToken("")
              setMode("demo")
              setStoredApiToken("")
              setStoredApiMode("demo")
              setOpen(false)
              onConfigChanged?.()
            }}
          >
            Use Demo
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            Save & Reload
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

