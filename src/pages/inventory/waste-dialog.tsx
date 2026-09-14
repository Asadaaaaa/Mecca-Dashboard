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
import { inventoryService } from "@/services/inventory.service"
import { productService } from "@/services/product.service"
import { warehouseService } from "@/services/warehouse.service"
import type { Warehouse } from "@/types/warehouse.types"
import type { Product } from "@/types/product.types"
import type { WasteFormData } from "@/types/inventory.types"
import { Loader2Icon, TrashIcon, AlertCircleIcon } from "lucide-react"

interface WasteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WasteDialog({ open, onOpenChange, onSuccess }: WasteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingOptions, setFetchingOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [formData, setFormData] = useState<WasteFormData>({
    date: new Date().toISOString().split("T")[0],
    warehouse_id: 0,
    product_id: 0,
    quantity: 1,
    reason: "Kemasan Bocor / Rusak",
    status: "Dimusnahkan",
    notes: "",
  })

  useEffect(() => {
    if (open) {
      setError(null)
      loadOptions()
    }
  }, [open])

  const loadOptions = async () => {
    try {
      setFetchingOptions(true)
      const [whRes, prdRes] = await Promise.all([
        warehouseService.getWarehouses({ limit: 100 }),
        productService.getProducts({ limit: 200 }),
      ])
      const whList = whRes.items || []
      const prdList = prdRes.items || []
      setWarehouses(whList)
      setProducts(prdList)

      setFormData((prev) => ({
        ...prev,
        date: new Date().toISOString().split("T")[0],
        warehouse_id: prev.warehouse_id || (whList[0]?.id || 0),
        product_id: prev.product_id || (prdList[0]?.id || 0),
        quantity: 1,
        reason: "Kemasan Bocor / Rusak",
        status: "Dimusnahkan",
        notes: "",
      }))
    } catch (err: any) {
      console.error("Failed to load options", err)
    } finally {
      setFetchingOptions(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === formData.product_id)
  const estimatedLoss = selectedProduct ? formData.quantity * parseFloat(String(selectedProduct.selling_price || 0)) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.warehouse_id) {
      setError("Pilih gudang terlebih dahulu.")
      return
    }
    if (!formData.product_id) {
      setError("Pilih produk terlebih dahulu.")
      return
    }
    if (formData.quantity <= 0) {
      setError("Kuantitas harus lebih besar dari 0.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await inventoryService.createWaste(formData)
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal mencatat barang terbuang."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <TrashIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Pencatatan Barang Rusak / Waste</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Catat barang afkir, kadaluarsa, atau rusak untuk pemusnahan & potong stok.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {fetchingOptions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="waste_date" className="text-xs font-medium">Tanggal Kejadian *</Label>
                <Input
                  id="waste_date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="waste_warehouse" className="text-xs font-medium">Gudang *</Label>
                <select
                  id="waste_warehouse"
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: Number(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="waste_product" className="text-xs font-medium">Item Produk (SKU) *</Label>
              <select
                id="waste_product"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: Number(e.target.value) })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="waste_qty" className="text-xs font-medium">Kuantitas Terbuang *</Label>
                <Input
                  id="waste_qty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="waste_status" className="text-xs font-medium">Tindakan *</Label>
                <select
                  id="waste_status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Dimusnahkan">Dimusnahkan (Scrap)</option>
                  <option value="Retur Supplier">Retur ke Supplier</option>
                  <option value="Menunggu Approval">Menunggu Approval</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="waste_reason" className="text-xs font-medium">Alasan Kerusakan / Waste *</Label>
              <select
                id="waste_reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Kemasan Bocor / Rusak">Kemasan Bocor / Rusak</option>
                <option value="Kadaluarsa (Expired)">Kadaluarsa (Expired)</option>
                <option value="Kualitas Turun / Lembap">Kualitas Turun / Lembap</option>
                <option value="Diserang Hama">Diserang Hama</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              Estimasi Kerugian: <span className="font-bold">IDR {estimatedLoss.toLocaleString("id-ID")}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="waste_notes" className="text-xs font-medium">Catatan Investigasi</Label>
              <Input
                id="waste_notes"
                placeholder="Penyebab kerusakan, tindakan pencegahan..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={loading}
                className="text-xs"
              >
                {loading && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
                Catat Barang Rusak
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
