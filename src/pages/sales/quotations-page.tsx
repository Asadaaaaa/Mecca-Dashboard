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
  FileTextIcon,
  DollarSignIcon,
  CheckCircle2Icon,
  PercentIcon,
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
  CheckIcon,
} from "lucide-react"

interface QuotationItem {
  id: number
  quotationNo: string
  date: string
  validUntil: string
  customerName: string
  salesRep: string
  totalAmount: number
  status: "Disetujui" | "Terkirim" | "Draft" | "Kedaluwarsa"
}

const DUMMY_QUOTATIONS: QuotationItem[] = [
  { id: 1, quotationNo: "QT-202609-001", date: "2026-09-08", validUntil: "2026-09-22", customerName: "PT Lorem Ipsum", salesRep: "Ahmad Syarif", totalAmount: 48500000, status: "Disetujui" },
  { id: 2, quotationNo: "QT-202609-002", date: "2026-09-07", validUntil: "2026-09-21", customerName: "PT John Doe", salesRep: "Rian Pratama", totalAmount: 72000000, status: "Terkirim" },
  { id: 3, quotationNo: "QT-202609-003", date: "2026-09-06", validUntil: "2026-09-20", customerName: "PT Jane Doe", salesRep: "Dewi Lestari", totalAmount: 18200000, status: "Draft" },
  { id: 4, quotationNo: "QT-202609-004", date: "2026-09-05", validUntil: "2026-09-19", customerName: "PT Sentosa Jaya", salesRep: "Ahmad Syarif", totalAmount: 34000000, status: "Disetujui" },
  { id: 5, quotationNo: "QT-202609-005", date: "2026-09-03", validUntil: "2026-09-17", customerName: "CV Berkah Mandiri", salesRep: "Rian Pratama", totalAmount: 22600000, status: "Terkirim" },
  { id: 6, quotationNo: "QT-202608-028", date: "2026-08-20", validUntil: "2026-09-03", customerName: "PT Sumber Rejeki", salesRep: "Dewi Lestari", totalAmount: 61000000, status: "Kedaluwarsa" },
  { id: 7, quotationNo: "QT-202608-027", date: "2026-08-18", validUntil: "2026-09-01", customerName: "Toko Sinar Terang", salesRep: "Ahmad Syarif", totalAmount: 12500000, status: "Disetujui" },
]

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function QuotationsPage() {
  const { theme, setTheme } = useTheme()
  const [quotations, setQuotations] = useState<QuotationItem[]>(DUMMY_QUOTATIONS)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof QuotationItem>("date")
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
  const totalQuotations = quotations.length
  const totalPipeline = quotations.reduce((acc, q) => acc + q.totalAmount, 0)
  const approvedCount = quotations.filter((q) => q.status === "Disetujui").length
  const winRate = ((approvedCount / totalQuotations) * 100).toFixed(1)

  const filteredQuotations = useMemo(() => {
    return quotations
      .filter((q) => {
        const matchesSearch =
          q.quotationNo.toLowerCase().includes(search.toLowerCase()) ||
          q.customerName.toLowerCase().includes(search.toLowerCase()) ||
          q.salesRep.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "Semua" || q.status === statusFilter
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
  }, [quotations, search, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredQuotations.length / limit) || 1
  const paginatedQuotations = filteredQuotations.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof QuotationItem) => {
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
      title: "Hapus Penawaran Harga",
      description: `Apakah Anda yakin ingin menghapus quotation ${no}?`,
      variant: "destructive",
      onConfirm: () => {
        setQuotations((prev) => prev.filter((q) => q.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Quotation ${no} berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Quotation Terpilih",
      description: `Hapus ${selectedIds.length} penawaran harga yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setQuotations((prev) => prev.filter((q) => !selectedIds.includes(q.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} quotation berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedQuotations.length > 0 && paginatedQuotations.every((q) => selectedIds.includes(q.id))

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
                  <BreadcrumbPage>Daftar Penawaran Penjualan</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Penawaran Penjualan (Quotations)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Kelola proposal penawaran harga kepada calon pembeli sebelum dikonversi menjadi pesanan (Sales Order).</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Penawaran</span>
                <FileTextIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalQuotations}</div>
              <div className="mt-2 text-xs text-muted-foreground">Proposal harga dibuat</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nilai Pipeline</span>
                <DollarSignIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(totalPipeline)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Total potensi nilai omzet</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Penawaran Deal</span>
                <CheckCircle2Icon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{approvedCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Disetujui menjadi Sales Order</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closing Rate</span>
                <PercentIcon className="size-4 text-purple-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{winRate}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Rasio konversi quotation ke order</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. QT, customer, sales..."
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
                    <option value="Disetujui" className="bg-popover text-popover-foreground">Disetujui</option>
                    <option value="Terkirim" className="bg-popover text-popover-foreground">Terkirim</option>
                    <option value="Draft" className="bg-popover text-popover-foreground">Draft</option>
                    <option value="Kedaluwarsa" className="bg-popover text-popover-foreground">Kedaluwarsa</option>
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
                      title: "Export Data Penawaran",
                      description: "File rekap quotation (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File data penawaran berhasil diunduh.")
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
                      title: "Buat Penawaran Penjualan Baru",
                      description: "Buka formulir pembuatan quotation harga untuk prospek pelanggan.",
                      variant: "default",
                      confirmText: "Buat QT",
                      onConfirm: () => {
                        setFeedback("Formulir penawaran baru siap diisi.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Buat Penawaran
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
                            setSelectedIds(paginatedQuotations.map((q) => q.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("quotationNo")}>
                      <div className="flex items-center gap-1">No. Penawaran <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Sales Person</th>
                    <th className="p-3">Masa Berlaku</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("totalAmount")}>
                      <div className="flex items-center justify-end gap-1">Nilai Penawaran <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Tidak ada penawaran penjualan yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedQuotations.map((item) => {
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
                          <td className="p-3 font-mono font-semibold text-foreground">{item.quotationNo}</td>
                          <td className="p-3 text-muted-foreground">{item.date}</td>
                          <td className="p-3 font-medium text-foreground">{item.customerName}</td>
                          <td className="p-3 text-muted-foreground">{item.salesRep}</td>
                          <td className="p-3 text-muted-foreground">{item.validUntil}</td>
                          <td className="p-3 text-right font-mono font-semibold text-foreground">
                            {formatRupiah(item.totalAmount)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Disetujui"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.status === "Terkirim"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                  : item.status === "Draft"
                                  ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
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
                                    title: `Pratinjau Quotation ${item.quotationNo}`,
                                    description: `Penawaran untuk ${item.customerName} sebesar ${formatRupiah(item.totalAmount)}. Masa berlaku hingga ${item.validUntil}.`,
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
                                    title: "Kirim Quotation ke Klien",
                                    description: `Kirim dokumen penawaran ${item.quotationNo} ke email PIC ${item.customerName}?`,
                                    variant: "default",
                                    confirmText: "Kirim Email",
                                    onConfirm: () => {
                                      setFeedback(`Quotation ${item.quotationNo} berhasil dikirim ke ${item.customerName}.`)
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
                                onClick={() => handleDeleteSingle(item.id, item.quotationNo)}
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredQuotations.length)} dari {filteredQuotations.length} data
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
