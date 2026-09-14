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
import type { StockAdjustmentFormData } from "@/types/inventory.types"
import { Loader2Icon, BoxesIcon, AlertCircleIcon } from "lucide-react"

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialWarehouseId?: number
  initialProductId?: number
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  onSuccess,
  initialWarehouseId,
  initialProductId,
}: StockAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingOptions, setFetchingOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [formData, setFormData] = useState<StockAdjustmentFormData>({
    warehouse_id: initialWarehouseId || 0,
    product_id: initialProductId || 0,
    type: "STOCK_IN",
    quantity: 1,
    min_stock: 10,
    notes: "",
  })

  useEffect(() => {
    if (open) {
      setFormData({
        warehouse_id: initialWarehouseId || (warehouses[0]?.id || 0),
        product_id: initialProductId || (products[0]?.id || 0),
        type: "STOCK_IN",
        quantity: 1,
        min_stock: 10,
        notes: "",
      })
      setError(null)
      loadOptions()
    }
  }, [open, initialWarehouseId, initialProductId])

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
        warehouse_id: prev.warehouse_id || (whList[0]?.id || 0),
        product_id: prev.product_id || (prdList[0]?.id || 0),
      }))
    } catch (err: any) {
      console.error("Failed to load options", err)
    } finally {
      setFetchingOptions(false)
    }
  }

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
      await inventoryService.stockAdjustment(formData)
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan penyesuaian stok."
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
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BoxesIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Penyesuaian Saldo Stok</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tambah stok masuk (Stock In) atau lakukan koreksi stok manual.
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
            <div className="space-y-1.5">
              <Label htmlFor="warehouse_id" className="text-xs font-medium">Gudang Penyimpanan *</Label>
              <select
                id="warehouse_id"
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

            <div className="space-y-1.5">
              <Label htmlFor="product_id" className="text-xs font-medium">Item Produk (SKU) *</Label>
              <select
                id="product_id"
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
                <Label htmlFor="type" className="text-xs font-medium">Tipe Mutasi *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="STOCK_IN">Stock In (Penerimaan)</option>
                  <option value="ADJUSTMENT_IN">Penyesuaian Masuk (+)</option>
                  <option value="ADJUSTMENT_OUT">Penyesuaian Keluar (-)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs font-medium">Kuantitas *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="min_stock" className="text-xs font-medium">Batas Minimum Stok Aman (Opsional)</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock ?? 10}
                onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-medium">Catatan / Alasan Mutasi</Label>
              <Input
                id="notes"
                placeholder="Contoh: Penerimaan kontainer PO-102, Koreksi fisik, dll."
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
                size="sm"
                disabled={loading}
                className="text-xs"
              >
                {loading && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
                Simpan Penyesuaian
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
