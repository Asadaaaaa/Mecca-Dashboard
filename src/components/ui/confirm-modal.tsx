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
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      case "warning":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      case "success":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
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
      <DialogContent className="sm:max-w-[440px] p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              getIconBg()
            )}
          >
            {getIcon()}
          </div>
          <div className="flex-1 text-left space-y-1 pt-0.5">
            <DialogTitle className="text-base font-bold leading-snug text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>

        <DialogFooter className="mt-5">
          {!isAlert && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
              className="text-xs font-medium cursor-pointer"
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
              "text-xs font-medium cursor-pointer shadow-xs",
              variant === "destructive" && "bg-rose-600 hover:bg-rose-700 text-white"
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
