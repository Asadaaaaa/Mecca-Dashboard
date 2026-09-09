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
  ReceiptIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertOctagonIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  SendIcon,
  CreditCardIcon,
  CheckIcon,
} from "lucide-react"

interface InvoiceItem {
  id: number
  invoiceNo: string
  refDelivery: string
  issueDate: string
  dueDate: string
  customerName: string
  totalAmount: number
  paidAmount: number
  status: "Lunas" | "Belum Dibayar" | "Sebagian" | "Jatuh Tempo"
}

const DUMMY_INVOICES: InvoiceItem[] = [
  { id: 1, invoiceNo: "INV-202609-001", refDelivery: "DO-202609-001", issueDate: "2026-09-08", dueDate: "2026-10-08", customerName: "PT Lorem Ipsum", totalAmount: 48500000, paidAmount: 0, status: "Belum Dibayar" },
  { id: 2, invoiceNo: "INV-202609-002", refDelivery: "DO-202609-002", issueDate: "2026-09-07", dueDate: "2026-10-07", customerName: "PT Sentosa Jaya", totalAmount: 34000000, paidAmount: 20000000, status: "Sebagian" },
  { id: 3, invoiceNo: "INV-202609-003", refDelivery: "DO-202609-003", issueDate: "2026-09-06", dueDate: "2026-09-20", customerName: "PT John Doe", totalAmount: 62000000, paidAmount: 62000000, status: "Lunas" },
  { id: 4, invoiceNo: "INV-202608-040", refDelivery: "DO-202608-032", issueDate: "2026-08-05", dueDate: "2026-09-04", customerName: "CV Berkah Mandiri", totalAmount: 22600000, paidAmount: 0, status: "Jatuh Tempo" },
  { id: 5, invoiceNo: "INV-202608-039", refDelivery: "DO-202608-030", issueDate: "2026-08-03", dueDate: "2026-09-02", customerName: "Toko Sinar Terang", totalAmount: 12500000, paidAmount: 12500000, status: "Lunas" },
  { id: 6, invoiceNo: "INV-202609-004", refDelivery: "DO-202609-006", issueDate: "2026-09-08", dueDate: "2026-09-22", customerName: "PT Jane Doe", totalAmount: 18200000, paidAmount: 0, status: "Belum Dibayar" },
]

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function InvoicesPage() {
  const { theme, setTheme } = useTheme()
  const [invoices, setInvoices] = useState<InvoiceItem[]>(DUMMY_INVOICES)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof InvoiceItem>("issueDate")
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
  const totalInvoiced = invoices.reduce((acc, i) => acc + i.totalAmount, 0)
  const totalPaid = invoices.reduce((acc, i) => acc + i.paidAmount, 0)
  const totalUnpaid = totalInvoiced - totalPaid
  const overdueCount = invoices.filter((i) => i.status === "Jatuh Tempo").length

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((i) => {
        const matchesSearch =
          i.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
          i.refDelivery.toLowerCase().includes(search.toLowerCase()) ||
          i.customerName.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "Semua" || i.status === statusFilter
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
  }, [invoices, search, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredInvoices.length / limit) || 1
  const paginatedInvoices = filteredInvoices.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof InvoiceItem) => {
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
      title: "Hapus Invoice Penjualan",
      description: `Apakah Anda yakin ingin membatalkan & menghapus tagihan invoice ${no}?`,
      variant: "destructive",
      onConfirm: () => {
        setInvoices((prev) => prev.filter((i) => i.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Invoice ${no} berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Invoice Terpilih",
      description: `Hapus ${selectedIds.length} invoice tagihan yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setInvoices((prev) => prev.filter((i) => !selectedIds.includes(i.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} invoice berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedInvoices.length > 0 && paginatedInvoices.every((i) => selectedIds.includes(i.id))

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
                  <BreadcrumbPage>Daftar Invoice</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Faktur Penjualan (Invoices)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Penerbitan faktur komersial, kontrol piutang usaha (AR), dan pemantauan masa jatuh tempo.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tagihan Terbit</span>
                <ReceiptIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(totalInvoiced)}</div>
              <div className="mt-2 text-xs text-muted-foreground">{invoices.length} faktur komersial</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Piutang Belum Terbayar</span>
                <ClockIcon className="size-4 text-amber-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{formatRupiah(totalUnpaid)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Menunggu pelunasan klien</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kas Piutang Tertagih</span>
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{formatRupiah(totalPaid)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Sudah masuk rekening kas</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faktur Overdue</span>
                <AlertOctagonIcon className="size-4 text-red-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{overdueCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Melewati tanggal jatuh tempo</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. Faktur, DO, customer..."
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
                    <option value="Lunas" className="bg-popover text-popover-foreground">Lunas</option>
                    <option value="Sebagian" className="bg-popover text-popover-foreground">Sebagian</option>
                    <option value="Belum Dibayar" className="bg-popover text-popover-foreground">Belum Dibayar</option>
                    <option value="Jatuh Tempo" className="bg-popover text-popover-foreground">Jatuh Tempo</option>
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
                      title: "Export Laporan Faktur Penjualan",
                      description: "File rekapitulasi piutang faktur (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File data faktur berhasil diunduh.")
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
                      title: "Terbitkan Faktur Baru",
                      description: "Generate faktur tagihan komersial baru berdasarkan Surat Jalan terkirim.",
                      variant: "default",
                      confirmText: "Buat Faktur",
                      onConfirm: () => {
                        setFeedback("Form faktur baru siap diisi.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Terbitkan Faktur
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
                            setSelectedIds(paginatedInvoices.map((i) => i.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("invoiceNo")}>
                      <div className="flex items-center gap-1">No. Faktur <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("issueDate")}>
                      <div className="flex items-center gap-1">Tanggal Terbit <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Jatuh Tempo</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("totalAmount")}>
                      <div className="flex items-center justify-end gap-1">Total Tagihan <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 text-right">Terbayar</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Tidak ada faktur tagihan yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((item) => {
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
                            <div>{item.invoiceNo}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">Ref: {item.refDelivery}</div>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.issueDate}</td>
                          <td className="p-3 text-muted-foreground font-mono">{item.dueDate}</td>
                          <td className="p-3 font-medium text-foreground">{item.customerName}</td>
                          <td className="p-3 text-right font-mono font-semibold text-foreground">
                            {formatRupiah(item.totalAmount)}
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(item.paidAmount)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Lunas"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.status === "Sebagian"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                  : item.status === "Belum Dibayar"
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
                                    title: `Detail Faktur ${item.invoiceNo}`,
                                    description: `Tagihan kepada ${item.customerName} sebesar ${formatRupiah(item.totalAmount)}. Terbayar: ${formatRupiah(item.paidAmount)}.`,
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
                                    title: "Kirim Tagihan Invoice",
                                    description: `Kirim salinan e-Invoice ${item.invoiceNo} ke kontak keuangan ${item.customerName}?`,
                                    variant: "default",
                                    confirmText: "Kirim Tagihan",
                                    onConfirm: () => {
                                      setFeedback(`Faktur ${item.invoiceNo} berhasil dikirim ke klien.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <SendIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setConfirmModal({
                                    open: true,
                                    title: "Catat Penerimaan Pembayaran",
                                    description: `Input pembayaran kas / transfer bank untuk invoice ${item.invoiceNo}?`,
                                    variant: "default",
                                    confirmText: "Buka Form Bayar",
                                    onConfirm: () => {
                                      setFeedback(`Form pembayaran untuk ${item.invoiceNo} siap.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-emerald-600 hover:text-emerald-700 active:scale-95 transition-all"
                              >
                                <CreditCardIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.invoiceNo)}
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredInvoices.length)} dari {filteredInvoices.length} data
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
