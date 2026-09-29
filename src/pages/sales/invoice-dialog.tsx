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
import {
  Loader2Icon,
  ReceiptIcon,
  PlusIcon,
  Trash2Icon,
  CheckSquare,
  Square,
} from "lucide-react"
import { useFormDraft } from "@/hooks/use-form-draft"
import { DraftBanner } from "@/components/ui/draft-banner"

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preselectedDeliveryId?: number | null
}

interface ItemRow {
  delivery_id?: number
  delivery_number?: string
  delivery_item_id?: number
  sales_order_id?: number
  sales_order_item_id?: number
  product_id: number
  productCode?: string
  productName?: string
  quantity: number
  unit_price: number
}

interface InvoiceDraftData {
  mode: "delivery" | "manual"
  selectedDeliveryIds: number[]
  customerId: number | ""
  invoiceDate: string
  dueDate: string
  notes: string
  items: ItemRow[]
}

export function InvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedDeliveryId,
}: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingDeliveries, setFetchingDeliveries] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<"delivery" | "manual">("delivery")
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([])
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([])

  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerId, setCustomerId] = useState<number | "">("")

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ItemRow[]>([])

  const draftData: InvoiceDraftData = {
    mode,
    selectedDeliveryIds,
    customerId,
    invoiceDate,
    dueDate,
    notes,
    items,
  }

  const { hasDraft, savedAt, getDraft, clearDraft } = useFormDraft<InvoiceDraftData>(
    "create_invoice",
    draftData,
    open
  )

  useEffect(() => {
    if (open) {
      setError(null)
      setInvoiceDate(new Date().toISOString().slice(0, 10))
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      setNotes("")
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }])
      setSelectedDeliveryIds([])

      // Fetch deliveries
      deliveryService
        .getDeliveries({ limit: 100 })
        .then((res) => {
          const eligible = (res.items || []).filter((d) => d.status !== "Kendala Pengiriman")
          setAllDeliveries(eligible)

          if (preselectedDeliveryId) {
            setMode("delivery")
            setSelectedDeliveryIds([preselectedDeliveryId])
            loadDeliveriesDetails([preselectedDeliveryId])
          } else if (eligible.length > 0) {
            setSelectedDeliveryIds([eligible[0].id])
            loadDeliveriesDetails([eligible[0].id])
          }
        })
        .catch(() => {})

      // Fetch customers & products for manual mode
      customerService
        .getCustomers({ limit: 100 })
        .then((res) => {
          if (res.items?.length) setCustomers(res.items)
        })
        .catch(() => {})

      productService
        .getProducts({ limit: 100 })
        .then((res) => {
          if (res.items?.length) setProducts(res.items)
        })
        .catch(() => {})
    }
  }, [open, preselectedDeliveryId])

  const handleRestoreDraft = () => {
    const draft = getDraft()
    if (draft) {
      setMode(draft.mode || "delivery")
      setSelectedDeliveryIds(draft.selectedDeliveryIds || [])
      setCustomerId(draft.customerId || "")
      setInvoiceDate(draft.invoiceDate || new Date().toISOString().slice(0, 10))
      setDueDate(draft.dueDate || new Date().toISOString().slice(0, 10))
      setNotes(draft.notes || "")
      setItems(draft.items || [])
    }
  }

  // Active primary delivery to filter multi-DO for same customer
  const activePrimaryDelivery = allDeliveries.find((d) =>
    selectedDeliveryIds.includes(d.id)
  )
  const activeCustomerId = activePrimaryDelivery?.customer_id
  const activeCustomerName = activePrimaryDelivery?.customerName || "-"

  const compatibleDeliveries = allDeliveries.filter((d) => {
    if (!activeCustomerId) return true
    return d.customer_id === activeCustomerId
  })

  const loadDeliveriesDetails = async (dIds: number[]) => {
    if (dIds.length === 0) {
      setItems([])
      return
    }

    setFetchingDeliveries(true)
    setError(null)

    try {
      const detailedDeliveries = await Promise.all(
        dIds.map((id) => deliveryService.getDeliveryById(id))
      )

      const accumulatedRows: ItemRow[] = []

      for (const d of detailedDeliveries) {
        if (!d || !d.items) continue
        const dNo = d.deliveryNo || `DO #${d.id}`

        for (const it of d.items) {
          // Fixed Pricing: Inherit price from SO (it.unit_price), NOT master product current price
          const price = Number((it as any).unit_price) || Number((it.product as any)?.selling_price) || 0

          accumulatedRows.push({
            delivery_id: d.id,
            delivery_number: dNo,
            delivery_item_id: it.id,
            sales_order_id: it.sales_order_id,
            sales_order_item_id: it.sales_order_item_id,
            product_id: it.product_id,
            productCode: it.productCode || it.product?.code || "-",
            productName: it.productName || it.product?.name || `Produk #${it.product_id}`,
            quantity: Number(it.quantity) || 0,
            unit_price: price,
          })
        }
      }

      setItems(accumulatedRows)
    } catch {
      setError("Gagal memuat rincian Surat Jalan.")
    } finally {
      setFetchingDeliveries(false)
    }
  }

  const toggleDeliverySelection = (dId: number) => {
    let nextIds: number[]
    if (selectedDeliveryIds.includes(dId)) {
      nextIds = selectedDeliveryIds.filter((id) => id !== dId)
    } else {
      nextIds = [...selectedDeliveryIds, dId]
    }
    setSelectedDeliveryIds(nextIds)
    loadDeliveriesDetails(nextIds)
  }

  const handleProductChange = (index: number, pId: number) => {
    const prod = products.find((p) => p.id === pId)
    const price = prod ? Number(prod.selling_price) || 0 : 0

    const updated = [...items]
    updated[index] = {
      ...updated[index],
      product_id: pId,
      productCode: prod?.code || "-",
      productName: prod?.name || "-",
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
        if (selectedDeliveryIds.length === 0) {
          setError("Pilih minimal 1 Surat Jalan terlebih dahulu.")
          setLoading(false)
          return
        }

        await invoiceService.createInvoice({
          delivery_ids: selectedDeliveryIds,
          customer_id: activeCustomerId ? Number(activeCustomerId) : undefined,
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

      clearDraft()
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
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ReceiptIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Terbitkan Faktur Penjualan (Invoice)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Konsolidasikan tagihan dari satu atau beberapa Surat Jalan (Multi-DO) dengan harga terkunci pesanan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DraftBanner
          hasDraft={hasDraft}
          savedAt={savedAt}
          onRestore={handleRestoreDraft}
          onDiscard={clearDraft}
        />

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
              Dari Surat Jalan (Konsolidasi Multi-DO)
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

          <div className="space-y-3">
            {mode === "delivery" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pilih Surat Jalan (Konsolidasi Multi-DO) *
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedDeliveryIds.length} DO Terpilih
                  </span>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-2 max-h-48 overflow-y-auto">
                  {compatibleDeliveries.length === 0 ? (
                    <div className="text-center py-3 text-xs text-muted-foreground">
                      Tidak ada Surat Jalan yang tersedia
                    </div>
                  ) : (
                    compatibleDeliveries.map((d) => {
                      const isChecked = selectedDeliveryIds.includes(d.id)
                      return (
                        <div
                          key={d.id}
                          onClick={() => toggleDeliverySelection(d.id)}
                          className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary/10 border-primary/40 font-medium text-foreground"
                              : "hover:bg-muted/40 border-border/50 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isChecked ? (
                              <CheckSquare className="size-4 text-primary shrink-0" />
                            ) : (
                              <Square className="size-4 text-muted-foreground shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold text-foreground">
                                {d.deliveryNo}
                              </span>
                              <span className="ml-2 text-[11px] text-muted-foreground">
                                {d.customerName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {d.date}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-muted font-mono">
                              {d.status}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {activePrimaryDelivery && (
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/60 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Customer: </span>
                      <span className="font-semibold text-foreground">
                        {activeCustomerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total DO Terpilih: </span>
                      <span className="font-semibold text-foreground">
                        {selectedDeliveryIds.length} Dokumen
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
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
          </div>

          {/* Item List */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item Tagihan ({items.length} Baris)
              </Label>
              {fetchingDeliveries && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Loader2Icon className="size-3 animate-spin" /> Memuat item surat jalan...
                </div>
              )}
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

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                  Pilih Surat Jalan untuk memuat item tagihan
                </div>
              ) : (
                items.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-md border border-border/50 text-xs"
                  >
                    {mode === "manual" ? (
                      <>
                        <div className="flex-1">
                          <select
                            value={row.product_id}
                            onChange={(e) =>
                              handleProductChange(idx, Number(e.target.value))
                            }
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
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="Qty"
                            className="text-xs h-8 text-right"
                          />
                        </div>

                        <div className="w-28">
                          <Input
                            type="number"
                            min={0}
                            value={row.unit_price}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
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
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {row.delivery_number && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono">
                                {row.delivery_number}
                              </span>
                            )}
                            <span>{row.productName}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Kode: {row.productCode} | {row.quantity} Unit x IDR{" "}
                            {row.unit_price.toLocaleString("id-ID")} (Harga Terkunci Pesanan)
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-foreground">
                          IDR {(row.quantity * row.unit_price || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
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
              disabled={
                loading ||
                (mode === "delivery" && selectedDeliveryIds.length === 0) ||
                items.length === 0
              }
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
