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
  TrashIcon,
  AlertCircleIcon,
  TrendingDownIcon,
  ShieldCheckIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CheckIcon,
} from "lucide-react"

interface WasteItem {
  id: number
  documentNo: string
  date: string
  sku: string
  productName: string
  warehouse: string
  qty: number
  unit: string
  reason: "Kemasan Bocor / Rusak" | "Kadaluarsa (Expired)" | "Kualitas Turun / Lembap" | "Diserang Hama"
  lossAmount: number
  status: "Dimusnahkan" | "Retur Supplier" | "Menunggu Approval"
}

const DUMMY_WASTES: WasteItem[] = [
  { id: 1, documentNo: "WST-202609-001", date: "2026-09-08", sku: "PRD-002", productName: "Minyak Goreng Bimoli 2L", warehouse: "Gudang Utama Cakung", qty: 4, unit: "POUCH", reason: "Kemasan Bocor / Rusak", lossAmount: 124000, status: "Dimusnahkan" },
  { id: 2, documentNo: "WST-202609-002", date: "2026-09-07", sku: "PRD-005", productName: "Susu Kental Manis Frisian Flag 370g", warehouse: "Gudang Dingin Marunda", qty: 12, unit: "KALENG", reason: "Kadaluarsa (Expired)", lossAmount: 134400, status: "Dimusnahkan" },
  { id: 3, documentNo: "WST-202609-003", date: "2026-09-06", sku: "PRD-004", productName: "Tepung Terigu Segitiga Biru 1kg", warehouse: "Gudang Transit Surabaya", qty: 6, unit: "BKS", reason: "Kualitas Turun / Lembap", lossAmount: 66000, status: "Retur Supplier" },
  { id: 4, documentNo: "WST-202609-004", date: "2026-09-04", sku: "PRD-001", productName: "Beras Premium Rojolele 5kg", warehouse: "Gudang Utama Cakung", qty: 2, unit: "KARUNG", reason: "Kemasan Bocor / Rusak", lossAmount: 130000, status: "Menunggu Approval" },
  { id: 5, documentNo: "WST-202609-005", date: "2026-09-02", sku: "PRD-007", productName: "Mie Instan Indomie Goreng Spesial", warehouse: "Gudang Transit Surabaya", qty: 1, unit: "DUS", reason: "Diserang Hama", lossAmount: 108000, status: "Dimusnahkan" },
  { id: 6, documentNo: "WST-202608-015", date: "2026-08-28", sku: "PRD-008", productName: "Kecap Manis Bango Refill 550ml", warehouse: "Gudang Utama Cakung", qty: 3, unit: "POUCH", reason: "Kemasan Bocor / Rusak", lossAmount: 64500, status: "Dimusnahkan" },
]

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function WastePage() {
  const { theme, setTheme } = useTheme()
  const [wastes, setWastes] = useState<WasteItem[]>(DUMMY_WASTES)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [reasonFilter, setReasonFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof WasteItem>("date")
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
  const totalIncidents = wastes.length
  const totalUnitsWasted = wastes.reduce((acc, w) => acc + w.qty, 0)
  const totalLoss = wastes.reduce((acc, w) => acc + w.lossAmount, 0)
  const wasteRate = 0.28 // %

  const filteredWastes = useMemo(() => {
    return wastes
      .filter((w) => {
        const matchesSearch =
          w.documentNo.toLowerCase().includes(search.toLowerCase()) ||
          w.productName.toLowerCase().includes(search.toLowerCase()) ||
          w.sku.toLowerCase().includes(search.toLowerCase()) ||
          w.warehouse.toLowerCase().includes(search.toLowerCase())
        const matchesReason = reasonFilter === "Semua" || w.reason === reasonFilter
        const matchesStatus = statusFilter === "Semua" || w.status === statusFilter
        return matchesSearch && matchesReason && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [wastes, search, reasonFilter, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredWastes.length / limit) || 1
  const paginatedWastes = filteredWastes.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof WasteItem) => {
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
      title: "Hapus Data Waste",
      description: `Apakah Anda yakin ingin menghapus data stok terbuang ${docNo}?`,
      variant: "destructive",
      onConfirm: () => {
        setWastes((prev) => prev.filter((w) => w.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Dokumen ${docNo} berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Data Terpilih",
      description: `Hapus ${selectedIds.length} data barang terbuang yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setWastes((prev) => prev.filter((w) => !selectedIds.includes(w.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} data stok terbuang berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedWastes.length > 0 && paginatedWastes.every((w) => selectedIds.includes(w.id))

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
                  <BreadcrumbPage>Stok Terbuang</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Pencatatan Stok Terbuang & Rusak</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Dokumentasi barang kadaluarsa, kemasan cacat, atau rusak untuk write-off buku persediaan.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Insiden Waste</span>
                <TrashIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalIncidents}</div>
              <div className="mt-2 text-xs text-muted-foreground">Kejadian kerusakan tercatat</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kuantitas Unit Rusak</span>
                <AlertCircleIcon className="size-4 text-amber-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalUnitsWasted} Unit</div>
              <div className="mt-2 text-xs text-muted-foreground">Barang ditarik dari rak simpan</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Nilai Kerugian</span>
                <TrendingDownIcon className="size-4 text-red-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">{formatRupiah(totalLoss)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Beban biaya write-off periode ini</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rasio Waste vs Saldo</span>
                <ShieldCheckIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{wasteRate}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Di bawah batas toleransi max 0.5%</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. Dokumen, SKU, atau barang..."
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
                    value={reasonFilter}
                    onChange={(e) => {
                      setReasonFilter(e.target.value)
                      setPage(1)
                    }}
                    className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="Semua" className="bg-popover text-popover-foreground">Semua Alasan</option>
                    <option value="Kemasan Bocor / Rusak" className="bg-popover text-popover-foreground">Kemasan Bocor / Rusak</option>
                    <option value="Kadaluarsa (Expired)" className="bg-popover text-popover-foreground">Kadaluarsa (Expired)</option>
                    <option value="Kualitas Turun / Lembap" className="bg-popover text-popover-foreground">Kualitas Turun / Lembap</option>
                    <option value="Diserang Hama" className="bg-popover text-popover-foreground">Diserang Hama</option>
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
                    <option value="Dimusnahkan" className="bg-popover text-popover-foreground">Dimusnahkan</option>
                    <option value="Retur Supplier" className="bg-popover text-popover-foreground">Retur Supplier</option>
                    <option value="Menunggu Approval" className="bg-popover text-popover-foreground">Menunggu Approval</option>
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
                      title: "Export Laporan Stok Rusak / Terbuang",
                      description: "File laporan kerugian stok (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("Laporan kerugian stok berhasil diunduh.")
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
                      title: "Catat Stok Terbuang Baru",
                      description: "Buka formulir input barang rusak atau kadaluarsa untuk penghapusan buku stok.",
                      variant: "default",
                      confirmText: "Buka Formulir",
                      onConfirm: () => {
                        setFeedback("Formulir pencatatan waste siap diisi.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Catat Stok Rusak
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
                            setSelectedIds(paginatedWastes.map((w) => w.id))
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
                    <th className="p-3">Produk & SKU</th>
                    <th className="p-3">Gudang</th>
                    <th className="p-3 text-right">Qty Terbuang</th>
                    <th className="p-3">Alasan / Penyebab</th>
                    <th className="p-3 text-right">Nilai Kerugian</th>
                    <th className="p-3 text-center">Disposisi</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedWastes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Tidak ada catatan stok rusak yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedWastes.map((item) => {
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
                          <td className="p-3">
                            <div className="font-medium text-foreground">{item.productName}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{item.sku}</div>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.warehouse}</td>
                          <td className="p-3 text-right font-mono font-semibold text-red-600 dark:text-red-400">
                            {item.qty} {item.unit}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            <span className="inline-block rounded bg-muted px-2 py-0.5 text-[11px]">
                              {item.reason}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-foreground">
                            {formatRupiah(item.lossAmount)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Dimusnahkan"
                                  ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                                  : item.status === "Retur Supplier"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
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
                                    title: `Detail Berkas ${item.documentNo}`,
                                    description: `Barang "${item.productName}" sebanyak ${item.qty} ${item.unit} dilaporkan rusak karena "${item.reason}". Estimasi kerugian: ${formatRupiah(item.lossAmount)}.`,
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredWastes.length)} dari {filteredWastes.length} data
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
