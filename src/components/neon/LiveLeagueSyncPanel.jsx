import { useState, useEffect, useCallback, useRef } from "react"
import { useLiveQuery } from "@neon/realtime-react"
import {
  CloudUploadIcon,
  RadioIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ServerOffIcon,
  SendIcon,
  LockOpenIcon,
} from "lucide-react"
import {
  fetchSealedLeagueQuery,
  saveLeagueToNeonPostgres,
} from "@/lib/neonRealtime"
import { authClient } from "@/lib/neonAuth"
import { BACKEND_BASE_URL } from "@/services/backendClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function LiveLeagueSubscription({
  sealedQuery,
  clan,
  lineupSize,
  optedInTags,
  scheduleByDay,
  opponentsByDay,
  availabilityByTag,
  isPublished,
  onLoadRemoteLeague,
  onPublishStateChange,
  canEdit = false,
}) {
  const { data: sessionData } = authClient.useSession()
  const user = sessionData?.user || null

  const refreshQuery = useCallback(
    () => fetchSealedLeagueQuery(clan.tag),
    [clan.tag]
  )

  const { data, status, error, utils } = useLiveQuery(sealedQuery, {
    refreshQuery,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [lastTxId, setLastTxId] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const remoteRow = Array.isArray(data) && data.length > 0 ? data[0] : null
  const lastAppliedUpdatedAtRef = useRef(null)

  useEffect(() => {
    if (!remoteRow || !onLoadRemoteLeague) return
    const key = `${remoteRow.id}:${remoteRow.updated_at}`
    if (lastAppliedUpdatedAtRef.current !== key) {
      lastAppliedUpdatedAtRef.current = key
      onLoadRemoteLeague(remoteRow)
    }
  }, [remoteRow, onLoadRemoteLeague])

  async function handleSaveOrPublish(targetPublishState) {
    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await saveLeagueToNeonPostgres({
        clanTag: clan.tag,
        clanName: clan.name,
        userId: user?.id || "anonymous",
        userEmail: user?.email || null,
        lineupSize,
        optedInTags,
        scheduleByDay,
        opponentsByDay,
        availabilityByTag,
        isPublished: targetPublishState,
      })

      onPublishStateChange?.(targetPublishState)
      if (result?.league) {
        onLoadRemoteLeague?.(result.league)
      }

      if (result.kind === "committed" && result.txid) {
        setLastTxId(result.txid)
        await utils.awaitTxId(result.txid, 10_000).catch(() => {})
      }
    } catch (err) {
      setSaveError(err.message || "Failed to save schedule")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs shadow-2xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge
          variant={status === "live" ? "default" : "outline"}
          className={`gap-1.5 font-mono ${
            status === "live" ? "bg-emerald-600 text-white" : ""
          }`}
        >
          <RadioIcon className="size-3" />
          <span>
            Backend ({BACKEND_BASE_URL}) • Realtime: {status}
          </span>
        </Badge>

        <Badge
          variant={isPublished ? "default" : "outline"}
          className={
            isPublished
              ? "bg-emerald-600 text-white"
              : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }
        >
          {isPublished
            ? "Schedule Published to Clan"
            : "Draft Mode (Hidden from Normal Members)"}
        </Badge>

        {status === "error" && error && (
          <span className="inline-flex items-center gap-1 text-destructive">
            <AlertCircleIcon className="size-3.5" />
            {error.message}
          </span>
        )}

        {lastTxId && (
          <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
            <CheckCircle2Icon className="size-3 text-emerald-500" />
            txid #{lastTxId}
          </Badge>
        )}

        {saveError && <span className="text-destructive">{saveError}</span>}
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          {isPublished ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublish(false)}
                className="gap-1.5"
              >
                <LockOpenIcon className="size-3.5" />
                Unpublish (Re-open Availability)
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublish(true)}
                className="gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-600/90"
              >
                <CloudUploadIcon className="size-3.5" />
                {isSaving ? "Updating..." : "Update Published Schedule"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublish(false)}
                className="gap-1.5"
              >
                <CloudUploadIcon className="size-3.5" />
                Save Draft
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublish(true)}
                className="gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-600/90"
              >
                <SendIcon className="size-3.5" />
                {isSaving
                  ? "Submitting..."
                  : "Submit & Publish Schedule to Clan"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MockLeagueSyncBar({
  clan,
  lineupSize,
  optedInTags,
  scheduleByDay,
  opponentsByDay,
  availabilityByTag,
  isPublished,
  onLoadRemoteLeague,
  onPublishStateChange,
  canEdit = false,
}) {
  const { data: sessionData } = authClient.useSession()
  const user = sessionData?.user || null

  const [isSaving, setIsSaving] = useState(false)
  const [lastTxId, setLastTxId] = useState(null)

  async function handleSaveOrPublishMock(targetPublishState) {
    setIsSaving(true)
    try {
      const result = await saveLeagueToNeonPostgres({
        clanTag: clan.tag,
        clanName: clan.name,
        userId: user?.id || "mock-admin",
        userEmail: user?.email || null,
        lineupSize,
        optedInTags,
        scheduleByDay,
        opponentsByDay,
        availabilityByTag,
        isPublished: targetPublishState,
      })
      onPublishStateChange?.(targetPublishState)
      if (result?.league) {
        onLoadRemoteLeague?.(result.league)
      }
      if (result?.txid) {
        setLastTxId(result.txid)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs shadow-2xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-500/50 bg-amber-500/10 font-mono text-amber-700 dark:text-amber-300"
        >
          <ServerOffIcon className="size-3" />
          <span>Backend {BACKEND_BASE_URL} Offline • Using Mock Store</span>
        </Badge>

        <Badge
          variant={isPublished ? "default" : "outline"}
          className={
            isPublished
              ? "bg-emerald-600 text-white"
              : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }
        >
          {isPublished
            ? "Schedule Published to Clan"
            : "Draft Mode (Hidden from Normal Members)"}
        </Badge>

        {lastTxId && (
          <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
            <CheckCircle2Icon className="size-3 text-emerald-500" />
            Saved ({lastTxId})
          </Badge>
        )}
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          {isPublished ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublishMock(false)}
                className="gap-1.5"
              >
                <LockOpenIcon className="size-3.5" />
                Unpublish (Re-open Availability)
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublishMock(true)}
                className="gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-600/90"
              >
                <CloudUploadIcon className="size-3.5" />
                {isSaving ? "Updating..." : "Update Published Schedule"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublishMock(false)}
                className="gap-1.5"
              >
                <CloudUploadIcon className="size-3.5" />
                Save Draft
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                disabled={isSaving}
                onClick={() => handleSaveOrPublishMock(true)}
                className="gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-600/90"
              >
                <SendIcon className="size-3.5" />
                {isSaving
                  ? "Submitting..."
                  : "Submit & Publish Schedule to Clan"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function LiveLeagueSyncPanel(props) {
  const { clan } = props
  const [sealedState, setSealedState] = useState(null)

  useEffect(() => {
    if (!clan?.tag) return
    let cancelled = false

    fetchSealedLeagueQuery(clan.tag).then(
      (sealedQuery) => {
        if (!cancelled) {
          setSealedState({ tag: clan.tag, sealedQuery })
        }
      },
      (error) => {
        if (!cancelled) {
          setSealedState({ tag: clan.tag, error })
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [clan?.tag])

  if (!clan?.tag) return null

  const current = sealedState?.tag === clan.tag ? sealedState : null

  if (current?.sealedQuery?.mockMode) {
    return (
      <MockLeagueSyncBar
        initialMockLeague={current.sealedQuery.league}
        {...props}
      />
    )
  }

  if (current?.sealedQuery) {
    return (
      <LiveLeagueSubscription
        sealedQuery={current.sealedQuery}
        {...props}
      />
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
      <span>
        {current?.error
          ? `Backend sync error: ${current.error.message}`
          : `Connecting to ${BACKEND_BASE_URL} for ${clan.tag}...`}
      </span>
    </div>
  )
}
