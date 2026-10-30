import { useState } from "react"
import {
  UserPlusIcon,
  ShieldIcon,
  Trash2Icon,
  StarIcon,
  CheckCircle2Icon,
  LogInIcon,
  AlertCircleIcon,
} from "lucide-react"
import { authClient, linkIngameAccounts } from "@/lib/neonAuth"
import { PlayerClanLinker } from "@/components/auth/PlayerClanLinker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export function RegisterPage({
  onNavigateLogin,
  onRegisterSuccess,
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [linkedAccounts, setLinkedAccounts] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  function handleAddAccount(account) {
    setLinkedAccounts((prev) => {
      const exists = prev.some(
        (a) => a.playerTag.toUpperCase() === account.playerTag.toUpperCase()
      )
      if (exists) return prev
      const isFirst = prev.length === 0
      return [...prev, { ...account, isActive: isFirst }]
    })
    setErrorMsg(null)
  }

  function handleRemoveAccount(playerTag) {
    setLinkedAccounts((prev) => {
      const next = prev.filter((a) => a.playerTag !== playerTag)
      if (next.length > 0 && !next.some((a) => a.isActive)) {
        next[0] = { ...next[0], isActive: true }
      }
      return next
    })
  }

  function handleSetActive(playerTag) {
    setLinkedAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        isActive: a.playerTag === playerTag,
      }))
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg(null)

    if (linkedAccounts.length === 0) {
      setErrorMsg(
        "You must link at least 1 in-game Clash of Clans player and set their clan before registering."
      )
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim() || email.split("@")[0],
      })
      if (error) {
        throw new Error(error.message || "Registration failed")
      }

      let newUserId = data?.user?.id
      if (!newUserId) {
        const sessionRes = await authClient.getSession()
        newUserId = sessionRes?.data?.user?.id
      }

      const savedAccounts = await linkIngameAccounts(linkedAccounts, newUserId)

      if (onRegisterSuccess) {
        await onRegisterSuccess(data?.user, savedAccounts)
      }
    } catch (err) {
      setErrorMsg(err.message || "Registration failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNavigateLogin}
          className="gap-1.5"
        >
          <LogInIcon className="size-3.5" />
          Already have an account? Sign In
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Online User Credentials */}
          <div className="lg:col-span-5">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <Badge variant="outline" className="w-fit text-[11px]">
                  Step 1 of 2 • Online Profile
                </Badge>
                <CardTitle className="mt-1 text-xl font-bold">
                  Create Online Account
                </CardTitle>
                <CardDescription className="text-xs">
                  Your online account manages all of your Clash of Clans
                  in-game characters and clans in one place.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Online Display Name</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="e.g. Eyal / Clan Leader"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="leader@clan.gg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Password (min 8 chars)</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border/60 bg-muted/20 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Linked In-Game Players:
                  </span>
                  <Badge
                    variant={
                      linkedAccounts.length >= 1 ? "default" : "destructive"
                    }
                  >
                    {linkedAccounts.length} linked (min 1 required)
                  </Badge>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={submitting || linkedAccounts.length === 0}
                >
                  <UserPlusIcon className="size-4" />
                  {submitting
                    ? "Creating Account & Linking Players..."
                    : `Complete Registration (${linkedAccounts.length} In-Game ${
                        linkedAccounts.length === 1 ? "Player" : "Players"
                      })`}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Search & Link In-Game Player(s) + Set Clan */}
          <div className="space-y-4 lg:col-span-7">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="w-fit text-[11px]">
                    Step 2 of 2 • In-Game Linking (Required)
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    1+ in-game accounts per user
                  </span>
                </div>
                <CardTitle className="mt-1 text-xl font-bold">
                  Link Your In-Game Player(s) &amp; Clan
                </CardTitle>
                <CardDescription className="text-xs">
                  Search for your Clash of Clans in-game player(s) and set the
                  clan each player belongs to. You must link{" "}
                  <strong>at least 1</strong> in-game player, and you can link
                  multiple accounts (e.g. main + mini accounts) to switch
                  between them anytime.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Linked In-Game Accounts List */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Linked In-Game Accounts ({linkedAccounts.length})
                  </Label>

                  {linkedAccounts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-center text-xs text-amber-700 dark:text-amber-300">
                      No in-game players linked yet. Use the search below to
                      find your in-game player, confirm their clan, and add
                      them to your profile.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedAccounts.map((acc) => (
                        <div
                          key={acc.playerTag}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-xs transition-colors ${
                            acc.isActive
                              ? "border-primary/50 bg-primary/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {acc.clanBadgeUrl ? (
                              <img
                                src={acc.clanBadgeUrl}
                                alt={acc.clanName}
                                className="size-8 object-contain"
                              />
                            ) : (
                              <ShieldIcon className="size-6 text-primary" />
                            )}
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-sm text-foreground">
                                  {acc.playerName}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {acc.playerTag}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="h-4 px-1.5 text-[10px]"
                                >
                                  TH{acc.townHallLevel || 16}
                                </Badge>
                                {acc.isActive && (
                                  <Badge
                                    variant="default"
                                    className="h-4 gap-1 px-1.5 text-[10px]"
                                  >
                                    <CheckCircle2Icon className="size-2.5" />
                                    Active Default
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <span>Clan:</span>
                                <strong className="font-medium text-foreground">
                                  {acc.clanName}
                                </strong>
                                <span className="font-mono">
                                  ({acc.clanTag})
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!acc.isActive && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => handleSetActive(acc.playerTag)}
                                title="Set as default active player"
                                className="gap-1"
                              >
                                <StarIcon className="size-3" />
                                Set Active
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() =>
                                handleRemoveAccount(acc.playerTag)
                              }
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Remove linked player"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search & Link Component */}
                <PlayerClanLinker
                  existingTags={linkedAccounts.map((a) => a.playerTag)}
                  onAddAccount={handleAddAccount}
                  addButtonLabel={
                    linkedAccounts.length === 0
                      ? "Link Primary In-Game Player & Clan"
                      : "Link Another In-Game Player & Clan"
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </section>
  )
}

