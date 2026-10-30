import { useState, useEffect } from "react"
import {
  DatabaseIcon,
  UserIcon,
  LogOutIcon,
  LogInIcon,
  RadioIcon,
  CheckCircle2Icon,
  ChevronsUpDownIcon,
  ShieldIcon,
  PlusIcon,
  Trash2Icon,
  CheckIcon,
  Settings2Icon,
  RefreshCwIcon,
  CrownIcon,
} from "lucide-react"
import {
  authClient,
  fetchUserIngameAccounts,
  linkIngameAccounts,
  switchActiveIngameAccount,
  updateIngameAccountClan,
  updateIngameAccountRole,
  deleteIngameAccount,
  isIngameAccountAdmin,
} from "@/lib/neonAuth"
import { fetchNeonStatus } from "@/lib/neonRealtime"
import { searchClans } from "@/services/cocApi"
import { PlayerClanLinker } from "@/components/auth/PlayerClanLinker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function NeonAuthBar({
  currentView,
  onNavigateView,
  ingameAccounts = [],
  onAccountsChange,
  accountsRefreshKey = 0,
}) {
  const { data: sessionData, isPending } = authClient.useSession()
  const user = sessionData?.user || null

  const [neonStatus, setNeonStatus] = useState(null)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [editingClanForTag, setEditingClanForTag] = useState(null)
  const [clanSearchQuery, setClanSearchQuery] = useState("")
  const [clanSearchResults, setClanSearchResults] = useState([])
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchNeonStatus()
      .then((st) => {
        if (!cancelled) setNeonStatus(st)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Load linked in-game accounts whenever user is signed in
  useEffect(() => {
    let cancelled = false
    if (!user?.id) {
      Promise.resolve().then(() => {
        if (!cancelled) onAccountsChange?.([])
      })
      return () => {
        cancelled = true
      }
    }
    Promise.resolve()
      .then(() => {
        if (!cancelled) setLoadingAccounts(true)
        return fetchUserIngameAccounts(user.id)
      })
      .then((list) => {
        if (!cancelled) {
          onAccountsChange?.(list)
          if (list.length === 0) {
            setManageDialogOpen(true)
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingAccounts(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, accountsRefreshKey, onAccountsChange])

  // Search clans when updating an existing linked player's clan
  useEffect(() => {
    if (!editingClanForTag) return
    let cancelled = false
    searchClans({ name: clanSearchQuery })
      .then((res) => {
        if (!cancelled) setClanSearchResults(res.items || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [editingClanForTag, clanSearchQuery])

  const activeAccount =
    ingameAccounts.find((a) => a.is_active) || ingameAccounts[0] || null

  async function handleSwitchAccount(playerTag) {
    if (!user?.id) return
    setActionError(null)
    try {
      const updated = await switchActiveIngameAccount(playerTag, user.id)
      onAccountsChange?.(updated)
      setSwitcherOpen(false)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleAddAccount(newAccount) {
    if (!user?.id) return
    setActionError(null)
    try {
      const updated = await linkIngameAccounts([newAccount], user.id)
      onAccountsChange?.(updated)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleRemoveAccount(playerTag) {
    if (!user?.id) return
    setActionError(null)
    try {
      const updated = await deleteIngameAccount(playerTag, user.id)
      onAccountsChange?.(updated)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleChangePlayerClan(playerTag, clan) {
    if (!user?.id) return
    setActionError(null)
    try {
      const updated = await updateIngameAccountClan(playerTag, clan, user.id)
      onAccountsChange?.(updated)
      setEditingClanForTag(null)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleTogglePlayerRole(acc) {
    if (!user?.id) return
    setActionError(null)
    const nextRole = isIngameAccountAdmin(acc) ? "member" : "leader"
    try {
      const updated = await updateIngameAccountRole(
        acc.player_tag,
        nextRole,
        user.id
      )
      onAccountsChange?.(updated)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleSignOut() {
    await authClient.signOut()
    window.location.reload()
  }

  return (
    <div className="border-b border-border/70 bg-muted/30 px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Backend (http://0.0.0.0:8000) & Live Services Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-[11px]">
            <DatabaseIcon
              className={`size-3 ${
                neonStatus?.source === "mock"
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            />
            <span>
              Backend (http://0.0.0.0:8000):{" "}
              {neonStatus?.source === "mock"
                ? "Offline (Using Mock Fallback)"
                : neonStatus?.postgres?.connected
                  ? `${neonStatus.postgres.database} (${neonStatus.branch})`
                  : "Connected"}
            </span>
          </Badge>

          <Badge variant="outline" className="gap-1.5 font-mono text-[11px]">
            <RadioIcon className="size-3 text-sky-500" />
            <span>
              Sync Mode:{" "}
              {neonStatus?.source === "mock"
                ? "Mock Store (src/mocks)"
                : neonStatus?.realtime?.configured
                  ? "Neon Realtime Live"
                  : "Standard HTTP"}
            </span>
          </Badge>
        </div>

        {/* Right: User Auth & In-Game Player Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {isPending ? (
            <span className="text-muted-foreground">Checking session...</span>
          ) : user ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* Online User Badge */}
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle2Icon className="size-3 text-emerald-500" />
                <span>{user.name || user.email}</span>
              </Badge>

              {/* Active In-Game Player Switcher */}
              <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="gap-1.5 border-primary/40 bg-background font-medium"
                    />
                  }
                >
                  <ShieldIcon className="size-3.5 text-primary" />
                  {loadingAccounts ? (
                    <span>Loading player...</span>
                  ) : activeAccount ? (
                    <>
                      <span className="font-semibold text-foreground">
                        {activeAccount.player_name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({activeAccount.player_tag})
                      </span>
                      <span className="hidden text-muted-foreground sm:inline">
                        • {activeAccount.clan_name}
                      </span>
                      <Badge
                        variant={
                          isIngameAccountAdmin(activeAccount)
                            ? "default"
                            : "secondary"
                        }
                        className="ml-0.5 h-4 px-1 text-[9px]"
                      >
                        {isIngameAccountAdmin(activeAccount)
                          ? "Admin"
                          : "Member"}
                      </Badge>
                    </>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Link In-Game Player (Required)
                    </span>
                  )}
                  <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
                </PopoverTrigger>

                <PopoverContent align="end" className="w-80 p-3">
                  <PopoverHeader className="border-b border-border/60 pb-2">
                    <PopoverTitle className="flex items-center justify-between text-xs font-semibold">
                      <span>Switch In-Game Player</span>
                      <Badge variant="outline" className="text-[10px]">
                        {ingameAccounts.length} linked
                      </Badge>
                    </PopoverTitle>
                    <PopoverDescription className="text-[11px]">
                      Switching your active in-game player automatically opens
                      that player&apos;s clan and weekly schedule.
                    </PopoverDescription>
                  </PopoverHeader>

                  <div className="max-h-60 space-y-1.5 overflow-y-auto py-1">
                    {ingameAccounts.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">
                        No in-game accounts linked yet.
                      </p>
                    ) : (
                      ingameAccounts.map((acc) => {
                        const accIsAdmin = isIngameAccountAdmin(acc)
                        return (
                          <button
                            key={acc.player_tag}
                            type="button"
                            onClick={() => handleSwitchAccount(acc.player_tag)}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                              acc.is_active
                                ? "border-primary/50 bg-primary/10"
                                : "border-transparent hover:border-border hover:bg-muted/60"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {acc.clan_badge_url ? (
                                <img
                                  src={acc.clan_badge_url}
                                  alt={acc.clan_name}
                                  className="size-6 shrink-0 object-contain"
                                />
                              ) : (
                                <ShieldIcon className="size-4 shrink-0 text-primary" />
                              )}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate font-semibold text-foreground">
                                    {acc.player_name}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {acc.player_tag}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="h-3.5 px-1 text-[9px]"
                                  >
                                    TH{acc.town_hall_level || 16}
                                  </Badge>
                                  <Badge
                                    variant={
                                      accIsAdmin ? "default" : "secondary"
                                    }
                                    className="h-3.5 px-1 text-[9px]"
                                  >
                                    {accIsAdmin ? "Admin" : "Member"}
                                  </Badge>
                                </div>
                                <div className="truncate text-[11px] text-muted-foreground">
                                  Clan: {acc.clan_name} ({acc.clan_tag})
                                </div>
                              </div>
                            </div>

                            {acc.is_active && (
                              <CheckIcon className="size-4 shrink-0 text-primary" />
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="w-full justify-start gap-1.5"
                      onClick={() => {
                        setSwitcherOpen(false)
                        setManageDialogOpen(true)
                      }}
                    >
                      <Settings2Icon className="size-3.5" />
                      Manage / Link More In-Game Accounts
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setManageDialogOpen(true)}
                className="gap-1"
              >
                <Settings2Icon className="size-3" />
                <span className="hidden sm:inline">Accounts</span> (
                {ingameAccounts.length})
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleSignOut}
                className="gap-1"
              >
                <LogOutIcon className="size-3" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant={currentView === "login" ? "default" : "outline"}
                size="xs"
                onClick={() => onNavigateView && onNavigateView("login")}
                className="gap-1"
              >
                <LogInIcon className="size-3" />
                Login
              </Button>
              <Button
                type="button"
                variant={currentView === "register" ? "default" : "outline"}
                size="xs"
                onClick={() => onNavigateView && onNavigateView("register")}
                className="gap-1"
              >
                <UserIcon className="size-3" />
                Register &amp; Link Player
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Manage / Add Linked In-Game Accounts Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage Linked In-Game Accounts</DialogTitle>
            <DialogDescription className="text-xs">
              One online user can have many Clash of Clans in-game players, and
              must keep at least 1 linked player at all times. Switch active
              players, change their clan, or toggle Admin/Member role below.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
              {actionError}
            </div>
          )}

          {/* Existing Linked Accounts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Your Linked In-Game Players ({ingameAccounts.length})</span>
              <span>Min 1 required</span>
            </div>

            {ingameAccounts.length === 0 ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                Please link at least 1 in-game Clash of Clans player and set
                their clan below.
              </div>
            ) : (
              <div className="space-y-2">
                {ingameAccounts.map((acc) => {
                  const accIsAdmin = isIngameAccountAdmin(acc)
                  return (
                    <div
                      key={acc.player_tag}
                      className={`rounded-xl border p-3 text-xs ${
                        acc.is_active
                          ? "border-primary/50 bg-primary/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {acc.clan_badge_url ? (
                            <img
                              src={acc.clan_badge_url}
                              alt={acc.clan_name}
                              className="size-8 object-contain"
                            />
                          ) : (
                            <ShieldIcon className="size-6 text-primary" />
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-sm">
                                {acc.player_name}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {acc.player_tag}
                              </span>
                              <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-[10px]"
                              >
                                TH{acc.town_hall_level || 16}
                              </Badge>
                              <Badge
                                variant={accIsAdmin ? "default" : "outline"}
                                className="h-4 gap-0.5 px-1.5 text-[10px]"
                              >
                                {accIsAdmin && (
                                  <CrownIcon className="size-2.5" />
                                )}
                                {accIsAdmin ? "Clan Admin" : "Member"}
                              </Badge>
                              {acc.is_active && (
                                <Badge
                                  variant="default"
                                  className="h-4 px-1.5 text-[10px]"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span>
                                Clan:{" "}
                                <strong className="text-foreground">
                                  {acc.clan_name}
                                </strong>{" "}
                                ({acc.clan_tag})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingClanForTag(
                                    editingClanForTag === acc.player_tag
                                      ? null
                                      : acc.player_tag
                                  )
                                  setClanSearchQuery("")
                                }}
                                className="inline-flex items-center gap-0.5 text-primary hover:underline"
                              >
                                <RefreshCwIcon className="size-2.5" />
                                Change Clan
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleTogglePlayerRole(acc)}
                                className="text-primary hover:underline"
                              >
                                Set as {accIsAdmin ? "Member" : "Admin"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!acc.is_active && (
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                handleSwitchAccount(acc.player_tag)
                              }
                            >
                              Switch To
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            disabled={ingameAccounts.length <= 1}
                            onClick={() => handleRemoveAccount(acc.player_tag)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                            title={
                              ingameAccounts.length <= 1
                                ? "You must have at least 1 linked in-game account"
                                : "Remove this in-game account"
                            }
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Inline Clan Changer for this player */}
                      {editingClanForTag === acc.player_tag && (
                        <div className="mt-3 space-y-2 border-t border-border/60 pt-2.5">
                          <Input
                            type="text"
                            value={clanSearchQuery}
                            onChange={(e) => setClanSearchQuery(e.target.value)}
                            placeholder="Search new clan for this player..."
                            className="h-8 text-xs"
                          />
                          <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border/60 bg-background p-1.5">
                            {clanSearchResults.map((clan) => (
                              <div
                                key={clan.tag}
                                className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/60"
                              >
                                <span>
                                  <strong>{clan.name}</strong>{" "}
                                  <span className="font-mono text-muted-foreground">
                                    ({clan.tag})
                                  </span>
                                </span>
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  onClick={() =>
                                    handleChangePlayerClan(acc.player_tag, clan)
                                  }
                                >
                                  Select Clan
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add Another In-Game Player Section */}
          <div className="space-y-2 border-t border-border/60 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <PlusIcon className="size-3.5" />
              <span>Link Another In-Game Player</span>
            </div>
            <PlayerClanLinker
              existingTags={ingameAccounts.map((a) => a.player_tag)}
              onAddAccount={handleAddAccount}
              addButtonLabel="Link In-Game Player & Clan"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
