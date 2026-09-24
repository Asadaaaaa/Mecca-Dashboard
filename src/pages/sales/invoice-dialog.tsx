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
import { invoiceService } from "@/services/invoice.service"
import { deliveryService } from "@/services/delivery.service"
import { customerService } from "@/services/customer.service"
import { productService } from "@/services/product.service"
import type { Delivery } from "@/types/delivery.types"
import type { Customer } from "@/types/customer.types"
import type { Product } from "@/types/product.types"
import { Loader2Icon, ReceiptIcon, PlusIcon, Trash2Icon } from "lucide-react"

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preselectedDeliveryId?: number | null
}

interface ItemRow {
  product_id: number
  quantity: number
  unit_price: number
}

export function InvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedDeliveryId,
}: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<"delivery" | "manual">("delivery")
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | "">("")
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerId, setCustomerId] = useState<number | "">("")

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ItemRow[]>([])

  useEffect(() => {
    if (open) {
      setError(null)
      setInvoiceDate(new Date().toISOString().slice(0, 10))
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      setNotes("")
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }])

      // Fetch deliveries
      deliveryService.getDeliveries({ limit: 100 }).then((res) => {
        const eligible = res.items || []
        setDeliveries(eligible)

        if (preselectedDeliveryId) {
          setMode("delivery")
          setSelectedDeliveryId(preselectedDeliveryId)
          loadDeliveryDetails(preselectedDeliveryId)
        } else if (eligible.length > 0) {
          setSelectedDeliveryId(eligible[0].id)
          loadDeliveryDetails(eligible[0].id)
        }
      }).catch(() => {})

      // Fetch customers & products for manual mode
      customerService.getCustomers({ limit: 100 }).then((res) => {
        if (res.items?.length) setCustomers(res.items)
      }).catch(() => {})

      productService.getProducts({ limit: 100 }).then((res) => {
        if (res.items?.length) setProducts(res.items)
      }).catch(() => {})
    }
  }, [open, preselectedDeliveryId])

  const loadDeliveryDetails = async (dId: number) => {
    try {
      const d = await deliveryService.getDeliveryById(dId)
      setSelectedDelivery(d)
      if (d) {
        setCustomerId(d.customer_id)
        // If customer has terms, compute due date
        const terms = (d as any).customer?.payment_terms || 30
        const dDate = new Date(invoiceDate)
        dDate.setDate(dDate.getDate() + terms)
        setDueDate(dDate.toISOString().slice(0, 10))

        if (d.items && d.items.length > 0) {
          setItems(
            d.items.map((it) => ({
              product_id: it.product_id,
              quantity: it.quantity,
              unit_price: Number((it.product as any)?.selling_price) || 0,
            }))
          )
        }
      }
    } catch {
      setError("Gagal memuat rincian Surat Jalan.")
    }
  }

  const handleDeliveryChange = (dId: number | "") => {
    setSelectedDeliveryId(dId)
    if (dId) {
      loadDeliveryDetails(Number(dId))
    } else {
      setSelectedDelivery(null)
      setItems([])
    }
  }

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
    setLoading(true)
    setError(null)

    try {
      if (mode === "delivery") {
        if (!selectedDeliveryId) {
          setError("Pilih Surat Jalan terlebih dahulu.")
          setLoading(false)
          return
        }

        await invoiceService.createInvoice({
          delivery_id: Number(selectedDeliveryId),
          invoice_date: invoiceDate,
          due_date: dueDate,
          notes: notes || undefined,
        })
      } else {
        if (!customerId) {
          setError("Pilih Customer terlebih dahulu.")
          setLoading(false)
          return
        }

        const validItems = items.filter((it) => it.product_id > 0 && it.quantity > 0)
        if (validItems.length === 0) {
          setError("Tambahkan minimal 1 produk dengan jumlah yang valid.")
          setLoading(false)
          return
        }

        await invoiceService.createInvoice({
          customer_id: Number(customerId),
          invoice_date: invoiceDate,
          due_date: dueDate,
          notes: notes || undefined,
          items: validItems.map((it) => ({
            product_id: it.product_id,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
          })),
        })
      }

      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal membuat invoice.")
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
              <ReceiptIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Terbitkan Faktur Penjualan (Invoice)</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Buat tagihan invoice resmi berdasarkan surat jalan yang telah dikirim atau manual
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
          {/* Mode Switcher */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("delivery")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                mode === "delivery"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dari Surat Jalan (Delivery Order)
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                mode === "manual"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Manual / Langsung
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mode === "delivery" ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium">Pilih Surat Jalan (DO) *</Label>
                <select
                  value={selectedDeliveryId}
                  onChange={(e) => handleDeliveryChange(Number(e.target.value) || "")}
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">-- Pilih Surat Jalan --</option>
                  {deliveries.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.deliveryNo} - {d.customerName} ({d.status})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium">Pilih Customer *</Label>
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
            )}

            {selectedDelivery && mode === "delivery" && (
              <div className="sm:col-span-2 bg-muted/40 p-2.5 rounded-lg border border-border/60 text-xs flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-semibold text-foreground">{selectedDelivery.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ref. Order: </span>
                  <span className="font-semibold text-foreground">{selectedDelivery.refOrder}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tanggal Faktur *</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tanggal Jatuh Tempo *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Catatan / Keterangan Tagihan</Label>
              <Input
                placeholder="Contoh: Tagihan termin 1, transfer ke rekening BCA..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Item List (Editable if manual, or read-only/preview if from delivery) */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item Tagihan
              </Label>
              {mode === "manual" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  className="h-7 text-xs px-2"
                >
                  <PlusIcon className="size-3 mr-1" /> Tambah Baris
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {items.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/50 text-xs">
                  {mode === "manual" ? (
                    <>
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

                      <div className="w-20">
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                          className="text-xs h-8 text-right"
                        />
                      </div>

                      <div className="w-28">
                        <Input
                          type="number"
                          min={0}
                          value={row.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", parseFloat(e.target.value) || 0)}
                          placeholder="Harga"
                          className="text-xs h-8 text-right font-mono"
                        />
                      </div>

                      <div className="w-28 text-right font-mono text-xs font-semibold text-foreground">
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
                    </>
                  ) : (
                    <div className="w-full flex justify-between items-center py-1">
                      <div>
                        <div className="font-semibold text-foreground">
                          {products.find((p) => p.id === row.product_id)?.name || `Produk #${row.product_id}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {row.quantity} Unit x IDR {row.unit_price.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-foreground">
                        IDR {(row.quantity * row.unit_price || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 text-xs font-semibold text-foreground">
              Total Tagihan: IDR {calculateSubtotal().toLocaleString("id-ID")}
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
              disabled={loading || (mode === "delivery" && !selectedDeliveryId)}
              className="text-xs"
            >
              {loading && <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />}
              Terbitkan Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
