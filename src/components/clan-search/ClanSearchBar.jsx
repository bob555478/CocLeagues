import { useState, useRef, useEffect } from "react"
import {
  SearchIcon,
  HashIcon,
  SlidersHorizontalIcon,
  XIcon,
  UsersIcon,
  TrophyIcon,
  ShieldIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isClanTagQuery } from "@/services/cocApi"

const QUICK_SUGGESTIONS = [
  { label: "#2PP", query: "#2PP", type: "tag" },
  { label: "Tribe Gaming", query: "Tribe Gaming", type: "name" },
  { label: "Israel Elite", query: "Israel Elite", type: "name" },
  { label: "#2Q89J0L2", query: "#2Q89J0L2", type: "tag" },
]

export function ClanSearchBar({
  query,
  onQueryChange,
  onSearchSubmit,
  suggestions = [],
  isLoading = false,
  showFilters = false,
  onToggleFilters,
  activeFilterCount = 0,
  onSelectClan,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)

  const isTag = isClanTagQuery(query)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIsDropdownOpen(true)
      setHighlightedIndex((prev) =>
        suggestions.length > 0 ? (prev + 1) % suggestions.length : -1
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        suggestions.length > 0
          ? (prev - 1 + suggestions.length) % suggestions.length
          : -1
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (
        isDropdownOpen &&
        highlightedIndex >= 0 &&
        suggestions[highlightedIndex]
      ) {
        const chosen = suggestions[highlightedIndex]
        setIsDropdownOpen(false)
        onSelectClan?.(chosen)
      } else {
        setIsDropdownOpen(false)
        onSearchSubmit?.()
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full space-y-3">
      {/* Main Clash of Stats-style Search Input Bar */}
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            {isTag ? (
              <HashIcon className="size-4 text-amber-500" />
            ) : (
              <SearchIcon className="size-4" />
            )}
          </div>

          <Input
            type="text"
            value={query}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              onQueryChange(e.target.value)
              setIsDropdownOpen(true)
              setHighlightedIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search Clan by Name (min. 3 chars) or Tag (e.g. #2PP, #8QU8J9LP)..."
            className="h-12 rounded-xl pr-28 pl-10 text-base shadow-xs"
            aria-label="Search Clash of Clans by name or tag"
          />

          <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
            {query.trim().length > 0 && (
              <Badge
                variant={isTag ? "default" : "secondary"}
                className="hidden sm:inline-flex"
              >
                {isTag ? "Tag Lookup" : "Name Search"}
              </Badge>
            )}

            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  onQueryChange("")
                  setHighlightedIndex(-1)
                }}
                aria-label="Clear search query"
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showFilters ? "secondary" : "outline"}
            size="lg"
            onClick={onToggleFilters}
            className="h-12 gap-2 rounded-xl px-4"
          >
            <SlidersHorizontalIcon className="size-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-0.5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={() => {
              setIsDropdownOpen(false)
              onSearchSubmit?.()
            }}
            disabled={isLoading}
            className="h-12 gap-2 rounded-xl px-5 font-semibold"
          >
            <SearchIcon className="size-4" />
            <span>{isLoading ? "Searching..." : "Search"}</span>
          </Button>
        </div>
      </div>

      {/* Quick Search Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium">
          <SparklesIcon className="size-3.5 text-amber-500" />
          Try searching:
        </span>
        {QUICK_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              onQueryChange(item.query)
              setIsDropdownOpen(false)
              onSearchSubmit?.(item.query)
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Clash of Stats-style Live Instant Autocomplete Dropdown */}
      {isDropdownOpen && query.trim().length >= 2 && suggestions.length > 0 && (
        <div className="absolute top-13 right-0 left-0 z-40 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
            <span>
              Instant Clan Matches ({suggestions.length}) —{" "}
              <code className="font-mono text-[11px]">
                {isTag ? "GET /v1/clans/{clanTag}" : "GET /v1/clans"}
              </code>
            </span>
            <span>Press Enter to view</span>
          </div>

          <ul className="max-h-80 divide-y divide-border/50 overflow-y-auto">
            {suggestions.slice(0, 6).map((clan, idx) => {
              const isHighlighted = idx === highlightedIndex
              return (
                <li key={clan.tag}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      onSelectClan?.(clan)
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors ${
                      isHighlighted ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {clan.badgeUrls?.small ? (
                        <img
                          src={clan.badgeUrls.small}
                          alt={clan.name}
                          className="size-9 shrink-0 object-contain"
                        />
                      ) : (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <ShieldIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {clan.name}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {clan.tag}
                          </span>
                          <Badge variant="outline" className="text-[11px]">
                            Lvl {clan.clanLevel}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {clan.warLeague?.name && (
                            <span>{clan.warLeague.name}</span>
                          )}
                          {clan.location?.name && (
                            <span>• {clan.location.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <div className="hidden items-center gap-1 text-muted-foreground sm:flex">
                        <TrophyIcon className="size-3.5 text-amber-500" />
                        <span className="font-medium text-foreground">
                          {clan.clanPoints?.toLocaleString() ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <UsersIcon className="size-3.5" />
                        <span>{clan.members}/50</span>
                      </div>
                      <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

