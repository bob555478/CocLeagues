import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  CalendarDaysIcon,
  UsersIcon,
  RepeatIcon,
  ShieldCheckIcon,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MIN_PLAYS_FOR_OPTED_IN, CWL_DAYS } from "@/lib/leagueRules"

export function LeagueRulesChecklist({ evaluation, lineupSize, onSelectDay }) {
  const {
    dayStatuses,
    completedDaysCount,
    overfilledDaysCount,
    optedInMembers,
    compliantOptedIn,
    underplayedOptedIn,
    totalSlotCapacity,
    minSlotsRequired,
    maxOptedInFor3Plays,
    hasEnoughTotalCapacity,
    isAllDaysValid,
    isAllOptedInMin3,
    isFullyCompliant,
    daysPlayedByTag,
  } = evaluation

  return (
    <Card className="bg-card">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheckIcon className="size-4 text-primary" />
          <span>CWL League Rules & Schedule Compliance</span>
        </CardTitle>
        <CardDescription className="text-xs">
          7-day league schedule battling 6 opponent clans • {lineupSize} players per day • Every opted-in member must play at least {MIN_PLAYS_FOR_OPTED_IN} times.
        </CardDescription>
        <CardAction>
          {isFullyCompliant ? (
            <Badge variant="default" className="gap-1 bg-emerald-600 text-white">
              <CheckCircle2Icon className="size-3" />
              All Rules Met
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangleIcon className="size-3 text-amber-500" />
              Setup In Progress
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* 3 Core Rules Cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Rule 1: 7 Days Duration */}
          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CalendarDaysIcon className="size-4 text-primary" />
                <span>Rule 1: 7-Day League Lineups</span>
              </div>
              {isAllDaysValid ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangleIcon className="size-4 shrink-0 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              7 war days battling opponent clans. Each day needs exactly{" "}
              <strong className="text-foreground">{lineupSize}</strong> players.
            </p>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">Completed Days:</span>
              <Badge variant={isAllDaysValid ? "default" : "outline"} className="font-mono">
                {completedDaysCount} / {CWL_DAYS.length} Days
              </Badge>
            </div>
          </div>

          {/* Rule 2: Daily Player Count (15 / 25 / 30) */}
          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <UsersIcon className="size-4 text-primary" />
                <span>Rule 2: Daily Roster Size ({lineupSize}v{lineupSize})</span>
              </div>
              {overfilledDaysCount === 0 && hasEnoughTotalCapacity ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangleIcon className="size-4 shrink-0 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total 7-day slot capacity is{" "}
              <strong className="text-foreground">{totalSlotCapacity}</strong>{" "}
              war slots (supports up to{" "}
              <strong className="text-foreground">{maxOptedInFor3Plays}</strong>{" "}
              opted-in players at 3+ wars each).
            </p>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">Slots Needed (3× Opt-In):</span>
              <Badge
                variant={hasEnoughTotalCapacity ? "secondary" : "destructive"}
                className="font-mono"
              >
                {minSlotsRequired} / {totalSlotCapacity} Slots
              </Badge>
            </div>
          </div>

          {/* Rule 3: Every Opted-In Member Plays >= 3 Times */}
          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <RepeatIcon className="size-4 text-primary" />
                <span>Rule 3: Min {MIN_PLAYS_FOR_OPTED_IN} Wars / Opted-In</span>
              </div>
              {isAllOptedInMin3 ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangleIcon className="size-4 shrink-0 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Every clan member who opted in must be assigned to at least{" "}
              <strong className="text-foreground">{MIN_PLAYS_FOR_OPTED_IN} war days</strong>.
            </p>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">Opted-In with 3+ Wars:</span>
              <Badge
                variant={isAllOptedInMin3 ? "default" : "outline"}
                className="font-mono"
              >
                {compliantOptedIn.length} / {optedInMembers.length} Players
              </Badge>
            </div>
          </div>
        </div>

        {/* Capacity Warning Banner if too many players opted in for the chosen war size */}
        {!hasEnoughTotalCapacity && (
          <div className="flex items-center gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <span>
              <strong>Capacity Warning:</strong> You have{" "}
              <strong>{optedInMembers.length}</strong> opted-in members, which requires{" "}
              <strong>{minSlotsRequired}</strong> total war slots (3 wars each), but a{" "}
              <strong>{lineupSize}v{lineupSize}</strong> league over 7 days only has{" "}
              <strong>{totalSlotCapacity}</strong> slots. Increase the daily war size (e.g. to 25 or 30) or opt out{" "}
              <strong>{optedInMembers.length - maxOptedInFor3Plays}</strong> players.
            </span>
          </div>
        )}

        {/* Quick 7-Day Slot Pills & Underplayed Players Summary */}
        <div className="flex flex-col justify-between gap-3 border-t border-border/50 pt-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              Daily Slots:
            </span>
            {dayStatuses.map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => onSelectDay?.(d.day)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  d.isComplete
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : d.isOverfilled
                      ? "border-destructive/50 bg-destructive/10 text-destructive"
                      : "border-border bg-muted/40 text-foreground hover:bg-muted"
                }`}
              >
                <span>Day {d.day}:</span>
                <span className="font-mono font-semibold">
                  {d.count}/{d.lineupSize}
                </span>
              </button>
            ))}
          </div>

          {underplayedOptedIn.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Needs more days ({underplayedOptedIn.length}):
              </span>
              {underplayedOptedIn.slice(0, 5).map((m) => (
                <Badge key={m.tag} variant="outline" className="font-mono text-[11px]">
                  {m.name} ({daysPlayedByTag[m.tag] || 0}/{MIN_PLAYS_FOR_OPTED_IN})
                </Badge>
              ))}
              {underplayedOptedIn.length > 5 && (
                <span className="text-muted-foreground">
                  +{underplayedOptedIn.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

