import { useState, useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/components/theme-provider"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
  SunIcon,
  MoonIcon,
  CreditCardIcon,
  CheckCircle2Icon,
  ClockIcon,
  LandmarkIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PrinterIcon,
  CheckIcon,
} from "lucide-react"

interface PaymentItem {
  id: number
  paymentNo: string
  refInvoice: string
  date: string
  customerName: string
  paymentMethod: string
  bankAccount: string
  amount: number
  status: "Terverifikasi" | "Pending Kliring" | "Dibatalkan"
}

const DUMMY_PAYMENTS: PaymentItem[] = [
  { id: 1, paymentNo: "PAY-202609-001", refInvoice: "INV-202609-003", date: "2026-09-08", customerName: "PT John Doe", paymentMethod: "Transfer Bank", bankAccount: "BCA Giro Operasional (024-889123)", amount: 62000000, status: "Terverifikasi" },
  { id: 2, paymentNo: "PAY-202609-002", refInvoice: "INV-202609-002", date: "2026-09-07", customerName: "PT Sentosa Jaya", paymentMethod: "Transfer Bank", bankAccount: "Mandiri Corporate (120-00-98124)", amount: 20000000, status: "Terverifikasi" },
  { id: 3, paymentNo: "PAY-202609-003", refInvoice: "INV-202608-039", date: "2026-09-06", customerName: "Toko Sinar Terang", paymentMethod: "Cek / Bilyet Giro", bankAccount: "BCA Giro Operasional (024-889123)", amount: 12500000, status: "Terverifikasi" },
  { id: 4, paymentNo: "PAY-202609-004", refInvoice: "INV-202609-001", date: "2026-09-08", customerName: "PT Lorem Ipsum", paymentMethod: "Transfer Bank", bankAccount: "BRI Vault (001-441-239)", amount: 25000000, status: "Pending Kliring" },
  { id: 5, paymentNo: "PAY-202608-019", refInvoice: "INV-202608-025", date: "2026-08-29", customerName: "CV Berkah Mandiri", paymentMethod: "Transfer Bank", bankAccount: "Mandiri Corporate (120-00-98124)", amount: 15400000, status: "Terverifikasi" },
]

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function PaymentsPage() {
  const { theme, setTheme } = useTheme()
  const [payments, setPayments] = useState<PaymentItem[]>(DUMMY_PAYMENTS)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof PaymentItem>("date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 5

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description?: string
    variant?: "default" | "destructive" | "warning" | "success"
    onConfirm?: () => void
    confirmText?: string
    type?: "confirm" | "alert"
  }>({ open: false, title: "" })

  const [feedback, setFeedback] = useState<string | null>(null)

  // Metrics
  const totalSettled = payments.filter((p) => p.status === "Terverifikasi").reduce((acc, p) => acc + p.amount, 0)
  const verifiedCount = payments.filter((p) => p.status === "Terverifikasi").length
  const pendingAmount = payments.filter((p) => p.status === "Pending Kliring").reduce((acc, p) => acc + p.amount, 0)
  const topChannel = "BCA Giro (68%)"

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const matchesSearch =
          p.paymentNo.toLowerCase().includes(search.toLowerCase()) ||
          p.refInvoice.toLowerCase().includes(search.toLowerCase()) ||
          p.customerName.toLowerCase().includes(search.toLowerCase()) ||
          p.bankAccount.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "Semua" || p.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [payments, search, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredPayments.length / limit) || 1
  const paginatedPayments = filteredPayments.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof PaymentItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
  }

  const handleDeleteSingle = (id: number, no: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Catatan Pembayaran",
      description: `Apakah Anda yakin ingin membatalkan bukti bayar ${no}?`,
      variant: "destructive",
      onConfirm: () => {
        setPayments((prev) => prev.filter((p) => p.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Bukti bayar ${no} berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Pembayaran Terpilih",
      description: `Hapus ${selectedIds.length} rekaman pembayaran yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setPayments((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} bukti bayar berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedPayments.length > 0 && paginatedPayments.every((p) => selectedIds.includes(p.id))

  return (
    <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 cursor-pointer hover:bg-accent transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="cursor-pointer hover:text-foreground transition-colors">Mecca Distribution</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/sales-orders" className="cursor-pointer hover:text-foreground transition-colors">Penjualan</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Daftar Payments</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="cursor-pointer hover:bg-accent active:scale-95 transition-all"
          >
            {theme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4 text-slate-700" />}
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 space-y-6 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Penerimaan Pembayaran (Payments)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Rekonsiliasi mutasi kas masuk, pelunasan faktur, dan konfirmasi setoran bank.</p>
            </div>
          </div>

          {feedback && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckIcon className="size-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Kas Masuk (Settled)</span>
                <CreditCardIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(totalSettled)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Sudah efektif di rekening kas</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaksi Terverifikasi</span>
                <CheckCircle2Icon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{verifiedCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Kuitansi sah terbit</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Kliring</span>
                <ClockIcon className="size-4 text-amber-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{formatRupiah(pendingAmount)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Menunggu konfirmasi bank</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kanal Penerimaan Utama</span>
                <LandmarkIcon className="size-4 text-purple-500" />
              </div>
              <div className="mt-3 text-xl font-bold tracking-tight text-foreground">{topChannel}</div>
              <div className="mt-2 text-xs text-muted-foreground">Distribusi setoran tertinggi</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. Bayar, Invoice, Bank..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9 text-xs h-9"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-md px-2 py-1">
                  <FilterIcon className="size-3.5 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="Semua" className="bg-popover text-popover-foreground">Semua Status</option>
                    <option value="Terverifikasi" className="bg-popover text-popover-foreground">Terverifikasi</option>
                    <option value="Pending Kliring" className="bg-popover text-popover-foreground">Pending Kliring</option>
                    <option value="Dibatalkan" className="bg-popover text-popover-foreground">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    className="cursor-pointer active:scale-95 transition-all text-xs font-medium"
                  >
                    <Trash2Icon className="size-3.5 mr-1" />
                    Hapus ({selectedIds.length})
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmModal({
                      open: true,
                      title: "Export Rekap Kas Masuk",
                      description: "File rekonsiliasi pembayaran kas & bank (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File rekap pembayaran berhasil diunduh.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer hover:bg-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <DownloadIcon className="size-3.5 mr-1" />
                  Export
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setConfirmModal({
                      open: true,
                      title: "Catat Penerimaan Pembayaran",
                      description: "Buka formulir pencatatan setoran transfer bank atau giro bilyet dari pelanggan.",
                      variant: "default",
                      confirmText: "Catat Bayar",
                      onConfirm: () => {
                        setFeedback("Formulir penerimaan bayar siap diisi.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Catat Pembayaran
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(paginatedPayments.map((p) => p.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("paymentNo")}>
                      <div className="flex items-center gap-1">No. Pembayaran <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Ref Faktur</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Rekening Tujuan / Kas</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("amount")}>
                      <div className="flex items-center justify-end gap-1">Jumlah Bayar <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Tidak ada riwayat pembayaran yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((item) => {
                      const isSelected = selectedIds.includes(item.id)
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-muted/40 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds((prev) => [...prev, item.id])
                                } else {
                                  setSelectedIds((prev) => prev.filter((i) => i !== item.id))
                                }
                              }}
                              className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-semibold text-foreground">{item.paymentNo}</td>
                          <td className="p-3 text-muted-foreground">{item.date}</td>
                          <td className="p-3 font-mono text-muted-foreground">{item.refInvoice}</td>
                          <td className="p-3 font-medium text-foreground">{item.customerName}</td>
                          <td className="p-3 text-muted-foreground">
                            <div>{item.paymentMethod}</div>
                            <div className="text-[11px] font-mono text-muted-foreground">{item.bankAccount}</div>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(item.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Terverifikasi"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.status === "Pending Kliring"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setConfirmModal({
                                    open: true,
                                    title: `Detail Bukti Bayar ${item.paymentNo}`,
                                    description: `Pelunasan dari ${item.customerName} sebesar ${formatRupiah(item.amount)} via ${item.bankAccount}.`,
                                    variant: "default",
                                    confirmText: "Tutup",
                                    type: "alert",
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <EyeIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setConfirmModal({
                                    open: true,
                                    title: "Cetak Kuitansi Resmi",
                                    description: `Cetak dokumen format PDF untuk kuitansi pembayaran sah ${item.paymentNo}?`,
                                    variant: "default",
                                    confirmText: "Cetak PDF",
                                    onConfirm: () => {
                                      setFeedback(`Kuitansi ${item.paymentNo} berhasil dicetak.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <PrinterIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.paymentNo)}
                                className="cursor-pointer hover:bg-red-500/10 text-red-500 hover:text-red-600 active:scale-95 transition-all"
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredPayments.length)} dari {filteredPayments.length} data
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer active:scale-95 transition-all text-xs"
                >
                  <ChevronLeftIcon className="size-3.5 mr-1" />
                  Sebelumnya
                </Button>
                <span className="text-xs font-medium text-foreground px-2">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="cursor-pointer active:scale-95 transition-all text-xs"
                >
                  Selanjutnya
                  <ChevronRightIcon className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <ConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
          title={confirmModal.title}
          description={confirmModal.description}
          variant={confirmModal.variant}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
        />
      </SidebarInset>
  )
}
