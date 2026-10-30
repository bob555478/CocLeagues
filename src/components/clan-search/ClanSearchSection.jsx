import { useState, useEffect, useCallback } from "react"
import {
  ShieldAlertIcon,
  SearchXIcon,
  SwordsIcon,
  TerminalIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  searchClans,
  getClanDetails,
  DEFAULT_FILTERS,
  isClanTagQuery,
} from "@/services/cocApi"
import { ClanSearchBar } from "./ClanSearchBar"
import { ClanSearchFilters } from "./ClanSearchFilters"
import { ClanResultCard } from "./ClanResultCard"
import { ClanDetailsDialog } from "./ClanDetailsDialog"
import { ApiConfigPopover } from "./ApiConfigPopover"

export function ClanSearchSection({ onSelectClanForLeague }) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const [results, setResults] = useState([])
  const [endpointUsed, setEndpointUsed] = useState("GET /v1/clans")
  const [dataSource, setDataSource] = useState("demo")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [inspectedClan, setInspectedClan] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Count how many non-default filters are active
  const activeFilterCount = [
    filters.warFrequency !== "any",
    Number(filters.minClanLevel) > 1,
    Number(filters.minMembers) > 1 || Number(filters.maxMembers) < 50,
    Number(filters.minClanPoints) > 0,
    filters.locationId !== "any",
  ].filter(Boolean).length

  const executeSearch = useCallback(
    async (overrideQuery) => {
      const q = overrideQuery !== undefined ? overrideQuery : query
      const trimmed = q.trim()

      // Avoid firing invalid < 3 char queries while typing unless empty (demo overview) or tag or filters
      if (
        trimmed.length > 0 &&
        trimmed.length < 3 &&
        !isClanTagQuery(trimmed) &&
        activeFilterCount === 0
      ) {
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const res = await searchClans(trimmed, filters)
        setResults(res.items || [])
        setEndpointUsed(res.endpoint || "GET /v1/clans")
        setDataSource(res.source || "demo")
      } catch (err) {
        setError(err.message || "Failed to search clans.")
      } finally {
        setIsLoading(false)
      }
    },
    [query, filters, activeFilterCount]
  )

  // Debounced search when query or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch()
    }, 260)
    return () => clearTimeout(timer)
  }, [executeSearch])

  async function handleInspectClan(clan) {
    setInspectedClan(clan)
    setIsDetailsOpen(true)
    try {
      const fullDetails = await getClanDetails(clan.tag)
      setInspectedClan(fullDetails)
    } catch {
      // Keep summary clan object if detail lookup fails
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <SwordsIcon className="size-5" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              CoC Leagues — Clan Finder
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Search your Clash of Clans clan by name or tag (<code className="font-mono">#TAG</code>) and select it to organize your 7-day Clan War League (CWL) lineups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ApiConfigPopover onConfigChanged={() => executeSearch()} />
        </div>
      </div>

      {/* Search Bar & Instant Dropdown */}
      <ClanSearchBar
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={executeSearch}
        suggestions={results}
        isLoading={isLoading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        activeFilterCount={activeFilterCount}
        onSelectClan={(clan) => onSelectClanForLeague?.(clan)}
      />

      {/* Collapsible Advanced CoC API Filters */}
      {showFilters && (
        <ClanSearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      )}

      {/* Status Bar showing API endpoint & result count */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{results.length}</strong>{" "}
            {results.length === 1 ? "clan" : "clans"}
          </span>
          <Badge variant="outline" className="gap-1 font-mono text-[11px]">
            <TerminalIcon className="size-3" />
            {endpointUsed}
          </Badge>
        </div>

        <span>
          Source:{" "}
          <strong className="text-foreground">
            {dataSource === "live"
              ? "Official Clash of Clans API v1"
              : "Demo Dataset (CoC API v1 Schema)"}
          </strong>
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <Card size="sm" className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex items-center gap-3 text-xs text-destructive">
            <ShieldAlertIcon className="size-4 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeleton Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
              <div className="flex justify-between">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
            </Card>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.map((clan) => (
            <ClanResultCard
              key={clan.tag}
              clan={clan}
              onInspectClan={handleInspectClan}
              onSelectClanForLeague={onSelectClanForLeague}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="flex flex-col items-center gap-2">
            <SearchXIcon className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No matching clans found</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Try searching for a different clan name (at least 3 characters), an exact clan tag starting with <code className="font-mono">#</code>, or resetting your search filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Clan Profile & Roster Modal */}
      <ClanDetailsDialog
        clan={inspectedClan}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onSelectClanForLeague={onSelectClanForLeague}
      />
    </div>
  )
}
