import { useState } from "react"
import {
  CheckIcon,
  AlertCircleIcon,
  SearchIcon,
  SwordsIcon,
  UserCheckIcon,
  UserXIcon,
  LockIcon,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CWL_DAYS,
  MIN_PLAYS_FOR_OPTED_IN,
  AVAILABILITY_STATUS,
  getPlayerDayAvailability,
} from "@/lib/leagueRules"

export function RosterMatrixTable({
  members = [],
  optedInTags = [],
  scheduleByDay,
  lineupSize,
  opponentsByDay,
  daysPlayedByTag,
  dayStatuses,
  availabilityByTag = {},
  onToggleOptIn,
  onTogglePlayerDay,
  canEdit = false,
  currentPlayerTag = null,
}) {
  const [searchText, setSearchText] = useState("")
  const [filterMode, setFilterMode] = useState("all") // "all" | "optedIn" | "under3"

  const optedInSet = new Set(optedInTags)
  const normalizedCurrentTag = currentPlayerTag
    ? String(currentPlayerTag).toUpperCase()
    : null

  const filteredMembers = members
    .filter((m) => {
      const q = searchText.trim().toLowerCase()
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.tag.toLowerCase().includes(q)
      ) {
        return false
      }
      const isOptedIn = optedInSet.has(m.tag)
      const plays = daysPlayedByTag[m.tag] || 0

      if (filterMode === "optedIn") return isOptedIn
      if (filterMode === "under3")
        return isOptedIn && plays < MIN_PLAYS_FOR_OPTED_IN
      return true
    })
    .sort((a, b) => {
      // Pin the logged-in user's active in-game player to the top
      const aIsMe =
        normalizedCurrentTag &&
        String(a.tag).toUpperCase() === normalizedCurrentTag
      const bIsMe =
        normalizedCurrentTag &&
        String(b.tag).toUpperCase() === normalizedCurrentTag
      if (aIsMe && !bIsMe) return -1
      if (!aIsMe && bIsMe) return 1
      return (a.clanRank || 0) - (b.clanRank || 0)
    })

  return (
    <Card>
      <CardHeader className="flex flex-col justify-between gap-3 border-b border-border/60 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              7-Day CWL League Schedule Matrix
            </CardTitle>
            {!canEdit && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <LockIcon className="size-2.5" />
                View Only
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            {canEdit
              ? `Click any Day 1–7 cell to assign or remove a player. Every opted-in player needs at least ${MIN_PLAYS_FOR_OPTED_IN} war days.`
              : `Full 7-day clan war league lineup across Days 1–7. Your active in-game player is highlighted at the top.`}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter player..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            {[
              { id: "all", label: `All (${members.length})` },
              { id: "optedIn", label: `Opted-In (${optedInTags.length})` },
              { id: "under3", label: `Needs <3 Wars` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filterMode === tab.id
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="sticky left-0 z-10 bg-muted/90 px-3 py-2.5 font-semibold backdrop-blur-xs">
                  Clan Member
                </th>
                <th className="px-2.5 py-2.5 text-center font-semibold">
                  Opt-In
                </th>
                {CWL_DAYS.map((day) => {
                  const status = dayStatuses.find((d) => d.day === day)
                  return (
                    <th
                      key={day}
                      className="min-w-20 px-2 py-2 text-center font-semibold"
                    >
                      <div>Day {day}</div>
                      <div
                        className="truncate text-[10px] font-normal text-muted-foreground"
                        title={opponentsByDay[day]}
                      >
                        vs{" "}
                        {opponentsByDay[day]?.replace(
                          /^Opponent Clan /,
                          "Clan "
                        )}
                      </div>
                      <div className="mt-1">
                        <Badge
                          variant={
                            status?.isComplete
                              ? "default"
                              : status?.isOverfilled
                                ? "destructive"
                                : "outline"
                          }
                          className="font-mono text-[10px]"
                        >
                          {status?.count || 0}/{lineupSize}
                        </Badge>
                      </div>
                    </th>
                  )
                })}
                <th className="px-3 py-2.5 text-center font-semibold">
                  Wars Played (Min {MIN_PLAYS_FOR_OPTED_IN})
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50">
              {filteredMembers.map((member, idx) => {
                const isOptedIn = optedInSet.has(member.tag)
                const plays = daysPlayedByTag[member.tag] || 0
                const meetsRule = !isOptedIn || plays >= MIN_PLAYS_FOR_OPTED_IN
                const isMe =
                  normalizedCurrentTag &&
                  String(member.tag).toUpperCase() === normalizedCurrentTag

                return (
                  <tr
                    key={member.tag}
                    className={`transition-colors ${
                      isMe
                        ? "bg-primary/10 hover:bg-primary/15"
                        : "hover:bg-muted/30"
                    } ${!isOptedIn && !isMe ? "opacity-60" : ""}`}
                  >
                    {/* Player Identity */}
                    <td
                      className={`sticky left-0 z-10 px-3 py-2 font-medium ${
                        isMe ? "bg-primary/10" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 font-mono text-[11px] text-muted-foreground">
                          {member.clanRank || idx + 1}.
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold">
                              {member.name}
                            </span>
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
                            {member.tag} •{" "}
                            {member.trophies?.toLocaleString()} 🏆
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Opt-In Toggle / Badge */}
                    <td className="px-2.5 py-2 text-center">
                      {canEdit ? (
                        <Button
                          type="button"
                          variant={isOptedIn ? "secondary" : "ghost"}
                          size="xs"
                          onClick={() => onToggleOptIn(member.tag)}
                          className={`gap-1 ${
                            isOptedIn
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isOptedIn ? (
                            <>
                              <UserCheckIcon className="size-3" />
                              <span>In</span>
                            </>
                          ) : (
                            <>
                              <UserXIcon className="size-3" />
                              <span>Out</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge
                          variant={isOptedIn ? "secondary" : "outline"}
                          className={
                            isOptedIn
                              ? "border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                              : "text-[10px] text-muted-foreground"
                          }
                        >
                          {isOptedIn ? "In" : "Out"}
                        </Badge>
                      )}
                    </td>

                    {/* Day 1..7 Assignment Cells */}
                    {CWL_DAYS.map((day) => {
                      const dayTags = scheduleByDay[day] || []
                      const isAssigned = dayTags.includes(member.tag)
                      const isDayFull = dayTags.length >= lineupSize
                      const dayAvail = getPlayerDayAvailability(
                        availabilityByTag,
                        member.tag,
                        day
                      )

                      const availLabel =
                        dayAvail === AVAILABILITY_STATUS.ABSOLUTELY_NOT
                          ? "Absolutely Not"
                          : dayAvail === AVAILABILITY_STATUS.PREFERABLY_NOT
                            ? "Preferably Not"
                            : "Interested"

                      if (!canEdit) {
                        return (
                          <td key={day} className="px-1.5 py-1.5 text-center">
                            <div
                              className={`inline-flex h-8 w-14 items-center justify-center rounded-lg border text-xs font-medium ${
                                isAssigned
                                  ? isMe
                                    ? "border-emerald-500 bg-emerald-600 text-white shadow-xs"
                                    : "border-primary bg-primary text-primary-foreground shadow-xs"
                                  : "border-border/50 bg-muted/20 text-muted-foreground/40"
                              }`}
                              title={
                                isAssigned
                                  ? `${member.name} is playing on Day ${day} (${availLabel})`
                                  : `${member.name} is resting on Day ${day} (${availLabel})`
                              }
                            >
                              {isAssigned ? (
                                <SwordsIcon className="size-3.5" />
                              ) : (
                                <span>—</span>
                              )}
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={day} className="px-1.5 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => onTogglePlayerDay(member.tag, day)}
                            disabled={!isAssigned && isDayFull}
                            title={`${
                              isAssigned
                                ? `Remove ${member.name} from Day ${day}`
                                : isDayFull
                                  ? `Day ${day} is full (${lineupSize}/${lineupSize})`
                                  : `Assign ${member.name} to Day ${day}`
                            } • Availability: ${availLabel}`}
                            className={`inline-flex h-9 w-16 flex-col items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                              isAssigned
                                ? dayAvail ===
                                  AVAILABILITY_STATUS.ABSOLUTELY_NOT
                                  ? "border-destructive bg-destructive text-white shadow-xs"
                                  : dayAvail ===
                                      AVAILABILITY_STATUS.PREFERABLY_NOT
                                    ? "border-amber-500 bg-amber-600 text-white shadow-xs"
                                    : "border-primary bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                                : isDayFull
                                  ? "cursor-not-allowed border-border/40 bg-muted/20 text-muted-foreground/40"
                                  : dayAvail ===
                                      AVAILABILITY_STATUS.ABSOLUTELY_NOT
                                    ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                    : dayAvail ===
                                        AVAILABILITY_STATUS.PREFERABLY_NOT
                                      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                                      : "border-border/70 bg-background text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {isAssigned ? (
                              <SwordsIcon className="size-3.5" />
                            ) : dayAvail ===
                              AVAILABILITY_STATUS.ABSOLUTELY_NOT ? (
                              <span className="text-[9px] font-semibold">
                                No
                              </span>
                            ) : dayAvail ===
                              AVAILABILITY_STATUS.PREFERABLY_NOT ? (
                              <span className="text-[9px] font-semibold">
                                Pref No
                              </span>
                            ) : (
                              <span>—</span>
                            )}
                          </button>
                        </td>
                      )
                    })}

                    {/* Total Wars Played & Rule Compliance */}
                    <td className="px-3 py-2 text-center">
                      {isOptedIn ? (
                        <Badge
                          variant={meetsRule ? "default" : "outline"}
                          className={`gap-1 font-mono ${
                            meetsRule
                              ? "bg-emerald-600 text-white"
                              : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {meetsRule ? (
                            <CheckIcon className="size-3" />
                          ) : (
                            <AlertCircleIcon className="size-3" />
                          )}
                          <span>
                            {plays} / {MIN_PLAYS_FOR_OPTED_IN}+
                          </span>
                        </Badge>
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {plays > 0 ? `${plays} wars` : "Opted Out"}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
