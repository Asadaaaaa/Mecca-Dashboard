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
import { Loader2Icon, ClipboardCheckIcon, PlusIcon, Trash2Icon, AlertCircleIcon } from "lucide-react"

interface OpnameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ItemRow {
  product_id: number
  physical_stock: number
  notes?: string
}

export function OpnameDialog({ open, onOpenChange, onSuccess }: OpnameDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingOptions, setFetchingOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [warehouseId, setWarehouseId] = useState<number>(0)
  const [inspectorName, setInspectorName] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState<string>("")
  const [items, setItems] = useState<ItemRow[]>([])

  useEffect(() => {
    if (open) {
      setError(null)
      setDate(new Date().toISOString().split("T")[0])
      setNotes("")
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

      const defaultWh = whList[0]?.id || 0
      setWarehouseId(defaultWh)
      setInspectorName("Petugas Gudang")

      // Prepopulate first item if available
      if (prdList.length > 0) {
        setItems([{ product_id: prdList[0].id, physical_stock: 0, notes: "" }])
      }
    } catch (err: any) {
      console.error("Failed to load options", err)
    } finally {
      setFetchingOptions(false)
    }
  }

  const handleAddItem = () => {
    const availablePrd = products.find((p) => !items.some((i) => i.product_id === p.id)) || products[0]
    if (availablePrd) {
      setItems([...items, { product_id: availablePrd.id, physical_stock: 0, notes: "" }])
    }
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index))
  }

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!warehouseId) {
      setError("Pilih gudang terlebih dahulu.")
      return
    }
    if (!inspectorName.trim()) {
      setError("Nama inspektur/petugas wajib diisi.")
      return
    }
    if (items.length === 0) {
      setError("Minimal tambahkan 1 produk untuk dihitung fisik.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await inventoryService.createOpname({
        date,
        warehouse_id: warehouseId,
        inspector_name: inspectorName,
        notes,
        items,
      })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal membuat sesi opname."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardCheckIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Buat Sesi Stok Opname</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Rekonsiliasi data fisik barang riil vs catatan saldo sistem di gudang.
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
                <Label htmlFor="opname_date" className="text-xs font-medium">Tanggal Opname *</Label>
                <Input
                  id="opname_date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="opname_warehouse" className="text-xs font-medium">Lokasi Gudang *</Label>
                <select
                  id="opname_warehouse"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(Number(e.target.value))}
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
              <Label htmlFor="inspector_name" className="text-xs font-medium">Petugas Auditor / Inspektur *</Label>
              <Input
                id="inspector_name"
                placeholder="Nama pemeriksa fisik gudang"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Daftar Produk Diperiksa ({items.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="text-xs h-7 px-2"
                >
                  <PlusIcon className="size-3 mr-1" />
                  Tambah Baris
                </Button>
              </div>

              <div className="space-y-2 border border-border/70 rounded-lg p-2.5 bg-muted/20">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, "product_id", Number(e.target.value))}
                      className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-xs focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Fisik"
                        value={item.physical_stock}
                        onChange={(e) => handleItemChange(idx, "physical_stock", parseFloat(e.target.value) || 0)}
                        className="text-xs h-8 text-right"
                      />
                    </div>

                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opname_notes" className="text-xs font-medium">Catatan Sesi</Label>
              <Input
                id="opname_notes"
                placeholder="Keterangan kondisi area / investigasi selisih..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                Simpan Sesi Opname
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
