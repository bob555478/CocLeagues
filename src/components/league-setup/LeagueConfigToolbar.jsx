import {
  WandSparklesIcon,
  RotateCcwIcon,
  UsersIcon,
  UserCheckIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { WAR_SIZE_PRESETS } from "@/lib/leagueRules"

export function LeagueConfigToolbar({
  lineupSize,
  onLineupSizeChange,
  totalMembersCount,
  optedInCount,
  onOptInTopN,
  onAutoSchedule,
  onClearSchedule,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted/25 p-4 lg:flex-row lg:items-center">
      {/* Left: Daily War Size (15, 25, 30) */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Daily Players per War (Rule: 15, 25, or 30)
          </Label>
          <div className="flex items-center gap-1.5">
            {WAR_SIZE_PRESETS.map((size) => (
              <Button
                key={size}
                type="button"
                variant={lineupSize === size ? "default" : "outline"}
                size="sm"
                onClick={() => onLineupSizeChange(size)}
                className="font-mono"
              >
                {size}v{size}
              </Button>
            ))}
          </div>
        </div>

        {/* Opt-In Quick Presets */}
        <div className="space-y-1">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCheckIcon className="size-3.5" />
            <span>
              Opted-In Roster ({optedInCount} / {totalMembersCount})
            </span>
          </Label>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onOptInTopN(lineupSize)}
            >
              Top {lineupSize}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() =>
                onOptInTopN(Math.min(totalMembersCount, Math.floor((lineupSize * 7) / 3)))
              }
            >
              Max for 3+ Wars ({Math.min(totalMembersCount, Math.floor((lineupSize * 7) / 3))})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onOptInTopN(totalMembersCount)}
            >
              Opt-In All ({totalMembersCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Auto-Assign Fair Rotation & Clear */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearSchedule}
          className="gap-1.5"
        >
          <RotateCcwIcon className="size-3.5" />
          Clear All Days
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onAutoSchedule}
          className="gap-1.5 font-semibold"
        >
          <WandSparklesIcon className="size-3.5" />
          Auto-Assign 7-Day Rotation (3+ Wars)
        </Button>
      </div>
    </div>
  )
}

