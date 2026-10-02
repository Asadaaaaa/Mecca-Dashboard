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
import { settingService } from "@/services/setting.service"
import type { Customer } from "@/types/customer.types"
import type { Warehouse, SystemSettings } from "@/types/settings.types"
import type { Product } from "@/types/product.types"
import type { AvailableStockInfo, SalesOrder, SalesOrderFormData } from "@/types/sales-order.types"
import { Loader2Icon, ShoppingCartIcon, PlusIcon, Trash2Icon, ShieldAlertIcon, StoreIcon, MapPinIcon } from "lucide-react"
import { useFormDraft } from "@/hooks/use-form-draft"
import { DraftBanner } from "@/components/ui/draft-banner"

interface SalesOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  salesOrder?: SalesOrder | null
}

interface ItemRow {
  product_id: number
  quantity: number
  unit_price: number
}

interface SalesOrderDraftData {
  customerId: number | ""
  warehouseId: number | ""
  orderDate: string
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  notes: string
  items: ItemRow[]
}

export function SalesOrderDialog({
  open,
  onOpenChange,
  onSuccess,
  salesOrder,
}: SalesOrderDialogProps) {
  const isEdit = Boolean(salesOrder)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [customerId, setCustomerId] = useState<number | "">("")
  const [warehouseId, setWarehouseId] = useState<number | "">("")
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ItemRow[]>([])
  const [stockMap, setStockMap] = useState<Record<number, AvailableStockInfo>>({})

  const draftData: SalesOrderDraftData = {
    customerId,
    warehouseId,
    orderDate,
    recipientName,
    recipientPhone,
    shippingAddress,
    notes,
    items,
  }

  const { hasDraft, savedAt, getDraft, clearDraft } = useFormDraft<SalesOrderDraftData>(
    "create_sales_order",
    draftData,
    open && !isEdit
  )

  // System Settings & PIN Authorization Modal States
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState<string | null>(null)
  const [submittingPin, setSubmittingPin] = useState(false)
  const [insufficientList, setInsufficientList] = useState<
    { name: string; requested: number; available: number; physical: number }[]
  >([])

  const fetchStock = async (wId: number, pId: number) => {
    if (!wId || !pId) return
    try {
      const stock = await salesOrderService.getAvailableStock(wId, pId, salesOrder?.id)
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
      setStockMap({})

      // Load master data
      customerService.getCustomers({ limit: 100 }).then((res) => {
        if (res.items?.length) setCustomers(res.items)
      }).catch(() => {})

      warehouseService.getWarehouses({ limit: 100 }).then((res) => {
        if (res.items?.length) {
          setWarehouses(res.items)
          if (!salesOrder) {
            setWarehouseId(res.items[0].id)
          }
        }
      }).catch(() => {})

      productService.getProducts({ limit: 100 }).then((res) => {
        if (res.items?.length) setProducts(res.items)
      }).catch(() => {})

      settingService.getSystemSettings().then((s) => setSystemSettings(s)).catch(() => {})

      if (salesOrder) {
        setCustomerId(salesOrder.customer_id)
        setWarehouseId(salesOrder.warehouse_id || "")
        setOrderDate(salesOrder.date || new Date().toISOString().slice(0, 10))
        setNotes(salesOrder.notes || "")
        setRecipientName(
          salesOrder.recipient_name ||
          salesOrder.customerName ||
          (typeof salesOrder.customer === "object" ? salesOrder.customer?.name : "") ||
          ""
        )
        setRecipientPhone(
          salesOrder.recipient_phone ||
          (typeof salesOrder.customer === "object" ? salesOrder.customer?.phone : "") ||
          ""
        )
        setShippingAddress(
          salesOrder.shipping_address ||
          (typeof salesOrder.customer === "object" ? salesOrder.customer?.address : "") ||
          ""
        )
        if (salesOrder.items && salesOrder.items.length > 0) {
          setItems(
            salesOrder.items.map((it) => ({
              product_id: it.product_id,
              quantity: Number(it.quantity) || 1,
              unit_price: Number(it.unit_price) || 0,
            }))
          )
        } else {
          setItems([{ product_id: 0, quantity: 1, unit_price: 0 }])
        }
      } else {
        setCustomerId("")
        setOrderDate(new Date().toISOString().slice(0, 10))
        setRecipientName("")
        setRecipientPhone("")
        setShippingAddress("")
        setNotes("")
        setItems([{ product_id: 0, quantity: 1, unit_price: 0 }])
      }
    }
  }, [open, salesOrder])

  const handleCustomerChange = (cId: number | "") => {
    setCustomerId(cId)
    if (cId) {
      const selected = customers.find((c) => c.id === cId)
      if (selected) {
        // Auto-fill recipient name, phone, and address from selected customer
        setRecipientName(selected.name || "")
        setRecipientPhone(selected.phone || "")
        setShippingAddress(selected.address || "")
      }
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

  const executeSaveSo = async (force: boolean = false, pin?: string) => {
    const validItems = items.filter((it) => it.product_id > 0 && it.quantity > 0)
    setLoading(true)
    setError(null)
    setPinError(null)

    const payload: SalesOrderFormData = {
      customer_id: Number(customerId),
      warehouse_id: warehouseId ? Number(warehouseId) : undefined,
      order_date: orderDate,
      recipient_name: recipientName || undefined,
      recipient_phone: recipientPhone || undefined,
      shipping_address: shippingAddress || undefined,
      notes: notes || undefined,
      force_override: force ? true : undefined,
      pin: force ? pin : undefined,
      items: validItems.map((it) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
      })),
    }

    try {
      if (isEdit && salesOrder?.id) {
        await salesOrderService.updateSalesOrder(salesOrder.id, payload)
      } else {
        await salesOrderService.createSalesOrder(payload)
      }
      if (pinModalOpen) setPinModalOpen(false)
      if (!isEdit) clearDraft()
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const errMsg = e.response?.data?.message || e.message || (isEdit ? "Gagal memperbarui Sales Order." : "Gagal membuat Sales Order.")
      if (force) {
        setPinError(errMsg)
      } else {
        setError(errMsg)
      }
    } finally {
      setLoading(false)
      setSubmittingPin(false)
    }
  }

  const handleRestoreDraft = () => {
    const draft = getDraft()
    if (draft) {
      setCustomerId(draft.customerId || "")
      setWarehouseId(draft.warehouseId || "")
      setOrderDate(draft.orderDate || new Date().toISOString().slice(0, 10))
      setRecipientName(draft.recipientName || "")
      setRecipientPhone(draft.recipientPhone || "")
      setShippingAddress(draft.shippingAddress || "")
      setNotes(draft.notes || "")
      setItems(draft.items || [])
    }
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

    // Check available stock before submitting
    const shortages: { name: string; requested: number; available: number; physical: number }[] = []
    for (const it of validItems) {
      const stock = stockMap[it.product_id]
      if (stock && it.quantity > stock.availableStock) {
        const prod = products.find((p) => p.id === it.product_id)
        shortages.push({
          name: prod?.name || `Produk #${it.product_id}`,
          requested: it.quantity,
          available: stock.availableStock,
          physical: stock.physicalStock,
        })
      }
    }

    if (shortages.length > 0) {
      // Check if force SO is enabled in system settings
      if (!systemSettings?.force_sales_order_enabled) {
        const first = shortages[0]
        setError(
          `Stok tidak mencukupi untuk "${first.name}". Stok tersedia: ${first.available} (Fisik: ${first.physical}), diminta: ${first.requested}. Fitur Paksa Buat Sales Order (Force SO) dinonaktifkan di Pengaturan Sistem.`
        )
        return
      }

      // If force SO is enabled, open the PIN modal for authorization
      setInsufficientList(shortages)
      setPinInput("")
      setPinError(null)
      setPinModalOpen(true)
      return
    }

    await executeSaveSo(false)
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinError(null)
    if (!/^\d{6}$/.test(pinInput)) {
      setPinError("Masukkan 6 digit angka PIN otorisasi.")
      return
    }
    setSubmittingPin(true)
    await executeSaveSo(true, pinInput)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCartIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isEdit ? `Edit Pesanan Penjualan (${salesOrder?.orderNo || ""})` : "Buat Pesanan Penjualan (Sales Order) Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEdit
                  ? "Perbarui rincian item, alamat tujuan, atau informasi penerima pesanan."
                  : "Input pesanan penjualan langsung untuk segera diproses kirim ke pelanggan."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isEdit && (
          <DraftBanner
            hasDraft={hasDraft}
            savedAt={savedAt}
            onRestore={handleRestoreDraft}
            onDiscard={clearDraft}
          />
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-xs">
            {error}
          </div>
        )}

        {/* Informasi Identitas Toko (Otomatis Muncul) */}
        <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <StoreIcon className="size-3 text-primary" />
                Identitas Toko / Pengirim
              </div>
              <div className="font-semibold text-foreground text-sm mt-0.5">PT MECCA DISTRIBUSI SOLUSINDO</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Kawasan Pergudangan Cakung Blok B-12, Jakarta Timur 13910
              </div>
            </div>
            <div className="sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Kontak Toko
              </span>
              <div className="text-[11px] font-semibold text-foreground">(021) 8901-2345</div>
              <div className="text-[11px] text-muted-foreground">sales@mecca.co.id</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Customer / Pelanggan *</Label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(Number(e.target.value) || "")}
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
          </div>

          {/* Bagian Penerima & Alamat Pengiriman (Otomatis Terisi & Dapat Diedit) */}
          <div className="rounded-lg border border-border/70 bg-card p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 text-primary" />
                Informasi Penerima & Alamat Pengiriman
              </span>
              <span className="text-[10px] text-muted-foreground">
                (Otomatis terisi dari pelanggan)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Nama Penerima</Label>
                <Input
                  placeholder="Nama PIC / Kontak Penerima"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">No. Telepon Penerima</Label>
                <Input
                  placeholder="Contoh: 081234567890"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] font-medium text-muted-foreground">Alamat Lengkap Pengiriman</Label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap tujuan pengiriman pesanan..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Catatan Pesanan</Label>
            <Input
              placeholder="Instruksi khusus pengiriman atau keterangan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-9"
            />
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

                    {stock && (
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
                        <span>
                          Fisik Gudang: <b className="text-foreground">{stock.physicalStock}</b> | Terpesan: <b className="text-foreground">{stock.reservedStock}</b>
                        </span>
                        <span className={stock.availableStock <= 0 ? "text-rose-500 font-semibold" : "text-emerald-600 font-semibold"}>
                          Tersedia: {stock.availableStock}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg border">
            <span className="text-xs font-medium text-muted-foreground">Estimasi Subtotal</span>
            <span className="font-mono text-sm font-bold text-foreground">
              IDR {calculateSubtotal().toLocaleString("id-ID")}
            </span>
          </div>

          <DialogFooter className="pt-2">
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
            <Button type="submit" size="sm" disabled={loading} className="text-xs gap-1.5">
              {loading && <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />}
              {isEdit ? "Perbarui Sales Order" : "Simpan Sales Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Sub-modal: Otorisasi PIN Force Create Sales Order */}
    <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlertIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Otorisasi Paksa Sales Order</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Stok tidak mencukupi. Masukkan 6 digit PIN untuk otorisasi pesanan (Backorder).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {pinError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-xs">
            {pinError}
          </div>
        )}

        {/* List of items that have shortage */}
        <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-xs border border-border/60">
          <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider block">
            Daftar Kekurangan Stok:
          </span>
          <div className="space-y-1.5">
            {insufficientList.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground">{item.name}</span>
                <div className="text-right">
                  <span className="text-muted-foreground">Tersedia: {item.available} | </span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">Diminta: {item.requested}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="so-pin-input" className="text-xs font-medium">
              PIN Keamanan 6 Digit *
            </Label>
            <Input
              id="so-pin-input"
              type="password"
              maxLength={6}
              placeholder="••••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              className="tracking-widest text-center text-2xl font-mono py-5"
              autoFocus
              required
            />
            <p className="text-[11px] text-muted-foreground text-center">
              Pesanan akan disetujui paksa via PIN. Surat jalan (pengiriman) tetap dibatasi oleh stok fisik riil.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPinModalOpen(false)}
              disabled={submittingPin}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submittingPin || pinInput.length !== 6}
              className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submittingPin && <Loader2Icon className="size-3.5 animate-spin" />}
              Otorisasi & Simpan SO
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
