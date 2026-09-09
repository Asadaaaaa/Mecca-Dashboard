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
  BoxesIcon,
  WarehouseIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  CheckIcon,
  EyeIcon,
} from "lucide-react"

interface StockItem {
  id: number
  sku: string
  name: string
  warehouse: string
  category: string
  unit: string
  minStock: number
  actualStock: number
  unitPrice: number
  status: "Aman" | "Menipis" | "Habis"
}

const DUMMY_STOCKS: StockItem[] = [
  { id: 1, sku: "PRD-001", name: "Beras Premium Rojolele 5kg", warehouse: "Gudang Utama Cakung", category: "Bahan Pokok", unit: "KARUNG", minStock: 50, actualStock: 450, unitPrice: 65000, status: "Aman" },
  { id: 2, sku: "PRD-002", name: "Minyak Goreng Bimoli 2L", warehouse: "Gudang Utama Cakung", category: "Bahan Pokok", unit: "POUCH", minStock: 30, actualStock: 120, unitPrice: 31000, status: "Aman" },
  { id: 3, sku: "PRD-003", name: "Gula Pasir Gulaku 1kg", warehouse: "Gudang Transit Surabaya", category: "Bahan Pokok", unit: "BKS", minStock: 50, actualStock: 24, unitPrice: 15500, status: "Menipis" },
  { id: 4, sku: "PRD-004", name: "Tepung Terigu Segitiga Biru 1kg", warehouse: "Gudang Transit Surabaya", category: "Bahan Pokok", unit: "BKS", minStock: 25, actualStock: 0, unitPrice: 11000, status: "Habis" },
  { id: 5, sku: "PRD-005", name: "Susu Kental Manis Frisian Flag 370g", warehouse: "Gudang Dingin Marunda", category: "Minuman & Susu", unit: "KALENG", minStock: 40, actualStock: 280, unitPrice: 11200, status: "Aman" },
  { id: 6, sku: "PRD-006", name: "Kopi Kapal Api Spesial Mix 20x24g", warehouse: "Gudang Utama Cakung", category: "Minuman & Susu", unit: "RENCENG", minStock: 20, actualStock: 95, unitPrice: 22000, status: "Aman" },
  { id: 7, sku: "PRD-007", name: "Mie Instan Indomie Goreng Spesial", warehouse: "Gudang Transit Surabaya", category: "Makanan Siap Saji", unit: "DUS", minStock: 30, actualStock: 15, unitPrice: 108000, status: "Menipis" },
  { id: 8, sku: "PRD-008", name: "Kecap Manis Bango Refill 550ml", warehouse: "Gudang Utama Cakung", category: "Bumbu Dapur", unit: "POUCH", minStock: 25, actualStock: 80, unitPrice: 21500, status: "Aman" },
  { id: 9, sku: "PRD-009", name: "Garam Dapur Cap Kapal 250g", warehouse: "Gudang Utama Cakung", category: "Bumbu Dapur", unit: "BKS", minStock: 50, actualStock: 320, unitPrice: 2500, status: "Aman" },
  { id: 10, sku: "PRD-010", name: "Sabun Mandi Lifebuoy Total 10 4x110g", warehouse: "Gudang Dingin Marunda", category: "Perawatan Diri", unit: "PACK", minStock: 15, actualStock: 65, unitPrice: 24000, status: "Aman" },
]

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function InventoryPage() {
  const { theme, setTheme } = useTheme()
  const [stocks, setStocks] = useState<StockItem[]>(DUMMY_STOCKS)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [warehouseFilter, setWarehouseFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof StockItem>("name")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC")
  const [page, setPage] = useState(1)
  const limit = 8

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
  const totalItems = stocks.length
  const totalPhysicalUnits = stocks.reduce((acc, s) => acc + s.actualStock, 0)
  const criticalStockCount = stocks.filter((s) => s.actualStock <= s.minStock).length
  const totalStockValuation = stocks.reduce((acc, s) => acc + s.actualStock * s.unitPrice, 0)

  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.sku.toLowerCase().includes(search.toLowerCase()) ||
          s.warehouse.toLowerCase().includes(search.toLowerCase())
        const matchesWarehouse = warehouseFilter === "Semua" || s.warehouse === warehouseFilter
        const matchesStatus = statusFilter === "Semua" || s.status === statusFilter
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
  }, [stocks, search, warehouseFilter, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredStocks.length / limit) || 1
  const paginatedStocks = filteredStocks.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof StockItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
  }

  const handleDeleteSingle = (id: number, name: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Entri Stok",
      description: `Apakah Anda yakin ingin menghapus data stok untuk "${name}"?`,
      variant: "destructive",
      onConfirm: () => {
        setStocks((prev) => prev.filter((s) => s.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Data stok "${name}" berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Item Stok Terpilih",
      description: `Hapus ${selectedIds.length} data item stok yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setProductsList(selectedIds)
      },
    })
  }

  const setProductsList = (ids: number[]) => {
    setStocks((prev) => prev.filter((s) => !ids.includes(s.id)))
    setSelectedIds([])
    setFeedback(`${ids.length} item stok berhasil dihapus.`)
    setTimeout(() => setFeedback(null), 3000)
  }

  const isAllSelected = paginatedStocks.length > 0 && paginatedStocks.every((s) => selectedIds.includes(s.id))

  const warehouses = ["Semua", ...Array.from(new Set(stocks.map((s) => s.warehouse)))]

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
                  <BreadcrumbPage>Daftar Stok</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Monitoring Inventaris & Saldo Stok</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Pantau ketersediaan fisik stok per gudang secara real-time dan nilai total aset persediaan.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Item Produk</span>
                <BoxesIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalItems}</div>
              <div className="mt-2 text-xs text-muted-foreground">SKU terpantau di sistem</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Fisik Unit</span>
                <WarehouseIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalPhysicalUnits.toLocaleString("id-ID")}</div>
              <div className="mt-2 text-xs text-muted-foreground">Unit barang di seluruh gudang</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stok Kritis / Habis</span>
                <AlertTriangleIcon className="size-4 text-amber-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{criticalStockCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Di bawah batas minimum aman</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Valuasi Stok</span>
                <DollarSignIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(totalStockValuation)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Nilai modal aset tersimpan</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari SKU, produk, atau gudang..."
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
                    <option value="Aman" className="bg-popover text-popover-foreground">Stok Aman</option>
                    <option value="Menipis" className="bg-popover text-popover-foreground">Stok Menipis</option>
                    <option value="Habis" className="bg-popover text-popover-foreground">Stok Habis</option>
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
                      title: "Export Data Stok",
                      description: "File laporan inventaris stok (.xlsx) sedang disiapkan untuk diunduh.",
                      variant: "default",
                      confirmText: "Unduh Sekarang",
                      onConfirm: () => {
                        setFeedback("Laporan inventaris berhasil diunduh.")
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
                      title: "Penyesuaian Manual Saldo Stok",
                      description: "Form penyesuaian mutasi masuk / keluar cepat untuk stok gudang.",
                      variant: "default",
                      confirmText: "Buka Form",
                      onConfirm: () => {
                        setFeedback("Form penyesuaian stok dibuka.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Penyesuaian Stok
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
                            setSelectedIds(paginatedStocks.map((s) => s.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("sku")}>
                      <div className="flex items-center gap-1">SKU <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nama Barang <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Gudang</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3 text-right">Min. Stok</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("actualStock")}>
                      <div className="flex items-center justify-end gap-1">Saldo Riil <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 text-right">Nilai Saldo</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedStocks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Tidak ada data inventaris yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStocks.map((item) => {
                      const isSelected = selectedIds.includes(item.id)
                      const itemValuation = item.actualStock * item.unitPrice
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
                          <td className="p-3 font-mono font-medium text-foreground">{item.sku}</td>
                          <td className="p-3 font-medium text-foreground">
                            <div>{item.name}</div>
                            <div className="text-[11px] text-muted-foreground">{item.unit}</div>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.warehouse}</td>
                          <td className="p-3 text-muted-foreground">{item.category}</td>
                          <td className="p-3 text-right text-muted-foreground font-mono">{item.minStock}</td>
                          <td className="p-3 text-right font-mono font-semibold text-foreground">
                            {item.actualStock} {item.unit}
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-foreground">
                            {formatRupiah(itemValuation)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Aman"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.status === "Menipis"
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
                                    title: "Audit Riwayat Stok",
                                    description: `Riwayat mutasi keluar/masuk untuk "${item.name}" di ${item.warehouse}.`,
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
                                    title: "Edit Ambang Batas Stok",
                                    description: `Ubah batas minimum dan kuota persediaan untuk SKU ${item.sku}.`,
                                    variant: "default",
                                    confirmText: "Simpan Perubahan",
                                    onConfirm: () => {
                                      setFeedback(`Data stok ${item.sku} diperbarui.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <Edit2Icon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.name)}
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredStocks.length)} dari {filteredStocks.length} data
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
