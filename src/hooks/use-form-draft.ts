import { useState, useEffect, useCallback, useRef } from "react"
import { draftService } from "@/services/draft.service"

export function useFormDraft<T>(formKey: string, currentData: T, isOpen: boolean) {
  const [hasDraft, setHasDraft] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const draftDataRef = useRef<T | null>(null)
  const isInitialLoadRef = useRef(true)
  const skipNextSaveRef = useRef(true)
  const lastSavedJsonRef = useRef<string>("")

  // Fetch existing draft from DB when modal opens
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    isInitialLoadRef.current = true
    skipNextSaveRef.current = true
    try {
      lastSavedJsonRef.current = JSON.stringify(currentData)
    } catch {
      lastSavedJsonRef.current = ""
    }

    draftService
      .getDraft<T>(formKey)
      .then((res) => {
        if (cancelled) return
        if (res && res.data) {
          draftDataRef.current = res.data
          setHasDraft(true)
          setSavedAt(
            new Date(res.saved_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          )
        } else {
          draftDataRef.current = null
          setHasDraft(false)
          setSavedAt(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        draftDataRef.current = null
        setHasDraft(false)
        setSavedAt(null)
      })
      .finally(() => {
        if (!cancelled) {
          isInitialLoadRef.current = false
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formKey])

  // Auto-save draft to DB on data changes while modal is open
  useEffect(() => {
    if (!isOpen) return
    if (isInitialLoadRef.current) return

    let serialized = ""
    try {
      serialized = JSON.stringify(currentData)
    } catch {
      return
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      lastSavedJsonRef.current = serialized
      return
    }

    if (serialized === lastSavedJsonRef.current) return

    const timer = setTimeout(() => {
      draftService
        .saveDraft(formKey, currentData)
        .then(() => {
          lastSavedJsonRef.current = serialized
          draftDataRef.current = currentData
        })
        .catch((err) => {
          console.error("Failed to save form draft:", err)
        })
    }, 800)

    return () => clearTimeout(timer)
  }, [currentData, isOpen, formKey])

  const getDraft = useCallback((): T | null => {
    return draftDataRef.current
  }, [])

  const clearDraft = useCallback(() => {
    draftDataRef.current = null
    setHasDraft(false)
    setSavedAt(null)
    try {
      lastSavedJsonRef.current = JSON.stringify(currentData)
    } catch {
      lastSavedJsonRef.current = ""
    }
    draftService.deleteDraft(formKey).catch((err) => {
      console.error("Failed to clear form draft:", err)
    })
  }, [formKey, currentData])

  return {
    hasDraft,
    savedAt,
    getDraft,
    clearDraft,
  }
}
