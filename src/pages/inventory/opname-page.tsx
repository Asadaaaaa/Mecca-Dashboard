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
  ClipboardCheckIcon,
  FileSpreadsheetIcon,
  ClockIcon,
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
  CheckCircleIcon,
  CheckIcon,
} from "lucide-react"

interface OpnameItem {
  id: number
  documentNo: string
  date: string
  warehouse: string
  inspector: string
  itemsCount: number
  discrepancyUnits: number
  discrepancyValue: number
  status: "Disetujui" | "Menunggu Review" | "Draft"
}

const DUMMY_OPNAME: OpnameItem[] = [
  { id: 1, documentNo: "OPN-202609-001", date: "2026-09-08", warehouse: "Gudang Utama Cakung", inspector: "Budi Santoso", itemsCount: 65, discrepancyUnits: -2, discrepancyValue: -72000, status: "Disetujui" },
  { id: 2, documentNo: "OPN-202609-002", date: "2026-09-07", warehouse: "Gudang Transit Surabaya", inspector: "Ahmad Dahlan", itemsCount: 42, discrepancyUnits: 0, discrepancyValue: 0, status: "Disetujui" },
  { id: 3, documentNo: "OPN-202609-003", date: "2026-09-06", warehouse: "Gudang Dingin Marunda", inspector: "Siti Rahma", itemsCount: 30, discrepancyUnits: -5, discrepancyValue: -145000, status: "Menunggu Review" },
  { id: 4, documentNo: "OPN-202609-004", date: "2026-09-05", warehouse: "Gudang Utama Cakung", inspector: "Rudi Hidayat", itemsCount: 50, discrepancyUnits: 1, discrepancyValue: 35000, status: "Disetujui" },
  { id: 5, documentNo: "OPN-202609-005", date: "2026-09-04", warehouse: "Gudang Transit Surabaya", inspector: "Ahmad Dahlan", itemsCount: 38, discrepancyUnits: -1, discrepancyValue: -28000, status: "Draft" },
  { id: 6, documentNo: "OPN-202608-012", date: "2026-08-31", warehouse: "Gudang Utama Cakung", inspector: "Budi Santoso", itemsCount: 110, discrepancyUnits: -4, discrepancyValue: -95000, status: "Disetujui" },
  { id: 7, documentNo: "OPN-202608-011", date: "2026-08-25", warehouse: "Gudang Dingin Marunda", inspector: "Siti Rahma", itemsCount: 25, discrepancyUnits: 0, discrepancyValue: 0, status: "Disetujui" },
]

function formatRupiah(amount: number) {
  const sign = amount < 0 ? "-IDR " : amount > 0 ? "+IDR " : "IDR "
  return `${sign}${Math.abs(amount).toLocaleString("id-ID")}`
}

export default function StockOpnamePage() {
  const { theme, setTheme } = useTheme()
  const [opnames, setOpnames] = useState<OpnameItem[]>(DUMMY_OPNAME)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [warehouseFilter, setWarehouseFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof OpnameItem>("date")
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
  const totalOpname = opnames.length
  const approvedCount = opnames.filter((o) => o.status === "Disetujui").length
  const pendingCount = opnames.filter((o) => o.status === "Menunggu Review").length
  const accuracyRate = 98.6

  const filteredOpnames = useMemo(() => {
    return opnames
      .filter((o) => {
        const matchesSearch =
          o.documentNo.toLowerCase().includes(search.toLowerCase()) ||
          o.warehouse.toLowerCase().includes(search.toLowerCase()) ||
          o.inspector.toLowerCase().includes(search.toLowerCase())
        const matchesWarehouse = warehouseFilter === "Semua" || o.warehouse === warehouseFilter
        const matchesStatus = statusFilter === "Semua" || o.status === statusFilter
        return matchesSearch && matchesWarehouse && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [opnames, search, warehouseFilter, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredOpnames.length / limit) || 1
  const paginatedOpnames = filteredOpnames.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof OpnameItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
  }

  const handleDeleteSingle = (id: number, docNo: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Sesi Opname",
      description: `Apakah Anda yakin ingin menghapus catatan opname nomor ${docNo}?`,
      variant: "destructive",
      onConfirm: () => {
        setOpnames((prev) => prev.filter((o) => o.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Dokumen opname ${docNo} berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Sesi Opname Terpilih",
      description: `Hapus ${selectedIds.length} sesi opname yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setOpnames((prev) => prev.filter((o) => !selectedIds.includes(o.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} sesi opname berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedOpnames.length > 0 && paginatedOpnames.every((o) => selectedIds.includes(o.id))
  const warehouses = ["Semua", ...Array.from(new Set(opnames.map((o) => o.warehouse)))]

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
                  <BreadcrumbLink href="/inventory" className="cursor-pointer hover:text-foreground transition-colors">Inventaris dan Stok</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Stok Opname</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Sesi Stok Opname & Rekonsiliasi</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Pemeriksaan fisik periodik, identifikasi selisih kuantitas, dan penyesuaian buku besar stok.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sesi Opname</span>
                <ClipboardCheckIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalOpname}</div>
              <div className="mt-2 text-xs text-muted-foreground">Siklus inspeksi tercatat</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selesai & Disetujui</span>
                <CheckCircleIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{approvedCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Buku stok telah disesuaikan</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menunggu Review</span>
                <ClockIcon className="size-4 text-amber-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{pendingCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Memerlukan tanda tangan SPV</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akurasi Saldo Fisik</span>
                <PercentIcon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{accuracyRate}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Tingkat kesesuaian fisik vs sistem</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. Dokumen atau PIC..."
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
                    value={warehouseFilter}
                    onChange={(e) => {
                      setWarehouseFilter(e.target.value)
                      setPage(1)
                    }}
                    className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                  >
                    {warehouses.map((w) => (
                      <option key={w} value={w} className="bg-popover text-popover-foreground">
                        {w === "Semua" ? "Semua Gudang" : w}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-md px-2 py-1">
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
                    <option value="Menunggu Review" className="bg-popover text-popover-foreground">Menunggu Review</option>
                    <option value="Draft" className="bg-popover text-popover-foreground">Draft</option>
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
                      title: "Export Berita Acara Opname",
                      description: "Rekapitulasi berkas hasil opname (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File rekap opname berhasil diunduh.")
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
                      title: "Jadwalkan Sesi Opname Baru",
                      description: "Buat lembar kerja formulir opname baru untuk audit gudang.",
                      variant: "default",
                      confirmText: "Buat Sesi",
                      onConfirm: () => {
                        setFeedback("Sesi opname baru berhasil dibuat.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Buat Sesi Opname
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
                            setSelectedIds(paginatedOpnames.map((o) => o.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("documentNo")}>
                      <div className="flex items-center gap-1">No. Dokumen <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Gudang</th>
                    <th className="p-3">PIC Pemeriksa</th>
                    <th className="p-3 text-right">Item Diperiksa</th>
                    <th className="p-3 text-right">Selisih Unit</th>
                    <th className="p-3 text-right">Dampak Nilai</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedOpnames.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Tidak ada sesi opname yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedOpnames.map((item) => {
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
                          <td className="p-3 font-mono font-medium text-foreground">{item.documentNo}</td>
                          <td className="p-3 text-muted-foreground">{item.date}</td>
                          <td className="p-3 font-medium text-foreground">{item.warehouse}</td>
                          <td className="p-3 text-muted-foreground">{item.inspector}</td>
                          <td className="p-3 text-right font-mono">{item.itemsCount} SKU</td>
                          <td className="p-3 text-right font-mono font-medium">
                            <span className={item.discrepancyUnits < 0 ? "text-red-500" : item.discrepancyUnits > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                              {item.discrepancyUnits > 0 ? `+${item.discrepancyUnits}` : item.discrepancyUnits} Unit
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium">
                            <span className={item.discrepancyValue < 0 ? "text-red-500" : item.discrepancyValue > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                              {formatRupiah(item.discrepancyValue)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Disetujui"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.status === "Menunggu Review"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
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
                                    title: `Detail Hasil Opname ${item.documentNo}`,
                                    description: `Audit dilaksanakan oleh ${item.inspector} di ${item.warehouse} pada tanggal ${item.date}. Total item: ${item.itemsCount} SKU.`,
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
                                    title: "Cetak Berita Acara",
                                    description: `Cetak dokumen format PDF untuk berita acara fisik nomor ${item.documentNo}?`,
                                    variant: "default",
                                    confirmText: "Cetak PDF",
                                    onConfirm: () => {
                                      setFeedback(`Dokumen ${item.documentNo} berhasil dicetak.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <FileSpreadsheetIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.documentNo)}
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredOpnames.length)} dari {filteredOpnames.length} data
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
