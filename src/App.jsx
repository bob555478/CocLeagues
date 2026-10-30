import { useState, useMemo, useCallback } from "react"
import { ShieldIcon } from "lucide-react"
import { LeagueSetupPage } from "@/components/league-setup/LeagueSetupPage"
import { NeonAuthBar } from "@/components/neon/NeonAuthBar"
import { LoginPage } from "@/components/auth/LoginPage"
import { RegisterPage } from "@/components/auth/RegisterPage"
import { PlayerClanLinker } from "@/components/auth/PlayerClanLinker"
import {
  authClient,
  isIngameAccountAdmin,
  linkIngameAccounts,
  updateIngameAccountRole,
} from "@/lib/neonAuth"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

function App() {
  const { data: sessionData, isPending } = authClient.useSession()
  const user = sessionData?.user || null

  // For unauthenticated users: "login" | "register"
  const [authView, setAuthView] = useState("login")
  const [ingameAccounts, setIngameAccounts] = useState([])
  const [accountsRefreshKey, setAccountsRefreshKey] = useState(0)

  const handleAccountsChange = useCallback((list) => {
    setIngameAccounts(Array.isArray(list) ? list : [])
  }, [])

  const activeAccount = useMemo(
    () => ingameAccounts.find((a) => a.is_active) || ingameAccounts[0] || null,
    [ingameAccounts]
  )

  const activeClan = useMemo(() => {
    if (!activeAccount?.clan_tag) return null
    return {
      tag: activeAccount.clan_tag,
      name: activeAccount.clan_name,
      badgeUrls: activeAccount.clan_badge_url
        ? {
            small: activeAccount.clan_badge_url,
            medium: activeAccount.clan_badge_url,
          }
        : undefined,
    }
  }, [activeAccount])

  const isAdmin = isIngameAccountAdmin(activeAccount)

  async function handleToggleActiveRole() {
    if (!user?.id || !activeAccount) return
    const nextRole = isAdmin ? "member" : "leader"
    try {
      const updated = await updateIngameAccountRole(
        activeAccount.player_tag,
        nextRole,
        user.id
      )
      setIngameAccounts(updated)
    } catch {
      // Ignore error
    }
  }

  async function handleLinkFirstAccount(newAcc) {
    if (!user?.id) return
    const updated = await linkIngameAccounts(
      [{ ...newAcc, setActive: true }],
      user.id
    )
    setIngameAccounts(updated)
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <NeonAuthBar
        currentView={user ? "league" : authView}
        onNavigateView={(nextView) => setAuthView(nextView)}
        ingameAccounts={ingameAccounts}
        onAccountsChange={handleAccountsChange}
        accountsRefreshKey={accountsRefreshKey}
      />

      {isPending ? (
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Loading your Clash of Clans session...
        </div>
      ) : !user ? (
        authView === "register" ? (
          <RegisterPage
            onNavigateLogin={() => setAuthView("login")}
            onRegisterSuccess={(_newUser, savedAccounts) => {
              if (Array.isArray(savedAccounts)) {
                setIngameAccounts(savedAccounts)
              }
              setAccountsRefreshKey((k) => k + 1)
            }}
          />
        ) : (
          <LoginPage
            onNavigateRegister={() => setAuthView("register")}
            onLoginSuccess={() => {
              setAccountsRefreshKey((k) => k + 1)
            }}
          />
        )
      ) : activeClan && activeAccount ? (
        <LeagueSetupPage
          key={`${activeAccount.player_tag}:${activeAccount.clan_tag}`}
          clan={activeClan}
          activeAccount={activeAccount}
          isAdmin={isAdmin}
          onToggleRole={handleToggleActiveRole}
        />
      ) : (
        <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <ShieldIcon className="size-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  In-Game Player Required
                </span>
              </div>
              <CardTitle className="text-xl font-bold">
                Link Your In-Game Player &amp; Clan
              </CardTitle>
              <CardDescription className="text-xs">
                Every online account must have at least 1 linked Clash of Clans
                in-game player and their clan to view your weekly CWL schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerClanLinker
                existingTags={[]}
                onAddAccount={handleLinkFirstAccount}
                addButtonLabel="Link In-Game Player & Open Clan Schedule"
              />
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  )
}

export default App
