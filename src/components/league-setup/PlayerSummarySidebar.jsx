import { useState, useMemo } from "react"
import {
  UsersIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SearchIcon,
  ArrowUpDownIcon,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CWL_DAYS, MIN_PLAYS_FOR_OPTED_IN } from "@/lib/leagueRules"

export function PlayerSummarySidebar({
  members = [],
  optedInTags = [],
  scheduleByDay,
  daysPlayedByTag = {},
  lineupSize = 15,
  onTogglePlayerDay,
  canEdit = false,
  currentPlayerTag = null,
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("optedIn") // "optedIn" | "under3" | "all"
  const [sortBy, setSortBy] = useState("playsAsc") // "playsAsc" | "playsDesc" | "rank"

  const optedInSet = useMemo(() => new Set(optedInTags), [optedInTags])
  const normalizedCurrentTag = currentPlayerTag
    ? String(currentPlayerTag).toUpperCase()
    : null

  const optedInMembers = useMemo(
    () => members.filter((m) => optedInSet.has(m.tag)),
    [members, optedInSet]
  )

  const compliantCount = useMemo(
    () =>
      optedInMembers.filter(
        (m) => (daysPlayedByTag[m.tag] || 0) >= MIN_PLAYS_FOR_OPTED_IN
      ).length,
    [optedInMembers, daysPlayedByTag]
  )

  const under3Count = optedInMembers.length - compliantCount

  const displayedMembers = useMemo(() => {
    const q = search.trim().toLowerCase()

    const filtered = members.filter((m) => {
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.tag.toLowerCase().includes(q)
      ) {
        return false
      }
      const isOptedIn = optedInSet.has(m.tag)
      const plays = daysPlayedByTag[m.tag] || 0

      if (filter === "optedIn") return isOptedIn
      if (filter === "under3") return isOptedIn && plays < MIN_PLAYS_FOR_OPTED_IN
      return true
    })

    return [...filtered].sort((a, b) => {
      // Pin active player to top
      const aIsMe =
        normalizedCurrentTag &&
        String(a.tag).toUpperCase() === normalizedCurrentTag
      const bIsMe =
        normalizedCurrentTag &&
        String(b.tag).toUpperCase() === normalizedCurrentTag
      if (aIsMe && !bIsMe) return -1
      if (!aIsMe && bIsMe) return 1

      const playsA = daysPlayedByTag[a.tag] || 0
      const playsB = daysPlayedByTag[b.tag] || 0

      if (sortBy === "playsAsc") {
        if (playsA !== playsB) return playsA - playsB
        return (a.clanRank || 0) - (b.clanRank || 0)
      }
      if (sortBy === "playsDesc") {
        if (playsB !== playsA) return playsB - playsA
        return (a.clanRank || 0) - (b.clanRank || 0)
      }
      return (a.clanRank || 0) - (b.clanRank || 0)
    })
  }, [
    members,
    search,
    filter,
    sortBy,
    optedInSet,
    daysPlayedByTag,
    normalizedCurrentTag,
  ])

  function cycleSort() {
    setSortBy((prev) =>
      prev === "playsAsc"
        ? "playsDesc"
        : prev === "playsDesc"
          ? "rank"
          : "playsAsc"
    )
  }

  const sortLabel =
    sortBy === "playsAsc"
      ? "Fewest Plays"
      : sortBy === "playsDesc"
        ? "Most Plays"
        : "Clan Rank"

  return (
    <aside className="w-full shrink-0 lg:w-80 xl:w-88">
      <Card className="sticky top-6 flex max-h-[calc(100svh-3rem)] flex-col overflow-hidden">
        <CardHeader className="space-y-3 border-b border-border/60 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <UsersIcon className="size-4 text-primary" />
                <span>Player Plays Summary</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Times each member plays across 7 days (min {MIN_PLAYS_FOR_OPTED_IN}).
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={cycleSort}
              className="gap-1 text-[11px]"
              title="Change sort order"
            >
              <ArrowUpDownIcon className="size-3" />
              {sortLabel}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs">
              <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2Icon className="size-3.5" />
                3+ Wars
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {compliantCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs">
              <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300">
                <AlertTriangleIcon className="size-3.5" />
                &lt; 3 Wars
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                {under3Count}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs">
            {[
              { id: "optedIn", label: `Opt-In (${optedInMembers.length})` },
              { id: "under3", label: `<3 (${under3Count})` },
              { id: "all", label: `All (${members.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-md py-1 text-[11px] font-medium transition-colors ${
                  filter === tab.id
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search player in summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 divide-y divide-border/50 overflow-y-auto p-0">
          {displayedMembers.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No players match the current filter.
            </div>
          ) : (
            displayedMembers.map((member) => {
              const isOptedIn = optedInSet.has(member.tag)
              const plays = daysPlayedByTag[member.tag] || 0
              const meetsMin = plays >= MIN_PLAYS_FOR_OPTED_IN
              const needed = Math.max(0, MIN_PLAYS_FOR_OPTED_IN - plays)
              const isMe =
                normalizedCurrentTag &&
                String(member.tag).toUpperCase() === normalizedCurrentTag

              return (
                <div
                  key={member.tag}
                  className={`space-y-2 px-3.5 py-2.5 text-xs transition-colors ${
                    isMe ? "bg-primary/10" : "hover:bg-muted/30"
                  } ${!isOptedIn && !isMe ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        #{member.clanRank}
                      </span>
                      <span className="truncate font-semibold">
                        {member.name}
                      </span>
                      {isMe && (
                        <Badge
                          variant="default"
                          className="px-1 py-0 text-[9px]"
                        >
                          YOU
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="px-1 py-0 font-mono text-[10px]"
                      >
                        TH{member.townHallLevel || 16}
                      </Badge>
                    </div>

                    {isOptedIn ? (
                      <Badge
                        variant={meetsMin ? "default" : "outline"}
                        className={`shrink-0 font-mono text-[11px] ${
                          meetsMin
                            ? "bg-emerald-600 text-white"
                            : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {plays} {plays === 1 ? "play" : "plays"}
                        {!meetsMin && ` (-${needed})`}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="shrink-0 font-mono text-[10px]"
                      >
                        Out ({plays}x)
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {CWL_DAYS.map((day) => {
                        const dayTags = scheduleByDay?.[day] || []
                        const isPlayingDay = dayTags.includes(member.tag)
                        const isDayFull = dayTags.length >= lineupSize

                        if (!canEdit) {
                          return (
                            <div
                              key={day}
                              className={`flex h-5 w-7 items-center justify-center rounded text-[10px] font-mono font-medium ${
                                isPlayingDay
                                  ? isMe
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "bg-primary text-primary-foreground shadow-2xs"
                                  : "border border-border/50 bg-muted/30 text-muted-foreground/45"
                              }`}
                              title={
                                isPlayingDay
                                  ? `${member.name} plays on Day ${day}`
                                  : `${member.name} rests on Day ${day}`
                              }
                            >
                              D{day}
                            </div>
                          )
                        }

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={!isPlayingDay && isDayFull}
                            onClick={() => onTogglePlayerDay?.(member.tag, day)}
                            title={
                              isPlayingDay
                                ? `Playing Day ${day} (click to remove)`
                                : isDayFull
                                  ? `Day ${day} is full (${lineupSize}/${lineupSize})`
                                  : `Click to assign ${member.name} to Day ${day}`
                            }
                            className={`flex h-5 w-7 items-center justify-center rounded text-[10px] font-mono font-medium transition-colors ${
                              isPlayingDay
                                ? "bg-primary text-primary-foreground shadow-2xs"
                                : isDayFull
                                  ? "cursor-not-allowed bg-muted/40 text-muted-foreground/35"
                                  : "border border-border/70 bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            }`}
                          >
                            D{day}
                          </button>
                        )
                      })}
                    </div>

                    <span className="font-mono text-[10px] text-muted-foreground">
                      {plays}/7d
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>

        <Separator />
        <div className="bg-muted/30 px-3.5 py-2 text-[11px] text-muted-foreground">
          {canEdit ? (
            <>
              Tip: Click any <code className="font-mono">D1–D7</code> pill to
              toggle that player&apos;s war day directly.
            </>
          ) : (
            <>
              Showing live CWL war plays across Days 1–7 for all clan members.
            </>
          )}
        </div>
      </Card>
    </aside>
  )
}
