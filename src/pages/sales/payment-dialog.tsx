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
import { paymentService } from "@/services/payment.service"
import { customerService } from "@/services/customer.service"
import { invoiceService } from "@/services/invoice.service"
import type { Customer } from "@/types/customer.types"
import type { Invoice } from "@/types/invoice.types"
import { Loader2Icon, CreditCardIcon, AlertTriangleIcon } from "lucide-react"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preselectedCustomerId?: number | null
  preselectedInvoiceId?: number | null
}

interface AllocationRow {
  invoice_id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  grand_total: number
  paid_amount: number
  remaining_amount: number
  allocated_amount: number
}

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export function PaymentDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedCustomerId,
  preselectedInvoiceId,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingInvoices, setFetchingInvoices] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState<number | "">("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState<number | "">("")
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank")
  const [bankAccount, setBankAccount] = useState("BCA Giro Operasional (024-889123)")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [status, setStatus] = useState("Terverifikasi")
  const [notes, setNotes] = useState("")

  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([])

  useEffect(() => {
    if (open) {
      setError(null)
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setPaymentMethod("Transfer Bank")
      setBankAccount("BCA Giro Operasional (024-889123)")
      setReferenceNumber("")
      setStatus("Terverifikasi")
      setNotes("")
      setAmount("")

      // Load customers
      customerService.getCustomers({ limit: 100 }).then((res) => {
        const list = res.items || []
        setCustomers(list)

        const defaultCustId = preselectedCustomerId || (list.length > 0 ? list[0].id : "")
        setCustomerId(defaultCustId)
        if (defaultCustId) {
          loadInvoicesForCustomer(Number(defaultCustId), preselectedInvoiceId)
        }
      }).catch(() => {})
    }
  }, [open, preselectedCustomerId, preselectedInvoiceId])

  const loadInvoicesForCustomer = async (cId: number, targetInvoiceId?: number | null) => {
    setFetchingInvoices(true)
    try {
      const res = await invoiceService.getInvoices({ customer_id: cId, limit: 100 })
      const unpaidInvoices = (res.items || []).filter((i: Invoice) => i.status !== "Lunas")

      const rows: AllocationRow[] = unpaidInvoices.map((inv: Invoice) => {
        const remaining = Math.max(0, inv.totalAmount - inv.paidAmount)
        const isPreselected = targetInvoiceId && inv.id === targetInvoiceId
        return {
          invoice_id: inv.id,
          invoice_number: inv.invoiceNo,
          invoice_date: inv.issueDate,
          due_date: inv.dueDate,
          grand_total: inv.totalAmount,
          paid_amount: inv.paidAmount,
          remaining_amount: remaining,
          allocated_amount: isPreselected ? remaining : 0,
        }
      })

      setAllocationRows(rows)

      if (targetInvoiceId) {
        const target = rows.find((r) => r.invoice_id === targetInvoiceId)
        if (target) {
          setAmount(target.remaining_amount)
        }
      }
    } catch {
      setError("Gagal memuat faktur tagihan untuk customer ini.")
    } finally {
      setFetchingInvoices(false)
    }
  }

  const handleCustomerChange = (newCId: number | "") => {
    setCustomerId(newCId)
    if (newCId) {
      loadInvoicesForCustomer(Number(newCId))
    } else {
      setAllocationRows([])
    }
  }

  const handleAllocationChange = (index: number, val: number) => {
    const updated = [...allocationRows]
    const row = updated[index]
    const clamped = Math.max(0, Math.min(val, row.remaining_amount))
    updated[index] = {
      ...row,
      allocated_amount: clamped,
    }
    setAllocationRows(updated)
  }

  const handleAllocateFull = (index: number) => {
    const updated = [...allocationRows]
    const row = updated[index]

    const totalBayar = Number(amount) || 0
    const alreadyAllocatedOther = updated.reduce(
      (sum, r, idx) => (idx !== index ? sum + r.allocated_amount : sum),
      0
    )
    const available = Math.max(0, totalBayar - alreadyAllocatedOther)
    const fillAmount = totalBayar > 0 ? Math.min(available, row.remaining_amount) : row.remaining_amount

    updated[index] = {
      ...row,
      allocated_amount: fillAmount,
    }
    setAllocationRows(updated)
  }

  const totalAllocated = allocationRows.reduce((sum, r) => sum + (r.allocated_amount || 0), 0)
  const paymentAmountNum = Number(amount) || 0
  const unallocatedBalance = paymentAmountNum - totalAllocated
  const isOverAllocated = totalAllocated > paymentAmountNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!customerId) {
      setError("Pilih customer terlebih dahulu.")
      setLoading(false)
      return
    }

    if (paymentAmountNum <= 0) {
      setError("Nominal pembayaran harus lebih besar dari 0.")
      setLoading(false)
      return
    }

    if (isOverAllocated) {
      setError(`Total alokasi (${formatRupiah(totalAllocated)}) melebihi nominal pembayaran (${formatRupiah(paymentAmountNum)}).`)
      setLoading(false)
      return
    }

    const activeAllocations = allocationRows
      .filter((r) => r.allocated_amount > 0)
      .map((r) => ({
        invoice_id: r.invoice_id,
        allocated_amount: r.allocated_amount,
      }))

    try {
      await paymentService.createPayment({
        customer_id: Number(customerId),
        payment_date: paymentDate,
        amount: paymentAmountNum,
        payment_method: paymentMethod,
        bank_account: bankAccount || null,
        reference_number: referenceNumber || null,
        status: status,
        notes: notes || undefined,
        allocations: activeAllocations,
      })

      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal mencatat pembayaran.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCardIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Catat Penerimaan Pembayaran</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Input setoran kas/bank dari pelanggan dan alokasikan pelunasan ke faktur-faktur terkait.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-xs flex items-center gap-2">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Header Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Customer (Pelanggan) *</Label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                required
              >
                <option value="">-- Pilih Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tanggal Pembayaran *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nominal Pembayaran (IDR) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="cth. 15000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                className="text-xs h-9 font-mono font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Metode Pembayaran</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Tunai / Kas">Tunai / Kas</option>
                <option value="Cek / Bilyet Giro">Cek / Bilyet Giro</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rekening Bank / Kas Penampung</Label>
              <select
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="BCA Giro Operasional (024-889123)">BCA Giro Operasional (024-889123)</option>
                <option value="Mandiri Corporate (120-00-98124)">Mandiri Corporate (120-00-98124)</option>
                <option value="BRI Vault (001-441-239)">BRI Vault (001-441-239)</option>
                <option value="Kas Operasional Tunai">Kas Operasional Tunai</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nomor Referensi / No. Bukti Transfer</Label>
              <Input
                placeholder="cth. TRF-2026-9901 atau No. Cek"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status Verifikasi</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="Terverifikasi">Terverifikasi (Dana Masuk / Lunas)</option>
                <option value="Pending Kliring">Pending Kliring (Kliring Bank / Giro)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Catatan Pembayaran</Label>
              <Input
                placeholder="Catatan pelunasan, perihal pembayaran, atau keterangan transfer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Invoices Allocation Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Alokasi Pelunasan Faktur (Invoices)</span>
                <p className="text-[11px] text-muted-foreground">Tentukan nominal pelunasan untuk setiap tagihan terbuka</p>
              </div>
              {allocationRows.length > 0 && paymentAmountNum > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    let sisa = paymentAmountNum
                    const updated = allocationRows.map((r) => {
                      if (sisa <= 0) return { ...r, allocated_amount: 0 }
                      const alokasi = Math.min(sisa, r.remaining_amount)
                      sisa -= alokasi
                      return { ...r, allocated_amount: alokasi }
                    })
                    setAllocationRows(updated)
                  }}
                  className="text-[11px] h-7 cursor-pointer"
                >
                  Auto Alokasi FIFO
                </Button>
              )}
            </div>

            {fetchingInvoices ? (
              <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
                <Loader2Icon className="size-4 animate-spin inline mr-2 text-primary" />
                Memuat daftar faktur tagihan customer...
              </div>
            ) : allocationRows.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                Tidak ada faktur terbuka (belum lunas) untuk customer ini. Pembayaran dapat dicatat sebagai uang muka / deposit jika diperlukan.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden divide-y text-xs">
                <div className="grid grid-cols-12 bg-muted/50 p-2 text-[10px] font-semibold text-muted-foreground uppercase">
                  <div className="col-span-4">No. Faktur</div>
                  <div className="col-span-3 text-right">Sisa Tagihan</div>
                  <div className="col-span-4 text-right">Nominal Alokasi</div>
                  <div className="col-span-1 text-center">Aksi</div>
                </div>

                {allocationRows.map((row, idx) => (
                  <div key={row.invoice_id} className="grid grid-cols-12 p-2.5 items-center gap-2">
                    <div className="col-span-4">
                      <div className="font-mono font-semibold text-foreground">{row.invoice_number}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Tgl: {row.invoice_date} | JT: {row.due_date}
                      </div>
                    </div>

                    <div className="col-span-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-500">
                      {formatRupiah(row.remaining_amount)}
                    </div>

                    <div className="col-span-4">
                      <Input
                        type="number"
                        min="0"
                        max={row.remaining_amount}
                        value={row.allocated_amount || ""}
                        onChange={(e) => handleAllocationChange(idx, e.target.value ? Number(e.target.value) : 0)}
                        placeholder="0"
                        className="text-xs h-8 text-right font-mono font-semibold"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAllocateFull(idx)}
                        title="Alokasi Penuh"
                        className="h-8 px-1.5 text-[10px] text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        Penuh
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Allocation Summary Bar */}
            <div className="p-3 bg-muted/40 rounded-lg border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Penerimaan Dana:</span>
                <span className="font-mono font-bold text-foreground">{formatRupiah(paymentAmountNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Teralokasi ke Faktur:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(totalAllocated)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sisa Dana Belum Teralokasi:</span>
                <span
                  className={`font-mono font-bold ${
                    isOverAllocated
                      ? "text-red-600 dark:text-red-400"
                      : unallocatedBalance === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-500"
                  }`}
                >
                  {formatRupiah(unallocatedBalance)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || paymentAmountNum <= 0 || isOverAllocated}
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading && <Loader2Icon className="size-3.5 animate-spin mr-1.5" />}
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
