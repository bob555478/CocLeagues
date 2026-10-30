import { useState } from "react"
import {
  UserCheckIcon,
  UserXIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  ClockIcon,
  RotateCcwIcon,
  CrownIcon,
  UserIcon,
  SaveIcon,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CWL_DAYS,
  AVAILABILITY_STATUS,
  AVAILABILITY_OPTIONS,
  createDefaultPlayerAvailability,
  getPlayerWeekAvailability,
} from "@/lib/leagueRules"

export function MemberAvailabilityCard({
  activeAccount,
  isAdmin = false,
  isPublished = false,
  optedInTags = [],
  availabilityByTag = {},
  opponentsByDay = {},
  onSaveAvailability,
  onToggleRole,
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  if (!activeAccount) return null

  const playerTag = activeAccount.player_tag
  const isOptedIn = optedInTags.some(
    (t) => String(t).toUpperCase() === String(playerTag).toUpperCase()
  )
  const playerWeek = getPlayerWeekAvailability(availabilityByTag, playerTag)

  async function triggerSave(nextOptedIn, nextDays) {
    if (!onSaveAvailability) return
    setIsSaving(true)
    setSavedNotice(false)
    try {
      await onSaveAvailability({
        playerTag,
        optedIn: nextOptedIn,
        days: nextDays,
      })
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2500)
    } finally {
      setIsSaving(false)
    }
  }

  function handleToggleOptIn(nextOptIn) {
    if (isPublished && !isAdmin) return
    // When opting in, default the entire week to "interested"
    const nextDays = nextOptIn
      ? createDefaultPlayerAvailability()
      : playerWeek
    triggerSave(nextOptIn, nextDays)
  }

  function handleSetDayStatus(day, statusValue) {
    if (isPublished && !isAdmin) return
    const nextDays = {
      ...playerWeek,
      [day]: statusValue,
    }
    triggerSave(true, nextDays)
  }

  function handleResetAllInterested() {
    if (isPublished && !isAdmin) return
    const defaultWeek = createDefaultPlayerAvailability()
    triggerSave(true, defaultWeek)
  }

  const interestedCount = CWL_DAYS.filter(
    (d) => playerWeek[d] === AVAILABILITY_STATUS.INTERESTED
  ).length
  const preferablyNotCount = CWL_DAYS.filter(
    (d) => playerWeek[d] === AVAILABILITY_STATUS.PREFERABLY_NOT
  ).length
  const absolutelyNotCount = CWL_DAYS.filter(
    (d) => playerWeek[d] === AVAILABILITY_STATUS.ABSOLUTELY_NOT
  ).length

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
      <CardHeader className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={isPublished ? "default" : "outline"}
              className={
                isPublished
                  ? "bg-emerald-600 text-white"
                  : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }
            >
              <ClockIcon className="mr-1 size-3" />
              {isPublished
                ? "Schedule Published by Clan Admin"
                : "Pre-League Sign-Up Open (Schedule Not Published Yet)"}
            </Badge>

            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="gap-1 text-[11px]"
            >
              {isAdmin ? (
                <>
                  <CrownIcon className="size-3" />
                  <span>Clan Admin</span>
                </>
              ) : (
                <>
                  <UserIcon className="size-3" />
                  <span>Clan Member</span>
                </>
              )}
            </Badge>

            {onToggleRole && (
              <button
                type="button"
                onClick={onToggleRole}
                className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
              >
                Switch to {isAdmin ? "Member View" : "Clan Admin View"}
              </button>
            )}
          </div>

          <CardTitle className="text-lg font-bold">
            CWL Opt-In &amp; Weekly Availability — {activeAccount.player_name}{" "}
            <span className="font-mono text-xs font-normal text-muted-foreground">
              ({activeAccount.player_tag})
            </span>
          </CardTitle>

          <CardDescription className="text-xs">
            {isPublished && !isAdmin
              ? "The Clan Admin has published the official CWL schedule below. Your submitted availability preferences are shown for reference."
              : "Before the Clan Admin publishes the CWL schedule, choose whether you are opting in and mark any war days where you won't be able to attack. Default is Interested for all 7 days when opted in."}
          </CardDescription>
        </div>

        {/* Right: Opt-In / Opt-Out Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={isOptedIn ? "default" : "outline"}
            disabled={isPublished && !isAdmin}
            onClick={() => handleToggleOptIn(true)}
            className={`gap-1.5 ${
              isOptedIn ? "bg-emerald-600 text-white hover:bg-emerald-600/90" : ""
            }`}
          >
            <UserCheckIcon className="size-4" />
            Opted In to CWL
          </Button>

          <Button
            type="button"
            size="sm"
            variant={!isOptedIn ? "destructive" : "outline"}
            disabled={isPublished && !isAdmin}
            onClick={() => handleToggleOptIn(false)}
            className="gap-1.5"
          >
            <UserXIcon className="size-4" />
            Opt Out
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {!isOptedIn ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
            You are currently <strong>Opted Out</strong> of this Clan War
            League. Click <strong>&ldquo;Opted In to CWL&rdquo;</strong> above
            to participate (all 7 days will default to{" "}
            <strong>Interested</strong>).
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  Your 7-Day Availability Summary:
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2Icon className="mr-1 size-3" />
                  Interested: {interestedCount}d
                </Badge>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  <AlertTriangleIcon className="mr-1 size-3" />
                  Preferably Not: {preferablyNotCount}d
                </Badge>
                <Badge
                  variant="outline"
                  className="border-destructive/40 bg-destructive/10 text-destructive"
                >
                  <XCircleIcon className="mr-1 size-3" />
                  Absolutely Not: {absolutelyNotCount}d
                </Badge>
              </div>

              {(!isPublished || isAdmin) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleResetAllInterested}
                  className="gap-1 text-xs"
                >
                  <RotateCcwIcon className="size-3" />
                  Reset All 7 Days to Interested
                </Button>
              )}
            </div>

            {/* 7-Day Availability Selector Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              {CWL_DAYS.map((day) => {
                const currentStatus = playerWeek[day]
                return (
                  <div
                    key={day}
                    className={`flex flex-col justify-between rounded-xl border p-3 text-xs transition-colors ${
                      currentStatus === AVAILABILITY_STATUS.INTERESTED
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : currentStatus === AVAILABILITY_STATUS.PREFERABLY_NOT
                          ? "border-amber-500/50 bg-amber-500/5"
                          : "border-destructive/50 bg-destructive/5"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">
                          Day {day}
                        </span>
                        {currentStatus === AVAILABILITY_STATUS.INTERESTED && (
                          <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {currentStatus ===
                          AVAILABILITY_STATUS.PREFERABLY_NOT && (
                          <AlertTriangleIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                        )}
                        {currentStatus ===
                          AVAILABILITY_STATUS.ABSOLUTELY_NOT && (
                          <XCircleIcon className="size-3.5 text-destructive" />
                        )}
                      </div>
                      <div
                        className="mt-0.5 truncate text-[10px] text-muted-foreground"
                        title={opponentsByDay[day]}
                      >
                        vs {opponentsByDay[day] || `Opponent #${day}`}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-1">
                      {AVAILABILITY_OPTIONS.map((opt) => {
                        const isSelected = currentStatus === opt.value
                        let activeStyle =
                          "border-border/70 bg-background text-muted-foreground hover:bg-muted"
                        if (isSelected) {
                          if (opt.value === AVAILABILITY_STATUS.INTERESTED) {
                            activeStyle =
                              "border-emerald-600 bg-emerald-600 text-white font-semibold shadow-2xs"
                          } else if (
                            opt.value === AVAILABILITY_STATUS.PREFERABLY_NOT
                          ) {
                            activeStyle =
                              "border-amber-500 bg-amber-500 text-white font-semibold shadow-2xs"
                          } else {
                            activeStyle =
                              "border-destructive bg-destructive text-white font-semibold shadow-2xs"
                          }
                        }

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={isPublished && !isAdmin}
                            onClick={() => handleSetDayStatus(day, opt.value)}
                            className={`w-full rounded-md border px-2 py-1 text-left text-[11px] transition-all disabled:cursor-not-allowed ${activeStyle}`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20 py-2.5 text-xs">
        <span className="text-muted-foreground">
          {isSaving
            ? "Saving your CWL availability..."
            : savedNotice
              ? "Your CWL availability preferences have been saved!"
              : "Changes are saved automatically and visible to your Clan Admin."}
        </span>

        {(!isPublished || isAdmin) && (
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={isSaving}
            onClick={() => triggerSave(isOptedIn, playerWeek)}
            className="gap-1.5"
          >
            <SaveIcon className="size-3.5" />
            {savedNotice ? "Saved!" : "Save Availability"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

