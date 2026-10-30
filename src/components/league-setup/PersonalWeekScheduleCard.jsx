import {
  SwordsIcon,
  CalendarCheckIcon,
  ShieldAlertIcon,
  CrownIcon,
  UserIcon,
  CheckCircle2Icon,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CWL_DAYS, MIN_PLAYS_FOR_OPTED_IN } from "@/lib/leagueRules"

export function PersonalWeekScheduleCard({
  activeAccount,
  isAdmin,
  optedInTags = [],
  scheduleByDay = {},
  opponentsByDay = {},
  selectedDay,
  onSelectDay,
  onToggleRole,
}) {
  if (!activeAccount) return null

  const playerTag = activeAccount.player_tag
  const isOptedIn = optedInTags.some(
    (t) => String(t).toUpperCase() === String(playerTag).toUpperCase()
  )

  const playingDays = CWL_DAYS.filter((day) => {
    const dayTags = scheduleByDay[day] || []
    return dayTags.some(
      (t) => String(t).toUpperCase() === String(playerTag).toUpperCase()
    )
  })

  const totalPlays = playingDays.length
  const meetsMinimum = totalPlays >= MIN_PLAYS_FOR_OPTED_IN

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
      <CardHeader className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="gap-1 text-[11px]"
            >
              {isAdmin ? (
                <>
                  <CrownIcon className="size-3" />
                  <span>Clan Admin (Can Edit Schedule)</span>
                </>
              ) : (
                <>
                  <UserIcon className="size-3" />
                  <span>Clan Member (View Schedule)</span>
                </>
              )}
            </Badge>

            {onToggleRole && (
              <button
                type="button"
                onClick={onToggleRole}
                className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                title="Switch role between Member and Clan Admin"
              >
                Switch to {isAdmin ? "Member (Read-Only)" : "Admin (Edit Mode)"}
              </button>
            )}
          </div>

          <CardTitle className="flex flex-wrap items-center gap-2 pt-1 text-lg font-bold">
            <CalendarCheckIcon className="size-5 text-primary" />
            <span>
              Your CWL Week Schedule — {activeAccount.player_name}
            </span>
            <span className="font-mono text-xs font-normal text-muted-foreground">
              ({activeAccount.player_tag})
            </span>
          </CardTitle>

          <CardDescription className="text-xs">
            {playingDays.length > 0 ? (
              <>
                You are scheduled to play on{" "}
                <strong className="text-foreground">
                  {playingDays.map((d) => `Day ${d}`).join(", ")}
                </strong>{" "}
                ({totalPlays} of 7 war days).
              </>
            ) : (
              <>
                You are not assigned to any war days this week yet.
              </>
            )}
          </CardDescription>
        </div>

        {/* Summary Counters for Current Player */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-border bg-background px-3 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your War Days
            </div>
            <div className="mt-0.5 flex items-center justify-end gap-1.5">
              <span className="font-mono text-base font-bold text-foreground">
                {totalPlays} / 7 Days
              </span>
              {isOptedIn ? (
                <Badge
                  variant={meetsMinimum ? "default" : "outline"}
                  className={
                    meetsMinimum
                      ? "bg-emerald-600 text-[10px] text-white"
                      : "border-amber-500/50 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
                  }
                >
                  {meetsMinimum ? (
                    <>
                      <CheckCircle2Icon className="mr-0.5 size-2.5" />
                      3+ Rule Met
                    </>
                  ) : (
                    <>
                      <ShieldAlertIcon className="mr-0.5 size-2.5" />
                      Needs {MIN_PLAYS_FOR_OPTED_IN - totalPlays} more
                    </>
                  )}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  Opted Out
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {CWL_DAYS.map((day) => {
            const isPlaying = playingDays.includes(day)
            const isSelected = selectedDay === day

            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay && onSelectDay(day)}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                  isPlaying
                    ? "border-emerald-500/60 bg-emerald-500/10 shadow-xs hover:bg-emerald-500/15"
                    : "border-border/70 bg-muted/25 opacity-75 hover:opacity-100"
                } ${isSelected ? "ring-2 ring-primary/40" : ""}`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-foreground">
                    Day {day}
                  </span>
                  {isPlaying ? (
                    <Badge className="h-4 gap-0.5 bg-emerald-600 px-1.5 text-[9px] text-white">
                      <SwordsIcon className="size-2.5" />
                      PLAYING
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 text-[9px] text-muted-foreground"
                    >
                      BENCH
                    </Badge>
                  )}
                </div>

                <div className="mt-2 truncate text-[11px] font-medium text-foreground/90">
                  vs {opponentsByDay[day] || `Opponent #${day}`}
                </div>

                <div className="mt-1.5 text-[10px] text-muted-foreground">
                  {isPlaying ? "In Starting Lineup" : "Resting / Sub"}
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

