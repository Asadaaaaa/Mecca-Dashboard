import { useState, useEffect, useCallback } from "react"
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
import { paymentService } from "@/services/payment.service"
import { PaymentDialog } from "@/pages/sales/payment-dialog"
import type { Payment, PaymentMetrics } from "@/types/payment.types"
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
  Loader2Icon,
  AlertTriangleIcon,
  Building2Icon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

function formatRupiah(amount: number | string | undefined) {
  const val = typeof amount === "string" ? parseFloat(amount) || 0 : amount || 0
  return `IDR ${val.toLocaleString("id-ID")}`
}

function terbilangRupiah(angka: number): string {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ]

  const n = Math.floor(Math.abs(angka))

  if (n < 12) return bilangan[n]
  if (n < 20) return `${bilangan[n - 10]} Belas`
  if (n < 100) return `${bilangan[Math.floor(n / 10)]} Puluh ${bilangan[n % 10]}`.trim()
  if (n < 200) return `Seratus ${terbilangRupiah(n - 100)}`.trim()
  if (n < 1000) return `${bilangan[Math.floor(n / 100)]} Ratus ${terbilangRupiah(n % 100)}`.trim()
  if (n < 2000) return `Seribu ${terbilangRupiah(n - 1000)}`.trim()
  if (n < 1000000) return `${terbilangRupiah(Math.floor(n / 1000))} Ribu ${terbilangRupiah(n % 1000)}`.trim()
  if (n < 1000000000) return `${terbilangRupiah(Math.floor(n / 1000000))} Juta ${terbilangRupiah(n % 1000000)}`.trim()
  if (n < 1000000000000) return `${terbilangRupiah(Math.floor(n / 1000000000))} Miliar ${terbilangRupiah(n % 1000000000)}`.trim()
  return `${terbilangRupiah(Math.floor(n / 1000000000000))} Triliun ${terbilangRupiah(n % 1000000000000)}`.trim()
}

export default function PaymentsPage() {
  const { theme, setTheme } = useTheme()
  const [payments, setPayments] = useState<Payment[]>([])
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalSettled: 0,
    verifiedCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    topChannel: "-",
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [methodFilter, setMethodFilter] = useState("Semua")
  const [sortField, setSortField] = useState("payment_date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<Payment | null>(null)
  const [printItem, setPrintItem] = useState<Payment | null>(null)

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
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, metricsRes] = await Promise.all([
        paymentService.getPayments({
          page,
          limit,
          search: search || undefined,
          status: statusFilter !== "Semua" ? statusFilter : undefined,
          payment_method: methodFilter !== "Semua" ? methodFilter : undefined,
          sort: sortField,
          order: sortOrder,
        }),
        paymentService.getPaymentMetrics(),
      ])

      setPayments(listRes.items || [])
      setTotalPages(listRes.pagination?.totalPages || 1)
      setTotalCount(listRes.pagination?.total || 0)
      setMetrics(metricsRes)
    } catch {
      setErrorFeedback("Gagal memuat data penerimaan pembayaran.")
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, methodFilter, sortField, sortOrder])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (field: string) => {
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
      title: "Hapus Pembayaran",
      description: `Apakah Anda yakin ingin membatalkan & menghapus transaksi pembayaran ${no}? Alokasi tagihan faktur akan dikembalikan secara otomatis.`,
      variant: "destructive",
      confirmText: "Hapus Pembayaran",
      onConfirm: async () => {
        try {
          await paymentService.deletePayment(id)
          setSelectedIds((prev) => prev.filter((i) => i !== id))
          setFeedback(`Pembayaran ${no} berhasil dihapus dan saldo faktur telah diperbarui.`)
          fetchData()
        } catch {
          setErrorFeedback("Gagal menghapus pembayaran.")
        }
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Pembayaran Terpilih",
      description: `Hapus ${selectedIds.length} transaksi pembayaran yang dipilih? Saldo faktur terkait akan dikembalikan.`,
      variant: "destructive",
      confirmText: "Hapus Semua",
      onConfirm: async () => {
        try {
          await paymentService.batchDeletePayments(selectedIds)
          setSelectedIds([])
          setFeedback(`${selectedIds.length} pembayaran berhasil dihapus.`)
          fetchData()
        } catch {
          setErrorFeedback("Gagal menghapus beberapa pembayaran.")
        }
      },
    })
  }

  const handleExportCSV = () => {
    if (payments.length === 0) {
      setErrorFeedback("Tidak ada data pembayaran untuk diekspor.")
      return
    }

    const headers = [
      "No. Pembayaran",
      "Tanggal",
      "Customer",
      "Nominal",
      "Metode Pembayaran",
      "Rekening / Akun",
      "No. Referensi",
      "Faktur Teralokasi",
      "Status",
    ]

    const rows = payments.map((p) => [
      p.paymentNo,
      p.date,
      `"${(p.customerName || "").replace(/"/g, '""')}"`,
      p.amount,
      p.paymentMethod,
      `"${(p.bankAccount || "").replace(/"/g, '""')}"`,
      p.referenceNumber || "-",
      `"${(p.refInvoice || "").replace(/"/g, '""')}"`,
      p.status,
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `Laporan_Penerimaan_Pembayaran_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setFeedback("File laporan pembayaran berhasil diunduh (.csv)")
    setTimeout(() => setFeedback(null), 3000)
  }

  const isAllSelected = payments.length > 0 && payments.every((p) => selectedIds.includes(p.id))

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
                <BreadcrumbPage>Daftar Penerimaan Pembayaran</BreadcrumbPage>
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
            <p className="text-xs text-muted-foreground mt-0.5">Pencatatan kas masuk, setoran transfer perbankan, kliring giro, dan alokasi pelunasan invoice.</p>
          </div>
        </div>

        {feedback && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckIcon className="size-4" />
            <span>{feedback}</span>
          </div>
        )}

        {errorFeedback && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
            <AlertTriangleIcon className="size-4" />
            <span>{errorFeedback}</span>
          </div>
        )}

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Kas Terverifikasi</span>
              <CheckCircle2Icon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">
              {formatRupiah(metrics.totalSettled)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{metrics.verifiedCount} transaksi telah settlement</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Kliring / Giro</span>
              <ClockIcon className="size-4 text-amber-500" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">
              {formatRupiah(metrics.pendingAmount)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{metrics.pendingCount} setoran menunggu kliring bank</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Bukti Bayar Masuk</span>
              <CreditCardIcon className="size-4 text-muted-foreground/70" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              {metrics.verifiedCount + metrics.pendingCount}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Transaksi penerimaan tercatat</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saluran Kas Terbanyak</span>
              <LandmarkIcon className="size-4 text-indigo-500" />
            </div>
            <div className="mt-3 text-sm font-bold tracking-tight text-indigo-700 dark:text-indigo-400 truncate" title={metrics.topChannel}>
              {metrics.topChannel}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Dominasi saluran pembayaran masuk</div>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari No. Bayar, Customer, No. Cek..."
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

              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-md px-2 py-1">
                <select
                  value={methodFilter}
                  onChange={(e) => {
                    setMethodFilter(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-popover text-popover-foreground">Semua Metode</option>
                  <option value="Transfer Bank" className="bg-popover text-popover-foreground">Transfer Bank</option>
                  <option value="Tunai / Kas" className="bg-popover text-popover-foreground">Tunai / Kas</option>
                  <option value="Cek / Bilyet Giro" className="bg-popover text-popover-foreground">Cek / Bilyet Giro</option>
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
                onClick={handleExportCSV}
                className="cursor-pointer hover:bg-accent active:scale-95 transition-all text-xs font-medium"
              >
                <DownloadIcon className="size-3.5 mr-1" />
                Export CSV
              </Button>

              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
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
                          setSelectedIds(payments.map((p) => p.id))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                      className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("payment_number")}>
                    <div className="flex items-center gap-1">No. Bukti Bayar <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("payment_date")}>
                    <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Metode & Rekening Bank</th>
                  <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("amount")}>
                    <div className="flex items-center justify-end gap-1">Jumlah Masuk <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3">Alokasi Faktur</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2Icon className="size-4 animate-spin text-primary" />
                        <span>Memuat data pembayaran...</span>
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Tidak ada catatan transaksi pembayaran yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  payments.map((item) => {
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
                        <td className="p-3 font-mono font-semibold text-foreground">
                          <div>{item.paymentNo}</div>
                          {item.referenceNumber && item.referenceNumber !== "-" && (
                            <div className="text-[10px] text-muted-foreground font-mono">Ref: {item.referenceNumber}</div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">{item.date}</td>
                        <td className="p-3 font-medium text-foreground">
                          <div>{item.customerName}</div>
                          {item.customerPhone && item.customerPhone !== "-" && (
                            <div className="text-[10px] text-muted-foreground">{item.customerPhone}</div>
                          )}
                        </td>
                        <td className="p-3 text-foreground">
                          <div className="font-semibold">{item.paymentMethod}</div>
                          <div className="text-[10px] text-muted-foreground">{item.bankAccount}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-foreground">
                          {item.refInvoice && item.refInvoice !== "-" ? (
                            <div className="flex flex-wrap gap-1">
                              {item.refInvoice.split(", ").map((inv, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted border text-[10px]"
                                >
                                  {inv}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Uang Muka / Belum dialokasikan</span>
                          )}
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
                            {/* Detail Preview */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPreviewItem(item)}
                              title="Lihat Detail Pembayaran"
                              className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>

                            {/* Print Kuitansi */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPrintItem(item)}
                              title="Cetak Kuitansi Resmi"
                              className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <PrinterIcon className="size-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteSingle(item.id, item.paymentNo)}
                              title="Hapus Pembayaran"
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
              Menampilkan {totalCount === 0 ? 0 : (page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} dari {totalCount} data
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
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
                disabled={page >= totalPages || loading}
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

      {/* Payment Creation Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setFeedback("Pembayaran kas masuk berhasil dicatat dan faktur telah teralokasikan!")
          setTimeout(() => setFeedback(null), 3500)
          fetchData()
        }}
      />

      {/* Preview Payment Detail Dialog */}
      {previewItem && (
        <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center justify-between">
                <span>Rincian Pembayaran: {previewItem.paymentNo}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    previewItem.status === "Terverifikasi"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : previewItem.status === "Pending Kliring"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {previewItem.status}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Customer: {previewItem.customerName} | Tanggal: {previewItem.date}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground">Jumlah Pembayaran: </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatRupiah(previewItem.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tanggal Setor: </span>
                  <span className="font-semibold text-foreground font-mono">{previewItem.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Metode Pembayaran: </span>
                  <span className="font-semibold text-foreground">{previewItem.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rekening Penampung: </span>
                  <span className="font-semibold text-foreground">{previewItem.bankAccount || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nomor Referensi: </span>
                  <span className="font-semibold text-foreground font-mono">{previewItem.referenceNumber || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Diterima Oleh: </span>
                  <span className="font-semibold text-foreground">{previewItem.creator || "Kasir / Finance"}</span>
                </div>
                {previewItem.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Catatan: </span>
                    <span className="text-foreground">{previewItem.notes}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-2">
                  Daftar Faktur yang Dilunasi (Alokasi)
                </div>
                <div className="border rounded-md divide-y overflow-hidden">
                  <div className="grid grid-cols-12 bg-muted/40 p-2 font-semibold text-[10px] text-muted-foreground uppercase">
                    <div className="col-span-4">No. Faktur</div>
                    <div className="col-span-3 text-right">Total Faktur</div>
                    <div className="col-span-3 text-right">Nominal Alokasi</div>
                    <div className="col-span-2 text-center">Status</div>
                  </div>
                  {previewItem.allocations && previewItem.allocations.length > 0 ? (
                    previewItem.allocations.map((a, idx) => (
                      <div key={idx} className="grid grid-cols-12 p-2.5 items-center">
                        <div className="col-span-4">
                          <div className="font-mono font-semibold text-foreground">{a.invoiceNo}</div>
                          <div className="text-[10px] text-muted-foreground">JT: {a.dueDate || "-"}</div>
                        </div>
                        <div className="col-span-3 text-right font-mono text-muted-foreground">
                          {formatRupiah(a.grandTotal)}
                        </div>
                        <div className="col-span-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(a.allocatedAmount)}
                        </div>
                        <div className="col-span-2 text-center">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              a.status === "Lunas"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      Pembayaran ini belum dialokasikan ke faktur spesifik (Uang Muka Pelanggan).
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPrintItem(previewItem)
                  setPreviewItem(null)
                }}
              >
                <PrinterIcon className="size-3.5 mr-1" />
                Cetak Kuitansi
              </Button>
              <Button size="sm" variant="default" onClick={() => setPreviewItem(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Kuitansi Resmi Modal */}
      {printItem && (
        <Dialog open={Boolean(printItem)} onOpenChange={(open) => !open && setPrintItem(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[92vh] overflow-y-auto">
            <div className="p-6 border border-dashed rounded-lg bg-white text-slate-900 font-sans space-y-5">
              {/* Header Kuitansi */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2Icon className="size-5 text-emerald-700" />
                    <h2 className="text-xl font-black tracking-tight text-slate-900">MECCA DISTRIBUTION</h2>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">PT Mecca Distribusi Solusindo</p>
                  <p className="text-[11px] text-slate-500">Kawasan Pergudangan Cakung Blok B No. 12, Jakarta Timur</p>
                  <p className="text-[11px] text-slate-500">Telp: (021) 8899-7700 | Email: finance@mecca.co.id</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black uppercase tracking-wider text-emerald-900">KUITANSI PEMBAYARAN</div>
                  <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">No: {printItem.paymentNo}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Tanggal: <span className="font-mono font-medium">{printItem.date}</span></div>
                </div>
              </div>

              {/* Main Receipt Content */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-100">
                  <div className="col-span-3 text-slate-500 font-medium">Telah Terima Dari</div>
                  <div className="col-span-9 font-bold text-slate-900 uppercase">: {printItem.customerName}</div>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-100">
                  <div className="col-span-3 text-slate-500 font-medium">Uang Sejumlah</div>
                  <div className="col-span-9 font-semibold text-slate-800 italic bg-slate-50 p-2 rounded border border-slate-200">
                    "{terbilangRupiah(printItem.amount)} Rupiah"
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-100">
                  <div className="col-span-3 text-slate-500 font-medium">Untuk Pembayaran</div>
                  <div className="col-span-9 text-slate-800">
                    : Pelunasan Faktur Penjualan (Invoices):
                    <div className="mt-1 font-mono font-semibold text-emerald-800">
                      {printItem.refInvoice || "Pembayaran Uang Muka / Deposit Penjualan"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-100">
                  <div className="col-span-3 text-slate-500 font-medium">Metode / Penampung</div>
                  <div className="col-span-9 text-slate-800">
                    : {printItem.paymentMethod} {printItem.bankAccount ? `(${printItem.bankAccount})` : ""}
                    {printItem.referenceNumber && ` | No. Ref: ${printItem.referenceNumber}`}
                  </div>
                </div>
              </div>

              {/* Table of Allocations if any */}
              {printItem.allocations && printItem.allocations.length > 0 && (
                <div>
                  <div className="font-bold text-[10px] text-slate-700 uppercase tracking-wider mb-1.5">
                    Rincian Alokasi Faktur
                  </div>
                  <table className="w-full text-xs border text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border text-center w-10">No.</th>
                        <th className="p-2 border">No. Faktur</th>
                        <th className="p-2 border text-right">Tagihan Faktur</th>
                        <th className="p-2 border text-right">Nominal Dilunasi</th>
                        <th className="p-2 border text-center">Status Faktur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printItem.allocations.map((a, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 border text-center">{idx + 1}</td>
                          <td className="p-2 border font-mono font-medium">{a.invoiceNo}</td>
                          <td className="p-2 border text-right font-mono">{formatRupiah(a.grandTotal)}</td>
                          <td className="p-2 border text-right font-mono font-bold text-slate-900">
                            {formatRupiah(a.allocatedAmount)}
                          </td>
                          <td className="p-2 border text-center font-medium text-emerald-700">{a.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Amount Box & Signatures */}
              <div className="grid grid-cols-2 gap-4 items-end pt-4">
                <div>
                  <div className="inline-block bg-slate-100 border-2 border-slate-400 rounded-lg px-4 py-2 text-base font-black text-slate-900 font-mono">
                    TERBILANG: {formatRupiah(printItem.amount)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    * Dokumen ini sah dan diterbitkan secara resmi melalui sistem terpadu Mecca Distribution.
                  </p>
                </div>

                <div className="text-center text-xs">
                  <div className="text-slate-500 mb-12">Jakarta, {printItem.date}<br />Bagian Keuangan & Kasir,</div>
                  <div className="border-t border-slate-400 mx-10 pt-1 text-slate-800 font-medium">
                    ( {printItem.creator || "Finance Dept."} )
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setPrintItem(null)}>
                Tutup
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <PrinterIcon className="size-3.5 mr-1.5" />
                Cetak Kuitansi (Print)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Modal */}
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
