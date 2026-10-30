import {
  SwordsIcon,
  UserPlusIcon,
  UserMinusIcon,
  WandSparklesIcon,
  Trash2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  LockIcon,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CWL_DAYS,
  MIN_PLAYS_FOR_OPTED_IN,
  AVAILABILITY_STATUS,
  getPlayerDayAvailability,
} from "@/lib/leagueRules"

export function DayLineupPlanner({
  selectedDay,
  onSelectDay,
  members = [],
  optedInTags = [],
  scheduleByDay,
  lineupSize,
  opponentsByDay,
  onOpponentChange,
  daysPlayedByTag,
  dayStatuses,
  availabilityByTag = {},
  onTogglePlayerDay,
  onFillDayRemaining,
  onClearDay,
  canEdit = false,
  currentPlayerTag = null,
}) {
  const optedInSet = new Set(optedInTags)
  const assignedTags = scheduleByDay[selectedDay] || []
  const assignedSet = new Set(assignedTags)
  const normalizedCurrentTag = currentPlayerTag
    ? String(currentPlayerTag).toUpperCase()
    : null

  const assignedMembers = members.filter((m) => assignedSet.has(m.tag))
  const availableOptedInMembers = members
    .filter((m) => optedInSet.has(m.tag) && !assignedSet.has(m.tag))
    .sort((a, b) => {
      const playsA = daysPlayedByTag[a.tag] || 0
      const playsB = daysPlayedByTag[b.tag] || 0
      const needsA = playsA < MIN_PLAYS_FOR_OPTED_IN ? 1 : 0
      const needsB = playsB < MIN_PLAYS_FOR_OPTED_IN ? 1 : 0
      if (needsA !== needsB) return needsB - needsA
      if (playsA !== playsB) return playsA - playsB
      return (a.clanRank || 0) - (b.clanRank || 0)
    })

  const currentDayStatus = dayStatuses.find((d) => d.day === selectedDay)
  const isDayFull = assignedTags.length >= lineupSize

  return (
    <div className="space-y-4">
      {/* Day 1..7 Selector Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {CWL_DAYS.map((day) => {
          const st = dayStatuses.find((d) => d.day === day)
          const isActive = day === selectedDay
          const dayTags = scheduleByDay[day] || []
          const iPlayThisDay =
            normalizedCurrentTag &&
            dayTags.some((t) => String(t).toUpperCase() === normalizedCurrentTag)

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold">Day {day}</span>
                {iPlayThisDay ? (
                  <Badge className="h-4 bg-emerald-600 px-1 text-[9px] text-white">
                    YOU PLAY
                  </Badge>
                ) : st?.isComplete ? (
                  <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                ) : (
                  <AlertTriangleIcon className="size-3.5 text-amber-500" />
                )}
              </div>
              <div className="mt-1 w-full truncate text-[11px] text-muted-foreground">
                vs {opponentsByDay[day]}
              </div>
              <Badge
                variant={st?.isComplete ? "default" : "outline"}
                className="mt-2 font-mono text-[10px]"
              >
                {st?.count || 0} / {lineupSize} Players
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Selected Day Header & Opponent Config */}
      <Card size="sm">
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <SwordsIcon className="size-4 text-primary" />
                <span>CWL Day {selectedDay} Battle Lineup</span>
                <Badge
                  variant={currentDayStatus?.isComplete ? "default" : "secondary"}
                  className="font-mono"
                >
                  {assignedMembers.length} / {lineupSize}
                </Badge>
                {!canEdit && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <LockIcon className="size-2.5" />
                    View Only
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {currentDayStatus?.remaining > 0
                  ? `${currentDayStatus.remaining} open slot(s) remaining on Day ${selectedDay}.`
                  : `Day ${selectedDay} war roster is complete (${lineupSize}v${lineupSize}).`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 sm:ml-4">
              <Label
                htmlFor="opponent-name"
                className="shrink-0 text-xs text-muted-foreground"
              >
                Opponent Clan:
              </Label>
              {canEdit ? (
                <Input
                  id="opponent-name"
                  type="text"
                  value={opponentsByDay[selectedDay] || ""}
                  onChange={(e) => onOpponentChange(selectedDay, e.target.value)}
                  placeholder={`Opponent Clan #${selectedDay}`}
                  className="h-8 w-48 text-xs"
                />
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {opponentsByDay[selectedDay] || `Opponent Clan #${selectedDay}`}
                </Badge>
              )}
            </div>
          </div>

          {canEdit && (
            <CardAction className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => onClearDay(selectedDay)}
                disabled={assignedMembers.length === 0}
                className="gap-1"
              >
                <Trash2Icon className="size-3" />
                Clear Day {selectedDay}
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={() => onFillDayRemaining(selectedDay)}
                disabled={isDayFull || availableOptedInMembers.length === 0}
                className="gap-1"
              >
                <WandSparklesIcon className="size-3" />
                Fill Remaining ({currentDayStatus?.remaining || 0})
              </Button>
            </CardAction>
          )}
        </CardHeader>
      </Card>

      {/* Two-Column Split: Assigned Lineup vs Available Opted-In Bench */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Column: Assigned Players on Selected Day */}
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-sm">
              Starting Lineup — Day {selectedDay} ({assignedMembers.length}/
              {lineupSize})
            </CardTitle>
            <CardDescription className="text-xs">
              {canEdit
                ? `Click Remove to move a player back to the bench for Day ${selectedDay}.`
                : `Players scheduled to battle on Day ${selectedDay}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 divide-y divide-border/50 overflow-y-auto p-0">
            {assignedMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No players assigned to Day {selectedDay} yet.
              </div>
            ) : (
              assignedMembers.map((member, i) => {
                const plays = daysPlayedByTag[member.tag] || 0
                const isMe =
                  normalizedCurrentTag &&
                  String(member.tag).toUpperCase() === normalizedCurrentTag

                return (
                  <div
                    key={member.tag}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${
                      isMe ? "bg-primary/10" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 font-mono text-muted-foreground">
                        {i + 1}.
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span>{member.name}</span>
                          {isMe && (
                            <Badge
                              variant="default"
                              className="px-1.5 py-0 text-[9px]"
                            >
                              YOU
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 font-mono text-[10px]"
                          >
                            TH{member.townHallLevel || 16}
                          </Badge>
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {member.tag} • Total Wars: {plays}/
                          {MIN_PLAYS_FOR_OPTED_IN}+
                        </div>
                      </div>
                    </div>

                    {canEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          onTogglePlayerDay(member.tag, selectedDay)
                        }
                        className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <UserMinusIcon className="size-3.5" />
                        Remove
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                      >
                        Starting
                      </Badge>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Available Opted-In Players */}
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-sm">
              Resting / Bench Pool ({availableOptedInMembers.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Opted-in clan members resting on Day {selectedDay}.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 divide-y divide-border/50 overflow-y-auto p-0">
            {availableOptedInMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                All opted-in players are already assigned to Day {selectedDay}.
              </div>
            ) : (
              availableOptedInMembers.map((member) => {
                const plays = daysPlayedByTag[member.tag] || 0
                const needsWars = plays < MIN_PLAYS_FOR_OPTED_IN
                const isMe =
                  normalizedCurrentTag &&
                  String(member.tag).toUpperCase() === normalizedCurrentTag
                const dayAvail = getPlayerDayAvailability(
                  availabilityByTag,
                  member.tag,
                  selectedDay
                )

                return (
                  <div
                    key={member.tag}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${
                      isMe ? "bg-primary/10" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 font-semibold">
                          <span>{member.name}</span>
                          {isMe && (
                            <Badge
                              variant="default"
                              className="px-1.5 py-0 text-[9px]"
                            >
                              YOU
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 font-mono text-[10px]"
                          >
                            TH{member.townHallLevel || 16}
                          </Badge>
                          {dayAvail === AVAILABILITY_STATUS.ABSOLUTELY_NOT ? (
                            <Badge
                              variant="destructive"
                              className="px-1.5 py-0 text-[9px]"
                            >
                              Absolutely Not
                            </Badge>
                          ) : dayAvail ===
                            AVAILABILITY_STATUS.PREFERABLY_NOT ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/50 bg-amber-500/10 px-1.5 py-0 text-[9px] text-amber-700 dark:text-amber-300"
                            >
                              Preferably Not
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-700 dark:text-emerald-300"
                            >
                              Interested
                            </Badge>
                          )}
                          {needsWars && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/50 bg-amber-500/10 px-1.5 py-0 font-mono text-[10px] text-amber-700 dark:text-amber-300"
                            >
                              Needs {MIN_PLAYS_FOR_OPTED_IN - plays} more (
                              {plays}/{MIN_PLAYS_FOR_OPTED_IN})
                            </Badge>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {member.tag} • {member.trophies?.toLocaleString()} 🏆 •
                          Played {plays}d
                        </div>
                      </div>
                    </div>

                    {canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={isDayFull}
                        onClick={() =>
                          onTogglePlayerDay(member.tag, selectedDay)
                        }
                        className="gap-1"
                      >
                        <UserPlusIcon className="size-3.5" />
                        Assign Day {selectedDay}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Bench
                      </Badge>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
