import { useState, useEffect, useCallback, useRef } from "react"

interface DraftStorage<T> {
  data: T
  savedAt: string
}

export function useFormDraft<T>(formKey: string, currentData: T, isOpen: boolean) {
  const storageKey = `mecca_draft_${formKey}`
  const [hasDraft, setHasDraft] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const isInitialMount = useRef(true)

  // Check for existing draft on open
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored) as DraftStorage<T>
          if (parsed && parsed.data) {
            setHasDraft(true)
            setSavedAt(new Date(parsed.savedAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            }))
          }
        } else {
          setHasDraft(false)
          setSavedAt(null)
        }
      } catch {
        setHasDraft(false)
      }
      isInitialMount.current = true
    }
  }, [isOpen, storageKey])

  // Auto-save draft on data changes while modal is open
  useEffect(() => {
    if (!isOpen) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const timer = setTimeout(() => {
      try {
        const payload: DraftStorage<T> = {
          data: currentData,
          savedAt: new Date().toISOString()
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))
      } catch (err) {
        console.error("Failed to save form draft:", err)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [currentData, isOpen, storageKey])

  const getDraft = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null
      const parsed = JSON.parse(stored) as DraftStorage<T>
      return parsed.data || null
    } catch {
      return null
    }
  }, [storageKey])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setHasDraft(false)
      setSavedAt(null)
    } catch (err) {
      console.error("Failed to clear form draft:", err)
    }
  }, [storageKey])

  return {
    hasDraft,
    savedAt,
    getDraft,
    clearDraft,
  }
}
