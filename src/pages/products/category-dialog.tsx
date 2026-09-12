import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProductCategory, ProductCategoryFormData } from "@/types/product.types"
import { Loader2Icon, LayersIcon, AlertCircleIcon } from "lucide-react"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: ProductCategory | null
  onSave: (data: ProductCategoryFormData) => Promise<void>
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: CategoryDialogProps) {
  const isEdit = Boolean(category)
  const [formData, setFormData] = useState<ProductCategoryFormData>({
    code: "",
    name: "",
    description: "",
    status: "active",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (category) {
      setFormData({
        code: category.code || "",
        name: category.name || "",
        description: category.description || "",
        status: category.status || "active",
      })
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        status: "active",
      })
    }
    setError(null)
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Nama kategori wajib diisi")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal menyimpan data kategori")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <LayersIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Kategori Produk" : "Tambah Kategori Baru"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Perbarui informasi kategori dan status klasifikasi untuk ${category?.name}.`
                  : "Buat kategori baru untuk mengelompokkan produk dalam katalog."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium my-2">
            <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-code" className="text-xs font-semibold">
                  Kode Kategori
                </Label>
                <Input
                  id="cat-code"
                  placeholder="Otomatis (misal CAT-001)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-status" className="text-xs font-semibold">
                  Status
                </Label>
                <select
                  id="cat-status"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                >
                  <option value="active" className="bg-popover text-popover-foreground">Aktif</option>
                  <option value="inactive" className="bg-popover text-popover-foreground">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs font-semibold">
                Nama Kategori <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="Contoh: Electronics & Hardware"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-xs font-semibold">
                Deskripsi
              </Label>
              <textarea
                id="cat-desc"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Deskripsi ringkas kelompok produk ini..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs font-medium"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs font-medium bg-primary text-primary-foreground"
            >
              {loading && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
