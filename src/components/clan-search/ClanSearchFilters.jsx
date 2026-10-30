import { RotateCcwIcon, FilterIcon } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  WAR_FREQUENCIES,
  COMMON_LOCATIONS,
  DEFAULT_FILTERS,
} from "@/services/cocApi"

export function ClanSearchFilters({ filters, onFiltersChange, onReset }) {
  function updateField(key, value) {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const warFrequencyLabel =
    WAR_FREQUENCIES.find((w) => w.value === filters.warFrequency)?.label ||
    "Any War Frequency"

  const locationLabel =
    COMMON_LOCATIONS.find((l) => l.value === String(filters.locationId))
      ?.label || "Any Location"

  return (
    <Card size="sm" className="border-dashed bg-muted/20">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FilterIcon className="size-4 text-primary" />
          <span>Clash of Clans API Search Filters</span>
          <Badge variant="outline" className="font-mono text-[11px]">
            GET /v1/clans
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Narrow down clans by war frequency, clan level, member count, minimum points, and location.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="gap-1"
          >
            <RotateCcwIcon className="size-3" />
            Reset
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* War Frequency (`warFrequency`) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            War Frequency (<code className="font-mono">warFrequency</code>)
          </Label>
          <Select
            value={filters.warFrequency}
            onValueChange={(val) => updateField("warFrequency", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{warFrequencyLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WAR_FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location (`locationId`) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Clan Location (<code className="font-mono">locationId</code>)
          </Label>
          <Select
            value={String(filters.locationId)}
            onValueChange={(val) => updateField("locationId", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{locationLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COMMON_LOCATIONS.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Clan Points (`minClanPoints`) */}
        <div className="space-y-1.5">
          <Label
            htmlFor="min-clan-points"
            className="text-xs text-muted-foreground"
          >
            Min Clan Points (<code className="font-mono">minClanPoints</code>)
          </Label>
          <Input
            id="min-clan-points"
            type="number"
            min={0}
            step={1000}
            placeholder="e.g. 30000"
            value={filters.minClanPoints}
            onChange={(e) => updateField("minClanPoints", e.target.value)}
          />
        </div>

        {/* Minimum Clan Level (`minClanLevel`) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Min Clan Level (<code className="font-mono">minClanLevel</code>)
            </Label>
            <Badge variant="secondary" className="font-mono text-xs">
              Level {filters.minClanLevel}+
            </Badge>
          </div>
          <Slider
            min={1}
            max={30}
            value={[Number(filters.minClanLevel) || 1]}
            onValueChange={(vals) => {
              const nextVal = Array.isArray(vals) ? vals[0] : vals
              updateField("minClanLevel", nextVal)
            }}
          />
        </div>

        {/* Members Range (`minMembers` & `maxMembers`) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Members (<code className="font-mono">minMembers</code> –{" "}
              <code className="font-mono">maxMembers</code>)
            </Label>
            <Badge variant="secondary" className="font-mono text-xs">
              {filters.minMembers} – {filters.maxMembers} / 50
            </Badge>
          </div>
          <Slider
            min={1}
            max={50}
            value={[
              Number(filters.minMembers) || DEFAULT_FILTERS.minMembers,
              Number(filters.maxMembers) || DEFAULT_FILTERS.maxMembers,
            ]}
            onValueChange={(vals) => {
              if (Array.isArray(vals) && vals.length === 2) {
                onFiltersChange({
                  ...filters,
                  minMembers: Math.min(vals[0], vals[1]),
                  maxMembers: Math.max(vals[0], vals[1]),
                })
              }
            }}
          />
        </div>

        {/* Results Limit (`limit`) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Max Results (<code className="font-mono">limit</code>)
          </Label>
          <Select
            value={String(filters.limit)}
            onValueChange={(val) => updateField("limit", Number(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{filters.limit} clans</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 clans</SelectItem>
              <SelectItem value="20">20 clans</SelectItem>
              <SelectItem value="50">50 clans</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

