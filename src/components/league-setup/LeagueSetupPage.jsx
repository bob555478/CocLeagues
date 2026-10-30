import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ShieldIcon,
  GlobeIcon,
  UsersIcon,
  TableIcon,
  CalendarIcon,
  CrownIcon,
  LockIcon,
  ClockIcon,
  SendIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { getClanDetails } from "@/services/cocApi"
import {
  fetchLeagueByClanTag,
  savePlayerAvailabilityToBackend,
  saveLeagueToNeonPostgres,
} from "@/lib/neonRealtime"
import { authClient } from "@/lib/neonAuth"
import {
  DEFAULT_OPPONENTS,
  createEmptySchedule,
  createDefaultPlayerAvailability,
  evaluateLeagueRules,
  generateFairLeagueSchedule,
  MIN_PLAYS_FOR_OPTED_IN,
  AVAILABILITY_STATUS,
  getPlayerDayAvailability,
} from "@/lib/leagueRules"
import { LeagueConfigToolbar } from "./LeagueConfigToolbar"
import { LeagueRulesChecklist } from "./LeagueRulesChecklist"
import { RosterMatrixTable } from "./RosterMatrixTable"
import { DayLineupPlanner } from "./DayLineupPlanner"
import { PlayerSummarySidebar } from "./PlayerSummarySidebar"
import { PersonalWeekScheduleCard } from "./PersonalWeekScheduleCard"
import { MemberAvailabilityCard } from "./MemberAvailabilityCard"
import { LiveLeagueSyncPanel } from "@/components/neon/LiveLeagueSyncPanel"

function getStorageKey(clanTag) {
  return `coc_cwl_setup_v2_${clanTag}`
}

export function LeagueSetupPage({
  clan: initialClan,
  activeAccount,
  isAdmin = false,
  onToggleRole,
}) {
  const { data: sessionData } = authClient.useSession()
  const user = sessionData?.user || null

  const [clan, setClan] = useState(initialClan)
  const [isLoadingRoster, setIsLoadingRoster] = useState(true)

  const [lineupSize, setLineupSize] = useState(15)
  const [optedInTags, setOptedInTags] = useState([])
  const [scheduleByDay, setScheduleByDay] = useState(() =>
    createEmptySchedule()
  )
  const [opponentsByDay, setOpponentsByDay] = useState(() => ({
    ...DEFAULT_OPPONENTS,
  }))
  const [availabilityByTag, setAvailabilityByTag] = useState({})
  const [isPublished, setIsPublished] = useState(false)

  const [selectedDay, setSelectedDay] = useState(1)
  const [activeTab, setActiveTab] = useState("matrix")

  // Ensure the active linked in-game player is always present in the clan's memberList
  const members = useMemo(() => {
    const rawList = Array.isArray(clan?.memberList) ? clan.memberList : []
    if (!activeAccount?.player_tag) return rawList

    const exists = rawList.some(
      (m) =>
        String(m.tag).toUpperCase() ===
        String(activeAccount.player_tag).toUpperCase()
    )
    if (exists) return rawList

    const activeMember = {
      tag: activeAccount.player_tag,
      name: activeAccount.player_name,
      role: activeAccount.role || "member",
      townHallLevel: activeAccount.town_hall_level || 16,
      trophies: activeAccount.trophies || 4800,
      clanRank: 1,
      warPreference: "in",
    }
    return [
      activeMember,
      ...rawList.map((m, idx) => ({
        ...m,
        clanRank: (m.clanRank || idx + 1) + 1,
      })),
    ]
  }, [clan, activeAccount])

  // Fetch full clan details, memberList, and saved schedule from backend / mock / localStorage
  useEffect(() => {
    if (!initialClan?.tag) return
    let cancelled = false

    async function loadClanAndSetup() {
      setIsLoadingRoster(true)
      let fullClan = initialClan
      try {
        fullClan = await getClanDetails(initialClan.tag)
      } catch {
        // Fallback to initialClan
      }

      if (cancelled) return
      setClan(fullClan)

      let rawMembers = Array.isArray(fullClan?.memberList)
        ? fullClan.memberList
        : []

      if (
        activeAccount?.player_tag &&
        !rawMembers.some(
          (m) =>
            String(m.tag).toUpperCase() ===
            String(activeAccount.player_tag).toUpperCase()
        )
      ) {
        rawMembers = [
          {
            tag: activeAccount.player_tag,
            name: activeAccount.player_name,
            role: activeAccount.role || "member",
            townHallLevel: activeAccount.town_hall_level || 16,
            trophies: activeAccount.trophies || 4800,
            clanRank: 1,
            warPreference: "in",
          },
          ...rawMembers,
        ]
      }

      // 1. Check localStorage first for immediate local edits, then backend/mock
      const savedRaw = localStorage.getItem(getStorageKey(fullClan.tag))
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw)
          if (
            parsed &&
            parsed.scheduleByDay &&
            Array.isArray(parsed.optedInTags)
          ) {
            if (!cancelled) {
              setLineupSize(parsed.lineupSize || 15)
              setOptedInTags(parsed.optedInTags)
              setScheduleByDay(parsed.scheduleByDay)
              if (parsed.opponentsByDay) {
                setOpponentsByDay(parsed.opponentsByDay)
              }
              if (parsed.availabilityByTag) {
                setAvailabilityByTag(parsed.availabilityByTag)
              }
              if (typeof parsed.isPublished === "boolean") {
                setIsPublished(parsed.isPublished)
              }
              setIsLoadingRoster(false)
            }
            return
          }
        } catch {
          // Ignore corrupt localStorage entry
        }
      }

      // 2. Try loading saved league setup from backend (http://0.0.0.0:8000/api/leagues/:clanTag) or mock fallback
      try {
        const data = await fetchLeagueByClanTag(fullClan.tag)
        const remote = data?.league
        if (
          remote &&
          remote.schedule_by_day &&
          Array.isArray(remote.opted_in_tags)
        ) {
          if (!cancelled) {
            setLineupSize(Number(remote.lineup_size) || 15)
            setOptedInTags(remote.opted_in_tags)
            setScheduleByDay(remote.schedule_by_day)
            if (remote.opponents_by_day) {
              setOpponentsByDay(remote.opponents_by_day)
            }
            if (
              remote.availability_by_tag &&
              typeof remote.availability_by_tag === "object"
            ) {
              setAvailabilityByTag(remote.availability_by_tag)
            }
            setIsPublished(Boolean(remote.is_published))
            setIsLoadingRoster(false)
          }
          return
        }
      } catch {
        // Fall through to default fair schedule
      }

      // 3. Default initialization: generate fair 7-day rotation in draft mode
      const defaultSize = 15
      const maxFor3Wars = Math.floor(
        (defaultSize * 7) / MIN_PLAYS_FOR_OPTED_IN
      )
      const defaultOptedIn = rawMembers
        .filter((m) => m.warPreference !== "out")
        .slice(0, maxFor3Wars)
        .map((m) => m.tag)

      let fallbackOptedIn =
        defaultOptedIn.length > 0
          ? defaultOptedIn
          : rawMembers
              .slice(0, Math.min(rawMembers.length, 25))
              .map((m) => m.tag)

      if (
        activeAccount?.player_tag &&
        !fallbackOptedIn.some(
          (t) =>
            String(t).toUpperCase() ===
            String(activeAccount.player_tag).toUpperCase()
        )
      ) {
        fallbackOptedIn = [
          activeAccount.player_tag,
          ...fallbackOptedIn.slice(0, maxFor3Wars - 1),
        ]
      }

      const defaultAvail = {}
      for (const tag of fallbackOptedIn) {
        defaultAvail[tag] = createDefaultPlayerAvailability()
      }

      const initialSchedule = generateFairLeagueSchedule({
        members: rawMembers,
        optedInTags: fallbackOptedIn,
        lineupSize: defaultSize,
        availabilityByTag: defaultAvail,
      })

      if (!cancelled) {
        setLineupSize(defaultSize)
        setOptedInTags(fallbackOptedIn)
        setAvailabilityByTag(defaultAvail)
        setScheduleByDay(initialSchedule)
        setIsPublished(false)
        setIsLoadingRoster(false)
      }
    }

    loadClanAndSetup()
    return () => {
      cancelled = true
    }
  }, [initialClan, activeAccount])

  // Save changes to localStorage when edited
  useEffect(() => {
    if (!clan?.tag || isLoadingRoster) return
    localStorage.setItem(
      getStorageKey(clan.tag),
      JSON.stringify({
        lineupSize,
        optedInTags,
        scheduleByDay,
        opponentsByDay,
        availabilityByTag,
        isPublished,
      })
    )
  }, [
    clan?.tag,
    isLoadingRoster,
    lineupSize,
    optedInTags,
    scheduleByDay,
    opponentsByDay,
    availabilityByTag,
    isPublished,
  ])

  const handleLoadRemoteLeague = useCallback((remote) => {
    if (remote.lineup_size) setLineupSize(Number(remote.lineup_size))
    if (Array.isArray(remote.opted_in_tags)) {
      setOptedInTags(remote.opted_in_tags)
    }
    if (
      remote.schedule_by_day &&
      typeof remote.schedule_by_day === "object"
    ) {
      setScheduleByDay(remote.schedule_by_day)
    }
    if (
      remote.opponents_by_day &&
      typeof remote.opponents_by_day === "object"
    ) {
      setOpponentsByDay(remote.opponents_by_day)
    }
    if (
      remote.availability_by_tag &&
      typeof remote.availability_by_tag === "object"
    ) {
      setAvailabilityByTag(remote.availability_by_tag)
    }
    if (typeof remote.is_published === "boolean") {
      setIsPublished(remote.is_published)
    }
  }, [])

  // Live evaluation of all CWL rules
  const evaluation = useMemo(
    () =>
      evaluateLeagueRules({
        members,
        optedInTags,
        scheduleByDay,
        lineupSize,
      }),
    [members, optedInTags, scheduleByDay, lineupSize]
  )

  async function handleSavePlayerAvailability({ playerTag, optedIn, days }) {
    if (!clan?.tag || !playerTag) return
    const normalizedUpper = String(playerTag).toUpperCase()
    const defaultDays = createDefaultPlayerAvailability()
    const resolvedDays = days ? { ...defaultDays, ...days } : defaultDays

    const nextOptedInTags = optedIn
      ? optedInTags.some((t) => String(t).toUpperCase() === normalizedUpper)
        ? optedInTags
        : [...optedInTags, playerTag]
      : optedInTags.filter((t) => String(t).toUpperCase() !== normalizedUpper)

    const nextAvailabilityByTag = {
      ...availabilityByTag,
      [playerTag]: resolvedDays,
    }

    setOptedInTags(nextOptedInTags)
    setAvailabilityByTag(nextAvailabilityByTag)

    if (!optedIn) {
      setScheduleByDay((sched) => {
        const updated = {}
        for (const [day, tags] of Object.entries(sched)) {
          updated[day] = tags.filter(
            (t) => String(t).toUpperCase() !== normalizedUpper
          )
        }
        return updated
      })
    }

    await savePlayerAvailabilityToBackend({
      clanTag: clan.tag,
      clanName: clan.name,
      playerTag,
      optedIn,
      days: resolvedDays,
    })
  }

  async function handleQuickPublishToggle(nextPublished) {
    if (!isAdmin || !clan?.tag) return
    setIsPublished(nextPublished)
    try {
      await saveLeagueToNeonPostgres({
        clanTag: clan.tag,
        clanName: clan.name,
        userId: user?.id || "admin",
        userEmail: user?.email || null,
        lineupSize,
        optedInTags,
        scheduleByDay,
        opponentsByDay,
        availabilityByTag,
        isPublished: nextPublished,
      })
    } catch {
      // Saved locally
    }
  }

  function handleLineupSizeChange(newSize) {
    if (!isAdmin) return
    setLineupSize(newSize)
    setScheduleByDay((prev) => {
      const next = {}
      for (const [day, tags] of Object.entries(prev)) {
        next[day] = tags.slice(0, newSize)
      }
      return next
    })
  }

  function handleToggleOptIn(playerTag) {
    if (!isAdmin) return
    setOptedInTags((prev) => {
      const exists = prev.includes(playerTag)
      if (exists) {
        setScheduleByDay((sched) => {
          const updated = {}
          for (const [day, tags] of Object.entries(sched)) {
            updated[day] = tags.filter((t) => t !== playerTag)
          }
          return updated
        })
        return prev.filter((t) => t !== playerTag)
      }
      // Default to "interested" for the whole week when opting in
      setAvailabilityByTag((avail) => ({
        ...avail,
        [playerTag]: avail[playerTag] || createDefaultPlayerAvailability(),
      }))
      return [...prev, playerTag]
    })
  }

  function handleOptInTopN(count) {
    if (!isAdmin) return
    const chosenTags = members.slice(0, count).map((m) => m.tag)
    const chosenSet = new Set(chosenTags)
    setOptedInTags(chosenTags)
    setAvailabilityByTag((prev) => {
      const next = { ...prev }
      for (const tag of chosenTags) {
        if (!next[tag]) {
          next[tag] = createDefaultPlayerAvailability()
        }
      }
      return next
    })
    setScheduleByDay((sched) => {
      const updated = {}
      for (const [day, tags] of Object.entries(sched)) {
        updated[day] = tags.filter((t) => chosenSet.has(t))
      }
      return updated
    })
  }

  function handleTogglePlayerDay(playerTag, day) {
    if (!isAdmin) return
    if (!optedInTags.includes(playerTag)) {
      setOptedInTags((prev) => [...prev, playerTag])
      setAvailabilityByTag((prev) => ({
        ...prev,
        [playerTag]: prev[playerTag] || createDefaultPlayerAvailability(),
      }))
    }

    setScheduleByDay((prev) => {
      const currentDayTags = prev[day] || []
      const isAssigned = currentDayTags.includes(playerTag)
      if (isAssigned) {
        return {
          ...prev,
          [day]: currentDayTags.filter((t) => t !== playerTag),
        }
      }
      if (currentDayTags.length >= lineupSize) {
        return prev
      }
      return {
        ...prev,
        [day]: [...currentDayTags, playerTag],
      }
    })
  }

  function handleAutoSchedule() {
    if (!isAdmin) return
    const generated = generateFairLeagueSchedule({
      members,
      optedInTags,
      lineupSize,
      availabilityByTag,
    })
    setScheduleByDay(generated)
  }

  function handleClearSchedule() {
    if (!isAdmin) return
    setScheduleByDay(createEmptySchedule())
  }

  function handleFillDayRemaining(day) {
    if (!isAdmin) return
    const currentDayTags = scheduleByDay[day] || []
    const remainingSlots = Math.max(0, lineupSize - currentDayTags.length)
    if (remainingSlots === 0) return

    const assignedSet = new Set(currentDayTags)
    const optedInSet = new Set(optedInTags)

    // Prioritize opted-in members who aren't marked "absolutely_not" on this day
    const candidates = members
      .filter(
        (m) =>
          optedInSet.has(m.tag) &&
          !assignedSet.has(m.tag) &&
          getPlayerDayAvailability(availabilityByTag, m.tag, day) !==
            AVAILABILITY_STATUS.ABSOLUTELY_NOT
      )
      .sort((a, b) => {
        const availA =
          getPlayerDayAvailability(availabilityByTag, a.tag, day) ===
          AVAILABILITY_STATUS.INTERESTED
            ? 1
            : 0
        const availB =
          getPlayerDayAvailability(availabilityByTag, b.tag, day) ===
          AVAILABILITY_STATUS.INTERESTED
            ? 1
            : 0
        if (availA !== availB) return availB - availA

        const playsA = evaluation.daysPlayedByTag[a.tag] || 0
        const playsB = evaluation.daysPlayedByTag[b.tag] || 0
        const needsA = playsA < MIN_PLAYS_FOR_OPTED_IN ? 1 : 0
        const needsB = playsB < MIN_PLAYS_FOR_OPTED_IN ? 1 : 0
        if (needsA !== needsB) return needsB - needsA
        if (playsA !== playsB) return playsA - playsB
        return (a.clanRank || 0) - (b.clanRank || 0)
      })

    const additions = candidates.slice(0, remainingSlots).map((m) => m.tag)
    setScheduleByDay((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), ...additions],
    }))
  }

  function handleClearDay(day) {
    if (!isAdmin) return
    setScheduleByDay((prev) => ({
      ...prev,
      [day]: [],
    }))
  }

  function handleOpponentChange(day, name) {
    if (!isAdmin) return
    setOpponentsByDay((prev) => ({
      ...prev,
      [day]: name,
    }))
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Clan Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3.5">
          {clan?.badgeUrls?.medium || clan?.badgeUrls?.small ? (
            <img
              src={clan.badgeUrls.medium || clan.badgeUrls.small}
              alt={clan.name}
              className="size-14 shrink-0 object-contain"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted">
              <ShieldIcon className="size-7 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {clan?.name} — CWL League Schedule
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                {clan?.tag}
              </Badge>
              {clan?.warLeague?.name && (
                <Badge variant="secondary">{clan.warLeague.name}</Badge>
              )}
              <Badge variant="outline" className="font-mono text-xs">
                {lineupSize}v{lineupSize} Format
              </Badge>
            </div>
            <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {clan?.location?.name && (
                <span className="inline-flex items-center gap-1">
                  <GlobeIcon className="size-3.5" />
                  {clan.location.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="size-3.5" />
                {members.length} Clan Members
              </span>
              <span>
                • 7-Day CWL Week (Min {MIN_PLAYS_FOR_OPTED_IN} Wars / Opted-In
                Player)
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {isAdmin ? (
            <>
              <Badge className="gap-1.5 bg-amber-600 px-3 py-1 text-xs text-white">
                <CrownIcon className="size-3.5" />
                Admin Mode — Schedule Editable
              </Badge>
              {!isPublished && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleQuickPublishToggle(true)}
                  className="gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-600/90"
                >
                  <SendIcon className="size-3.5" />
                  Submit Schedule to Clan
                </Button>
              )}
            </>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1.5 px-3 py-1 text-xs"
            >
              <LockIcon className="size-3.5 text-muted-foreground" />
              Member View — {isPublished ? "Published Schedule" : "Pre-League Availability"}
            </Badge>
          )}
        </div>
      </div>

      {isLoadingRoster ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Pre-Publish Member Opt-In & 7-Day Availability Card (Always shown before publish, or for admins) */}
          {(!isPublished || isAdmin) && (
            <MemberAvailabilityCard
              activeAccount={activeAccount}
              isAdmin={isAdmin}
              isPublished={isPublished}
              optedInTags={optedInTags}
              availabilityByTag={availabilityByTag}
              opponentsByDay={opponentsByDay}
              onSaveAvailability={handleSavePlayerAvailability}
              onToggleRole={onToggleRole}
            />
          )}

          {/* Once Published (or for Admins previewing), show the Personal Weekly Schedule Card */}
          {(isPublished || isAdmin) && (
            <PersonalWeekScheduleCard
              activeAccount={activeAccount}
              isAdmin={isAdmin}
              optedInTags={optedInTags}
              scheduleByDay={scheduleByDay}
              opponentsByDay={opponentsByDay}
              selectedDay={selectedDay}
              onSelectDay={(day) => {
                setSelectedDay(day)
                setActiveTab("day-planner")
              }}
              onToggleRole={onToggleRole}
            />
          )}

          {/* Backend / Mock Sync & Admin Publish Bar */}
          <LiveLeagueSyncPanel
            clan={clan}
            lineupSize={lineupSize}
            optedInTags={optedInTags}
            scheduleByDay={scheduleByDay}
            opponentsByDay={opponentsByDay}
            availabilityByTag={availabilityByTag}
            isPublished={isPublished}
            onLoadRemoteLeague={handleLoadRemoteLeague}
            onPublishStateChange={setIsPublished}
            canEdit={isAdmin}
          />

          {/* Normal Member View BEFORE Admin Publishes the Schedule */}
          {!isAdmin && !isPublished ? (
            <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <ClockIcon className="size-8 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-foreground">
                  Waiting for Clan Admin to Submit the CWL Schedule
                </h3>
                <p className="max-w-lg text-xs text-muted-foreground">
                  Your Clan Admin is currently organizing the 7-day CWL lineup
                  based on everyone&apos;s Opt-In and daily availability
                  preferences above. As soon as the admin submits the schedule,
                  your assigned war days and the full clan roster will appear
                  here!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Admin-Only League Setup Controls & Rules Checklist */}
              {isAdmin && (
                <>
                  <LeagueConfigToolbar
                    lineupSize={lineupSize}
                    onLineupSizeChange={handleLineupSizeChange}
                    totalMembersCount={members.length}
                    optedInCount={optedInTags.length}
                    onOptInTopN={handleOptInTopN}
                    onAutoSchedule={handleAutoSchedule}
                    onClearSchedule={handleClearSchedule}
                  />

                  <LeagueRulesChecklist
                    evaluation={evaluation}
                    lineupSize={lineupSize}
                    onSelectDay={(day) => {
                      setSelectedDay(day)
                      setActiveTab("day-planner")
                    }}
                  />
                </>
              )}

              {/* Main Workspace + Player Plays Summary Sidebar */}
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full space-y-4"
                  >
                    <TabsList>
                      <TabsTrigger value="matrix" className="gap-1.5">
                        <TableIcon className="size-3.5" />
                        7-Day League Schedule Matrix
                      </TabsTrigger>
                      <TabsTrigger value="day-planner" className="gap-1.5">
                        <CalendarIcon className="size-3.5" />
                        Day-by-Day Lineup (Day {selectedDay})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="matrix">
                      <RosterMatrixTable
                        members={members}
                        optedInTags={optedInTags}
                        scheduleByDay={scheduleByDay}
                        lineupSize={lineupSize}
                        opponentsByDay={opponentsByDay}
                        daysPlayedByTag={evaluation.daysPlayedByTag}
                        dayStatuses={evaluation.dayStatuses}
                        availabilityByTag={availabilityByTag}
                        onToggleOptIn={handleToggleOptIn}
                        onTogglePlayerDay={handleTogglePlayerDay}
                        canEdit={isAdmin}
                        currentPlayerTag={activeAccount?.player_tag}
                      />
                    </TabsContent>

                    <TabsContent value="day-planner">
                      <DayLineupPlanner
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                        members={members}
                        optedInTags={optedInTags}
                        scheduleByDay={scheduleByDay}
                        lineupSize={lineupSize}
                        opponentsByDay={opponentsByDay}
                        onOpponentChange={handleOpponentChange}
                        daysPlayedByTag={evaluation.daysPlayedByTag}
                        dayStatuses={evaluation.dayStatuses}
                        availabilityByTag={availabilityByTag}
                        onTogglePlayerDay={handleTogglePlayerDay}
                        onFillDayRemaining={handleFillDayRemaining}
                        onClearDay={handleClearDay}
                        canEdit={isAdmin}
                        currentPlayerTag={activeAccount?.player_tag}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Sidebar: Summary by player how many times they play */}
                <PlayerSummarySidebar
                  members={members}
                  optedInTags={optedInTags}
                  scheduleByDay={scheduleByDay}
                  daysPlayedByTag={evaluation.daysPlayedByTag}
                  lineupSize={lineupSize}
                  onTogglePlayerDay={handleTogglePlayerDay}
                  canEdit={isAdmin}
                  currentPlayerTag={activeAccount?.player_tag}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
