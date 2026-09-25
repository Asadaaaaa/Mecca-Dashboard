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
import { salesOrderService } from "@/services/sales-order.service"
import { customerService } from "@/services/customer.service"
import { warehouseService } from "@/services/warehouse.service"
import { productService } from "@/services/product.service"
import type { Customer } from "@/types/customer.types"
import type { Warehouse } from "@/types/settings.types"
import type { Product } from "@/types/product.types"
import type { AvailableStockInfo } from "@/types/sales-order.types"
import { Loader2Icon, ShoppingCartIcon, PlusIcon, Trash2Icon } from "lucide-react"

interface SalesOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ItemRow {
  product_id: number
  quantity: number
  unit_price: number
}

export function SalesOrderDialog({
  open,
  onOpenChange,
  onSuccess,
}: SalesOrderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [customerId, setCustomerId] = useState<number | "">("")
  const [warehouseId, setWarehouseId] = useState<number | "">("")
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ItemRow[]>([])
  const [stockMap, setStockMap] = useState<Record<number, AvailableStockInfo>>({})

  const fetchStock = async (wId: number, pId: number) => {
    if (!wId || !pId) return
    try {
      const stock = await salesOrderService.getAvailableStock(wId, pId)
      setStockMap((prev) => ({ ...prev, [pId]: stock }))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (warehouseId) {
      items.forEach((it) => {
        if (it.product_id > 0) {
          fetchStock(Number(warehouseId), it.product_id)
        }
      })
    }
  }, [warehouseId])

  useEffect(() => {
    if (open) {
      setError(null)
      setCustomerId("")
      setWarehouseId("")
      setOrderDate(new Date().toISOString().slice(0, 10))
      setNotes("")
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }])
      setStockMap({})

      // Load master data
      customerService.getCustomers({ limit: 100 }).then((res) => {
        if (res.items?.length) setCustomers(res.items)
      }).catch(() => {})

      warehouseService.getWarehouses({ limit: 100 }).then((res) => {
        if (res.items?.length) {
          setWarehouses(res.items)
          setWarehouseId(res.items[0].id)
        }
      }).catch(() => {})

      productService.getProducts({ limit: 100 }).then((res) => {
        if (res.items?.length) setProducts(res.items)
      }).catch(() => {})
    }
  }, [open])

  const handleProductChange = (index: number, pId: number) => {
    const prod = products.find((p) => p.id === pId)
    const price = prod ? Number(prod.selling_price) || 0 : 0

    const updated = [...items]
    updated[index] = {
      ...updated[index],
      product_id: pId,
      unit_price: price,
    }
    setItems(updated)

    if (warehouseId && pId > 0) {
      fetchStock(Number(warehouseId), pId)
    }
  }

  const handleItemChange = (index: number, field: keyof ItemRow, val: number) => {
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      [field]: val,
    }
    setItems(updated)
  }

  const addItemRow = () => {
    setItems([...items, { product_id: 0, quantity: 1, unit_price: 0 }])
  }

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      setError("Pilih Customer terlebih dahulu.")
      return
    }

    const validItems = items.filter((it) => it.product_id > 0 && it.quantity > 0)
    if (validItems.length === 0) {
      setError("Tambahkan minimal 1 produk dengan kuantitas yang valid.")
      return
    }

    // Strict validation: Check available stock before submitting
    for (const it of validItems) {
      const stock = stockMap[it.product_id]
      if (stock && it.quantity > stock.availableStock) {
        const prod = products.find((p) => p.id === it.product_id)
        const pName = prod?.name || `Produk #${it.product_id}`
        setError(`Stok tidak mencukupi untuk "${pName}". Stok tersedia: ${stock.availableStock} (Fisik: ${stock.physicalStock}, Terpesan di SO aktif: ${stock.reservedStock}), diminta: ${it.quantity}. Harap sesuaikan pesanan.`)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      await salesOrderService.createSalesOrder({
        customer_id: Number(customerId),
        warehouse_id: warehouseId ? Number(warehouseId) : undefined,
        order_date: orderDate,
        notes: notes || undefined,
        items: validItems.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      })
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal membuat Sales Order.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCartIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Buat Pesanan Penjualan (Sales Order) Baru</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Input pesanan penjualan langsung untuk segera diproses kirim
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Customer *</Label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value) || "")}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Pilih Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Gudang Pemenuhan *</Label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(Number(e.target.value) || "")}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Pilih Gudang --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tanggal Pesanan *</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Catatan Pesanan</Label>
              <Input
                placeholder="Instruksi khusus pengiriman atau kontak penerima"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item Pesanan
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItemRow}
                className="h-7 text-xs px-2"
              >
                <PlusIcon className="size-3 mr-1" /> Tambah Baris
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((row, idx) => {
                const stock = row.product_id > 0 ? stockMap[row.product_id] : null
                const isExceeded = Boolean(stock && row.quantity > stock.availableStock)

                return (
                  <div key={idx} className="space-y-1 bg-muted/30 p-2.5 rounded-md border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <select
                          value={row.product_id}
                          onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                          className="w-full h-8 rounded border border-input bg-background px-2 text-xs text-foreground outline-none"
                        >
                          <option value={0}>-- Pilih Produk --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                          className={`text-xs h-8 text-right ${isExceeded ? "border-red-500 text-red-500 font-bold focus-visible:ring-red-500" : ""}`}
                        />
                      </div>

                      <div className="w-32">
                        <Input
                          type="number"
                          min={0}
                          value={row.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", parseFloat(e.target.value) || 0)}
                          placeholder="Harga Satuan"
                          className="text-xs h-8 text-right font-mono"
                        />
                      </div>

                      <div className="w-32 text-right font-mono text-xs font-medium text-foreground">
                        IDR {(row.quantity * row.unit_price || 0).toLocaleString("id-ID")}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={items.length <= 1}
                        onClick={() => removeItemRow(idx)}
                        className="text-red-500 hover:text-red-700 h-8 w-8"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>

                    {row.product_id > 0 && (
                      <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Stok Gudang:</span>
                          {stock ? (
                            <span className={stock.availableStock > 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-500 font-medium"}>
                              Tersedia: <strong className="font-semibold">{stock.availableStock}</strong> (Fisik: {stock.physicalStock}, Terpesan di SO aktif: {stock.reservedStock})
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Memuat info stok...</span>
                          )}
                        </div>
                        {isExceeded && (
                          <span className="text-red-500 font-medium flex items-center gap-1">
                            ⚠️ Melebihi stok tersedia ({stock?.availableStock})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 text-xs font-semibold text-foreground">
              Total Order: IDR {calculateSubtotal().toLocaleString("id-ID")}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
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
              {loading && <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />}
              Simpan Sales Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
