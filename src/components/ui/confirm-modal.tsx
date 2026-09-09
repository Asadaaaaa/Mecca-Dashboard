import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  AlertTriangleIcon,
  InfoIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react"
import { cn } from "cn"

export type ConfirmModalVariant = "default" | "destructive" | "warning" | "success"

export interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string | React.ReactNode
  type?: "confirm" | "alert"
  variant?: ConfirmModalVariant
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  type = "confirm",
  variant = "default",
  confirmText,
  cancelText = "Batal",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const isAlert = type === "alert"

  const defaultConfirmText = isAlert
    ? "Mengerti"
    : variant === "destructive"
    ? "Hapus"
    : "Konfirmasi"

  const finalConfirmText = confirmText || defaultConfirmText

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangleIcon className="size-5 text-rose-600 dark:text-rose-400" />
      case "warning":
        return <AlertTriangleIcon className="size-5 text-amber-600 dark:text-amber-400" />
      case "success":
        return <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
      default:
        return <InfoIcon className="size-5 text-blue-600 dark:text-blue-400" />
    }
  }

  const getIconBg = () => {
    switch (variant) {
      case "destructive":
        return "bg-rose-100 dark:bg-rose-950/50"
      case "warning":
        return "bg-amber-100 dark:bg-amber-950/50"
      case "success":
        return "bg-emerald-100 dark:bg-emerald-950/50"
      default:
        return "bg-blue-100 dark:bg-blue-950/50"
    }
  }

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              getIconBg()
            )}
          >
            {getIcon()}
          </div>
          <div className="flex-1 text-left space-y-1">
            <DialogTitle className="text-base font-semibold leading-6 text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
          {!isAlert && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
              className="cursor-pointer hover:bg-muted/80 active:scale-98 transition-all"
            >
              {cancelText}
            </Button>
          )}

          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "cursor-pointer active:scale-98 transition-all",
              variant === "destructive" && "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            )}
          >
            {loading && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}
            {finalConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
