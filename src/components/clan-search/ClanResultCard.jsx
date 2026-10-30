import { useState } from "react"
import {
  UsersIcon,
  TrophyIcon,
  SwordsIcon,
  FlameIcon,
  GlobeIcon,
  CopyIcon,
  CheckIcon,
  ShieldIcon,
  EyeIcon,
  ArrowRightIcon,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const CLAN_TYPE_LABELS = {
  open: "Anyone Can Join",
  inviteOnly: "Invite Only",
  closed: "Closed",
}

const WAR_FREQ_LABELS = {
  always: "Always",
  moreThanOncePerWeek: "Twice / Week",
  oncePerWeek: "Once / Week",
  lessThenOncePerWeek: "Rarely",
  never: "Never",
}

export function ClanResultCard({
  clan,
  onInspectClan,
  onSelectClanForLeague,
}) {
  const [copied, setCopied] = useState(false)

  function handleCopyTag(e) {
    e.stopPropagation()
    navigator.clipboard?.writeText(clan.tag)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="transition-all hover:ring-primary/40">
      <CardHeader className="gap-3">
        <div className="flex items-start gap-3.5">
          {/* Clan Shield Badge */}
          <div className="relative shrink-0">
            {clan.badgeUrls?.medium ? (
              <img
                src={clan.badgeUrls.medium}
                alt={`${clan.name} badge`}
                className="size-14 object-contain drop-shadow-xs"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
                <ShieldIcon className="size-7 text-muted-foreground" />
              </div>
            )}
            <Badge
              variant="default"
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0 text-[10px] font-bold shadow-xs"
            >
              Lv.{clan.clanLevel}
            </Badge>
          </div>

          {/* Clan Name, Tag, Location */}
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
              <span className="truncate">{clan.name}</span>
              <button
                type="button"
                onClick={handleCopyTag}
                title="Copy Clan Tag"
                className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-normal text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span>{clan.tag}</span>
                {copied ? (
                  <CheckIcon className="size-3 text-emerald-500" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
              </button>
            </CardTitle>

            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {clan.location?.name && (
                <span className="inline-flex items-center gap-1">
                  <GlobeIcon className="size-3.5" />
                  {clan.location.name}
                </span>
              )}
              <span>
                {CLAN_TYPE_LABELS[clan.type] || clan.type || "Invite Only"}
              </span>
              {clan.warLeague?.name && (
                <Badge variant="secondary" className="text-[11px]">
                  {clan.warLeague.name}
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <Badge variant="outline" className="gap-1 font-mono text-xs">
            <UsersIcon className="size-3" />
            {clan.members}/50
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Key Clash of Stats Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5 sm:grid-cols-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TrophyIcon className="size-3 text-amber-500" />
              <span>Clan Points</span>
            </div>
            <p className="font-mono text-sm font-semibold">
              {clan.clanPoints?.toLocaleString() ?? "—"}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <SwordsIcon className="size-3 text-rose-500" />
              <span>War Wins</span>
            </div>
            <p className="font-mono text-sm font-semibold">
              {clan.warWins?.toLocaleString() ?? "—"}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <FlameIcon className="size-3 text-orange-500" />
              <span>Win Streak</span>
            </div>
            <p className="font-mono text-sm font-semibold">
              {clan.warWinStreak ?? 0}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground">War Freq.</div>
            <p className="truncate text-xs font-medium">
              {WAR_FREQ_LABELS[clan.warFrequency] ||
                clan.warFrequency ||
                "Unknown"}
            </p>
          </div>
        </div>

        {/* Clan Labels */}
        {Array.isArray(clan.labels) && clan.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {clan.labels.map((label) => (
              <Badge
                key={label.id || label.name}
                variant="outline"
                className="text-[11px] font-normal"
              >
                {label.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onInspectClan?.(clan)}
          className="gap-1.5"
        >
          <EyeIcon className="size-3.5" />
          Clan Profile
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => onSelectClanForLeague?.(clan)}
          className="gap-1.5"
        >
          <span>Setup CWL League</span>
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}

