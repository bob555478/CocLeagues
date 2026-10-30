import { useState, useEffect } from "react"
import {
  SearchIcon,
  ShieldIcon,
  UserCheckIcon,
  PlusIcon,
  TrophyIcon,
  CheckIcon,
  RefreshCwIcon,
} from "lucide-react"
import { searchIngamePlayers, searchClans } from "@/services/cocApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function PlayerClanLinker({
  existingTags = [],
  onAddAccount,
  addButtonLabel = "Add In-Game Account to Profile",
}) {
  // Step 1: Search & select in-game player
  const [playerQuery, setPlayerQuery] = useState("")
  const [playerResults, setPlayerResults] = useState([])
  const [searchingPlayers, setSearchingPlayers] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Step 2: Set / search clan for the selected in-game player
  const [selectedClan, setSelectedClan] = useState(null)
  const [selectedRole, setSelectedRole] = useState("member")
  const [showClanSearch, setShowClanSearch] = useState(false)
  const [clanQuery, setClanQuery] = useState("")
  const [clanResults, setClanResults] = useState([])
  const [searchingClans, setSearchingClans] = useState(false)

  // Load initial player suggestions
  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (!cancelled) setSearchingPlayers(true)
        return searchIngamePlayers(playerQuery)
      })
      .then((res) => {
        if (!cancelled) {
          setPlayerResults(res?.items || [])
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearchingPlayers(false)
      })
    return () => {
      cancelled = true
    }
  }, [playerQuery])

  // Load clan search results when user searches for a clan
  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (!cancelled) setSearchingClans(true)
        return searchClans({ name: clanQuery })
      })
      .then((res) => {
        if (!cancelled) {
          setClanResults(res?.items || [])
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearchingClans(false)
      })
    return () => {
      cancelled = true
    }
  }, [clanQuery])

  function handleSelectPlayer(player) {
    setSelectedPlayer(player)
    const rawRole = String(player.role || "member").toLowerCase()
    const isPlayerAdmin =
      rawRole === "leader" || rawRole === "coleader" || rawRole === "admin"
    setSelectedRole(isPlayerAdmin ? "leader" : "member")
    if (player.clan?.tag) {
      setSelectedClan({
        tag: player.clan.tag,
        name: player.clan.name,
        badgeUrl:
          player.clan.badgeUrls?.small || player.clan.badgeUrls?.medium || null,
      })
      setShowClanSearch(false)
    } else {
      setSelectedClan(null)
      setShowClanSearch(true)
    }
  }

  function handleSelectClan(clan) {
    setSelectedClan({
      tag: clan.tag,
      name: clan.name,
      badgeUrl: clan.badgeUrls?.small || clan.badgeUrls?.medium || null,
    })
    setShowClanSearch(false)
  }

  function handleAdd() {
    if (!selectedPlayer || !selectedClan) return
    onAddAccount({
      playerTag: selectedPlayer.tag,
      playerName: selectedPlayer.name,
      townHallLevel: selectedPlayer.townHallLevel || 16,
      trophies: selectedPlayer.trophies || 0,
      role: selectedRole || selectedPlayer.role || "member",
      clanTag: selectedClan.tag,
      clanName: selectedClan.name,
      clanBadgeUrl: selectedClan.badgeUrl,
    })
    // Reset selection so user can easily link another in-game player
    setSelectedPlayer(null)
    setSelectedClan(null)
    setSelectedRole("member")
    setPlayerQuery("")
    setShowClanSearch(false)
  }

  const normalizedExisting = new Set(
    existingTags.map((t) => String(t).toUpperCase())
  )

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4">
      {/* Step 1: Search In-Game Player */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1. Search In-Game Player (Name or #TAG)
          </Label>
          {selectedPlayer && (
            <button
              type="button"
              onClick={() => {
                setSelectedPlayer(null)
                setSelectedClan(null)
              }}
              className="text-xs text-primary hover:underline"
            >
              Change player
            </button>
          )}
        </div>

        {!selectedPlayer ? (
          <>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={playerQuery}
                onChange={(e) => setPlayerQuery(e.target.value)}
                placeholder="Search by player name (e.g. Pendragon, Valkyrie) or #TAG..."
                className="pl-9 text-sm"
              />
            </div>

            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border/60 bg-background p-2">
              {searchingPlayers && playerResults.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Searching Clash of Clans players...
                </p>
              ) : playerResults.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No matching players found. Try entering a player name or #TAG.
                </p>
              ) : (
                playerResults.slice(0, 12).map((player) => {
                  const alreadyAdded = normalizedExisting.has(
                    String(player.tag).toUpperCase()
                  )
                  return (
                    <div
                      key={player.tag}
                      className="flex items-center justify-between gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-xs transition-colors hover:border-border hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {player.name}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {player.tag}
                          </span>
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px]"
                          >
                            TH{player.townHallLevel || 16}
                          </Badge>
                          {player.trophies != null && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                              <TrophyIcon className="size-3" />
                              {player.trophies}
                            </span>
                          )}
                        </div>
                        {player.clan && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <ShieldIcon className="size-3 text-primary/70" />
                            <span>
                              In clan:{" "}
                              <strong className="font-medium text-foreground/80">
                                {player.clan.name}
                              </strong>{" "}
                              ({player.clan.tag})
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="xs"
                        variant={alreadyAdded ? "secondary" : "outline"}
                        disabled={alreadyAdded}
                        onClick={() => handleSelectPlayer(player)}
                      >
                        {alreadyAdded ? (
                          <>
                            <CheckIcon className="size-3" />
                            Linked
                          </>
                        ) : (
                          "Select"
                        )}
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <UserCheckIcon className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-foreground">
                    {selectedPlayer.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedPlayer.tag}
                  </span>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    TH{selectedPlayer.townHallLevel || 16}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Role: {selectedPlayer.role || "member"} •{" "}
                  {selectedPlayer.trophies || 0} Trophies
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Set Clan for the Selected In-Game Player */}
      {selectedPlayer && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Set Player&apos;s Clan
            </Label>
            {selectedClan && !showClanSearch && (
              <button
                type="button"
                onClick={() => setShowClanSearch(true)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <RefreshCwIcon className="size-3" />
                Change Clan
              </button>
            )}
          </div>

          {selectedClan && !showClanSearch ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
              <div className="flex items-center gap-2.5">
                {selectedClan.badgeUrl ? (
                  <img
                    src={selectedClan.badgeUrl}
                    alt={selectedClan.name}
                    className="size-7 object-contain"
                  />
                ) : (
                  <ShieldIcon className="size-5 text-emerald-500" />
                )}
                <div>
                  <div className="font-semibold text-foreground">
                    {selectedClan.name}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {selectedClan.tag}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                Assigned Clan
              </Badge>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={clanQuery}
                  onChange={(e) => setClanQuery(e.target.value)}
                  placeholder="Search clan by name or #TAG..."
                  className="pl-9 text-sm"
                />
              </div>

              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/60 bg-background p-2">
                {searchingClans && clanResults.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    Searching clans...
                  </p>
                ) : clanResults.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No clans found.
                  </p>
                ) : (
                  clanResults.map((clan) => (
                    <div
                      key={clan.tag}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        {clan.badgeUrls?.small && (
                          <img
                            src={clan.badgeUrls.small}
                            alt={clan.name}
                            className="size-6 object-contain"
                          />
                        )}
                        <div>
                          <span className="font-semibold">{clan.name}</span>{" "}
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {clan.tag}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => handleSelectClan(clan)}
                      >
                        Set Clan
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3. Player Permissions in Clan
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("member")}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  selectedRole === "member"
                    ? "border-primary bg-primary/10 font-semibold text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div>Normal Player (Member)</div>
                <div className="text-[10px] font-normal text-muted-foreground">
                  Views league schedule &amp; playing days
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("leader")}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  selectedRole !== "member"
                    ? "border-primary bg-primary/10 font-semibold text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div>Clan Admin (Leader / Co-Leader)</div>
                <div className="text-[10px] font-normal text-muted-foreground">
                  Can edit &amp; publish 7-day CWL schedule
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              className="w-full gap-1.5"
              disabled={!selectedPlayer || !selectedClan}
              onClick={handleAdd}
            >
              <PlusIcon className="size-4" />
              {addButtonLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
