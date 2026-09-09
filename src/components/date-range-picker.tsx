import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronDownIcon, CheckIcon } from "lucide-react"
import { cn } from "cn"

export interface DateRange {
  startDate: string
  endDate: string
  preset: string
  label: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ]
  const monthIdx = parseInt(month, 10) - 1
  return `${day} ${months[monthIdx] || month} ${year}`
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customStart, setCustomStart] = useState(value.startDate)
  const [customEnd, setCustomEnd] = useState(value.endDate)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const presets = [
    {
      id: "today",
      label: "Hari Ini",
      getRange: () => {
        const d = new Date().toISOString().split("T")[0]
        return { start: d, end: d, label: "Hari Ini" }
      },
    },
    {
      id: "last7days",
      label: "7 Hari Terakhir",
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 6)
        return {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
          label: "7 Hari Terakhir",
        }
      },
    },
    {
      id: "last30days",
      label: "30 Hari Terakhir",
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 29)
        return {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
          label: "30 Hari Terakhir",
        }
      },
    },
    {
      id: "thisMonth",
      label: "Bulan Ini",
      getRange: () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, "0")
        const start = `${year}-${month}-01`
        const end = now.toISOString().split("T")[0]
        return { start, end, label: "Bulan Ini" }
      },
    },
  ]

  const handleSelectPreset = (p: (typeof presets)[0]) => {
    const { start, end, label } = p.getRange()
    setCustomStart(start)
    setCustomEnd(end)
    onChange({
      startDate: start,
      endDate: end,
      preset: p.id,
      label,
    })
    setIsOpen(false)
  }

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return
    const start = customStart <= customEnd ? customStart : customEnd
    const end = customStart <= customEnd ? customEnd : customStart
    onChange({
      startDate: start,
      endDate: end,
      preset: "custom",
      label: `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`,
    })
    setIsOpen(false)
  }

  return (
    <div className={cn("relative inline-block", className)} ref={popoverRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-xs font-medium shadow-xs hover:bg-muted/60"
        >
          <CalendarIcon className="size-4 text-primary" />
          <span>
            {formatDateDisplay(value.startDate)} — {formatDateDisplay(value.endDate)}
          </span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {value.label}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 dark:ring-white/10">
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <span className="text-xs font-semibold tracking-tight">
              Pilih Rentang Waktu
            </span>
            <span className="text-[10px] text-muted-foreground">
              {value.label}
            </span>
          </div>

          {/* Presets List */}
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {presets.map((p) => {
              const isSelected = value.preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted text-foreground"
                  )}
                >
                  <span>{p.label}</span>
                  {isSelected && <CheckIcon className="size-3.5" />}
                </button>
              )
            })}
          </div>

          <div className="border-t pt-3">
            <span className="mb-2 block text-[11px] font-medium text-muted-foreground">
              Rentang Tanggal Kustom:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Dari:
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Sampai:
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="xs"
                onClick={handleApplyCustom}
                className="text-xs"
              >
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
