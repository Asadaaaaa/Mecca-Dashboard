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
import { productService } from "@/services/product.service"
import type {
  Product,
  ProductFormData,
  ProductCategory,
  Unit,
  Tax,
} from "@/types/product.types"
import { Loader2Icon, PackageIcon, AlertCircleIcon } from "lucide-react"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSave: (data: ProductFormData) => Promise<void>
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: ProductDialogProps) {
  const isEdit = Boolean(product)
  const [formData, setFormData] = useState<ProductFormData>({
    code: "",
    name: "",
    category_id: null,
    unit_id: 1, // Default PCS
    selling_price: 0,
    tax_id: null,
    description: "",
    status: "active",
  })

  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadDependencies()
    }
  }, [open])

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || "",
        name: product.name || "",
        category_id: product.category_id || null,
        unit_id: product.unit_id || 1,
        selling_price: product.selling_price ? Number(product.selling_price) : 0,
        tax_id: product.tax_id || null,
        description: product.description || "",
        status: product.status || "active",
      })
    } else {
      setFormData({
        code: "",
        name: "",
        category_id: categories.length > 0 ? categories[0].id : null,
        unit_id: units.length > 0 ? units[0].id : 1,
        selling_price: 0,
        tax_id: taxes.length > 0 ? taxes[0].id : null,
        description: "",
        status: "active",
      })
    }
    setError(null)
  }, [product, open, categories, units, taxes])

  const loadDependencies = async () => {
    try {
      const [catsRes, unitsRes, taxesRes] = await Promise.all([
        productService.getCategories({ limit: 100 }),
        productService.getUnits(),
        productService.getTaxes(),
      ])
      setCategories(catsRes.items || [])
      setUnits(unitsRes || [])
      setTaxes(taxesRes || [])
    } catch (err) {
      console.error("Failed to load product dependencies:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Nama produk wajib diisi")
      return
    }

    if (!formData.unit_id) {
      setError("Satuan produk (PCS / BOX) wajib dipilih")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onSave({
        ...formData,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        unit_id: Number(formData.unit_id),
        selling_price: Number(formData.selling_price) || 0,
        tax_id: formData.tax_id ? Number(formData.tax_id) : null,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal menyimpan data produk")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[88vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PackageIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Data Produk" : "Tambah Produk Baru"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Perbarui informasi katalog, harga jual, dan satuan untuk ${product?.name}.`
                  : "Daftarkan item barang baru ke dalam katalog produk sistem."}
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prd-code" className="text-xs font-semibold">
                  Kode / SKU Produk
                </Label>
                <Input
                  id="prd-code"
                  placeholder="Otomatis (misal PRD-001)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prd-status" className="text-xs font-semibold">
                  Status
                </Label>
                <select
                  id="prd-status"
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
              <Label htmlFor="prd-name" className="text-xs font-semibold">
                Nama Produk / Barang <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prd-name"
                placeholder="Contoh: Barcode Scanner Wireless 2D"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prd-category" className="text-xs font-semibold">
                  Kategori
                </Label>
                <select
                  id="prd-category"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.category_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="" className="bg-popover text-popover-foreground">Tanpa Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prd-unit" className="text-xs font-semibold">
                  Satuan Produk <span className="text-destructive">*</span>
                </Label>
                <select
                  id="prd-unit"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm font-semibold text-primary shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.unit_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_id: Number(e.target.value),
                    })
                  }
                  required
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id} className="bg-popover text-popover-foreground">
                      {u.code} ({u.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prd-price" className="text-xs font-semibold">
                  Harga Jual (IDR) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="prd-price"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.selling_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      selling_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 text-sm font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prd-tax" className="text-xs font-semibold">
                  Pajak (Tax)
                </Label>
                <select
                  id="prd-tax"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.tax_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tax_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="" className="bg-popover text-popover-foreground">Tanpa Pajak</option>
                  {taxes.map((t) => (
                    <option key={t.id} value={t.id} className="bg-popover text-popover-foreground">
                      {t.name} ({t.rate}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prd-desc" className="text-xs font-semibold">
                Deskripsi / Spesifikasi Produk
              </Label>
              <textarea
                id="prd-desc"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Keterangan spesifikasi teknis, fungsi, atau catatan produk..."
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
              {isEdit ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
