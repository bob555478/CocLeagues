import {
  TrophyIcon,
  SwordsIcon,
  UsersIcon,
  ShieldIcon,
  FlameIcon,
  GlobeIcon,
  ArrowRightIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function ClanDetailsDialog({
  clan,
  open,
  onOpenChange,
  onSelectClanForLeague,
}) {
  if (!clan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-start gap-3.5">
            {clan.badgeUrls?.medium ? (
              <img
                src={clan.badgeUrls.medium}
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
                <DialogTitle className="text-lg font-bold">
                  {clan.name}
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {clan.tag}
                </Badge>
                <Badge variant="default">Level {clan.clanLevel}</Badge>
              </div>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                {clan.location?.name && (
                  <span className="inline-flex items-center gap-1">
                    <GlobeIcon className="size-3.5" />
                    {clan.location.name}
                  </span>
                )}
                {clan.warLeague?.name && (
                  <span>• {clan.warLeague.name}</span>
                )}
                {clan.capitalLeague?.name && (
                  <span>• Capital: {clan.capitalLeague.name}</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {clan.description && (
          <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            {clan.description}
          </p>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              War & Clan Stats
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1">
              Top Roster ({clan.members}/50)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrophyIcon className="size-3.5 text-amber-500" />
                  Home Points
                </div>
                <div className="mt-1 font-mono text-base font-semibold">
                  {clan.clanPoints?.toLocaleString() ?? "—"}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrophyIcon className="size-3.5 text-sky-500" />
                  Builder Base Points
                </div>
                <div className="mt-1 font-mono text-base font-semibold">
                  {clan.clanBuilderBasePoints?.toLocaleString() ?? "—"}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldIcon className="size-3.5 text-purple-500" />
                  Capital Trophies
                </div>
                <div className="mt-1 font-mono text-base font-semibold">
                  {clan.clanCapitalPoints?.toLocaleString() ?? "—"}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <SwordsIcon className="size-3.5 text-emerald-500" />
                  War Record (W/L/T)
                </div>
                <div className="mt-1 font-mono text-sm font-semibold">
                  {clan.warWins ?? 0}W / {clan.warLosses ?? "—"}L /{" "}
                  {clan.warTies ?? "—"}T
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FlameIcon className="size-3.5 text-orange-500" />
                  War Win Streak
                </div>
                <div className="mt-1 font-mono text-base font-semibold">
                  {clan.warWinStreak ?? 0}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UsersIcon className="size-3.5 text-indigo-500" />
                  Req. Trophies
                </div>
                <div className="mt-1 font-mono text-base font-semibold">
                  {clan.requiredTrophies?.toLocaleString() ?? 0}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="pt-2">
            {Array.isArray(clan.memberList) && clan.memberList.length > 0 ? (
              <div className="max-h-56 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/60">
                {clan.memberList.map((member, index) => (
                  <div
                    key={member.tag}
                    className="flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 font-mono text-muted-foreground">
                        {index + 1}.
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{member.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {member.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground capitalize">
                          {member.role} • TH{member.townHallLevel ?? "?"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {member.trophies?.toLocaleString()} 🏆
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                Full member roster is returned when querying{" "}
                <code className="font-mono">GET /v1/clans/{"{clanTag}"}</code>{" "}
                with a live API key.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <DialogFooter showCloseButton>
          <Button
            type="button"
            variant="default"
            onClick={() => {
              onOpenChange?.(false)
              onSelectClanForLeague?.(clan)
            }}
            className="gap-1.5"
          >
            <span>Open CWL League Setup</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

