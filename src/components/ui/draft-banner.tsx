import React from "react"
import { AlertCircle, RotateCcw, Trash2 } from "lucide-react"

interface DraftBannerProps {
  hasDraft: boolean
  savedAt: string | null
  onRestore: () => void
  onDiscard: () => void
}

export const DraftBanner: React.FC<DraftBannerProps> = ({
  hasDraft,
  savedAt,
  onRestore,
  onDiscard,
}) => {
  if (!hasDraft) return null

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Ditemukan draf formulir yang belum disimpan{savedAt ? ` (${savedAt})` : ""}.
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <button
          type="button"
          onClick={onRestore}
          className="inline-flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1 font-medium text-white transition hover:bg-amber-700 shadow-sm"
        >
          <RotateCcw className="h-3 w-3" />
          Pulihkan
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2 py-1 font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
        >
          <Trash2 className="h-3 w-3" />
          Buang
        </button>
      </div>
    </div>
  )
}
