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
import { deliveryService } from "@/services/delivery.service"
import { salesOrderService } from "@/services/sales-order.service"
import type { SalesOrder } from "@/types/sales-order.types"
import { Loader2Icon, TruckIcon } from "lucide-react"

interface DeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preselectedSoId?: number | null
}

interface DeliveryItemRow {
  sales_order_item_id: number
  product_id: number
  productCode: string
  productName: string
  orderedQty: number
  deliveredQty: number
  remainingQty: number
  shipQty: number
}

export function DeliveryDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedSoId,
}: DeliveryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingSo, setFetchingSo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [selectedSoId, setSelectedSoId] = useState<number | "">("")
  const [selectedSo, setSelectedSo] = useState<SalesOrder | null>(null)

  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [courierFleet, setCourierFleet] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<DeliveryItemRow[]>([])

  useEffect(() => {
    if (open) {
      setError(null)
      setDeliveryDate(new Date().toISOString().slice(0, 10))
      setCourierFleet("")
      setTrackingNumber("")
      setNotes("")
      setItems([])

      // Load available Sales Orders (not cancelled or completely shipped, or include preselected)
      salesOrderService.getSalesOrders({ limit: 100 }).then((res) => {
        const eligible = (res.items || []).filter(
          (so) => so.status !== "Dibatalkan" && (so.status !== "Selesai Dikirim" || so.id === preselectedSoId)
        )
        setSalesOrders(eligible)

        if (preselectedSoId) {
          setSelectedSoId(preselectedSoId)
          loadSoDetails(preselectedSoId)
        } else if (eligible.length > 0) {
          setSelectedSoId(eligible[0].id)
          loadSoDetails(eligible[0].id)
        }
      }).catch(() => {})
    }
  }, [open, preselectedSoId])

  const loadSoDetails = async (soId: number) => {
    setFetchingSo(true)
    try {
      const so = await salesOrderService.getSalesOrderById(soId)
      setSelectedSo(so)
      if (so && so.items) {
        const rows: DeliveryItemRow[] = so.items.map((it) => {
          const ord = it.quantity || 0
          const del = it.delivered_quantity || 0
          const rem = Math.max(0, ord - del)
          return {
            sales_order_item_id: it.id || 0,
            product_id: it.product_id,
            productCode: it.product?.code || it.productCode || "-",
            productName: it.product?.name || it.productName || "-",
            orderedQty: ord,
            deliveredQty: del,
            remainingQty: rem,
            shipQty: rem, // default to remaining
          }
        })
        setItems(rows)
      }
    } catch {
      setError("Gagal memuat detail Sales Order terpilih.")
    } finally {
      setFetchingSo(false)
    }
  }

  const handleSoChange = (soId: number | "") => {
    setSelectedSoId(soId)
    if (soId) {
      loadSoDetails(Number(soId))
    } else {
      setSelectedSo(null)
      setItems([])
    }
  }

  const handleShipQtyChange = (idx: number, qty: number) => {
    const updated = [...items]
    updated[idx] = {
      ...updated[idx],
      shipQty: qty,
    }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSoId) {
      setError("Pilih Sales Order terlebih dahulu.")
      return
    }

    const validItems = items.filter((it) => it.shipQty > 0)
    if (validItems.length === 0) {
      setError("Kuantitas pengiriman harus lebih dari 0 untuk minimal 1 item.")
      return
    }

    // Check if any shipQty exceeds remaining
    for (const it of validItems) {
      if (it.shipQty > it.remainingQty) {
        setError(`Jumlah kirim untuk ${it.productName} melebihi sisa pesanan (${it.remainingQty}).`)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      await deliveryService.createDelivery({
        sales_order_id: Number(selectedSoId),
        warehouse_id: selectedSo?.warehouse_id || undefined,
        delivery_date: deliveryDate,
        courier_fleet: courierFleet || undefined,
        tracking_number: trackingNumber || undefined,
        notes: notes || undefined,
        items: validItems.map((it) => ({
          sales_order_item_id: it.sales_order_item_id,
          product_id: it.product_id,
          quantity: Number(it.shipQty),
        })),
      })
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal membuat Surat Jalan.")
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
              <TruckIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Buat Surat Jalan (Delivery Order)</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Generate dokumen pengiriman dan alokasi item untuk pesanan penjualan
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
              <Label className="text-xs font-medium">Referensi Sales Order *</Label>
              <select
                value={selectedSoId}
                onChange={(e) => handleSoChange(Number(e.target.value) || "")}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Pilih Sales Order --</option>
                {salesOrders.map((so) => (
                  <option key={so.id} value={so.id}>
                    {so.orderNo} - {so.customerName} ({so.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedSo && (
              <div className="sm:col-span-2 bg-muted/40 p-2.5 rounded-lg border border-border/60 text-xs flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-semibold text-foreground">{selectedSo.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gudang: </span>
                  <span className="font-semibold text-foreground">{selectedSo.warehouse || "Gudang Utama Cakung"}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tanggal Pengiriman *</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Armada / Kurir</Label>
              <Input
                placeholder="Contoh: Truk Box Mecca 01 (B 9123 SCD)"
                value={courierFleet}
                onChange={(e) => setCourierFleet(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">No. Resi / Tracking</Label>
              <Input
                placeholder="Contoh: MEC-TRK-001 / JNE-12345"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Catatan Muat</Label>
              <Input
                placeholder="Catatan sopir atau instruksi bongkar muat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item yang Dikirim
              </Label>
              {fetchingSo && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Loader2Icon className="size-3 animate-spin" /> Memuat item pesanan...
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">
                Pilih Sales Order untuk memuat daftar item yang dapat dikirim
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-md border border-border/50 text-xs">
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{row.productName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Kode: {row.productCode} | Dipesan: {row.orderedQty} | Terkirim: {row.deliveredQty} | Sisa: {row.remainingQty}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Kirim:</span>
                      <Input
                        type="number"
                        min={0}
                        max={row.remainingQty}
                        value={row.shipQty}
                        onChange={(e) => handleShipQtyChange(idx, parseFloat(e.target.value) || 0)}
                        className="text-xs h-8 w-24 text-right font-mono"
                      />
                      <span className="text-[11px] text-muted-foreground">Unit</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={loading || items.length === 0}
              className="text-xs"
            >
              {loading && <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />}
              Simpan Surat Jalan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
