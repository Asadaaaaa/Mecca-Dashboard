import { useState, useMemo, useEffect } from "react"
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
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"
import { inventoryService } from "@/services/inventory.service"
import { warehouseService } from "@/services/warehouse.service"
import type { StockItem, StockMetrics } from "@/types/inventory.types"
import type { Warehouse } from "@/types/warehouse.types"
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
  CheckIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function InventoryPage() {
  const { theme, setTheme } = useTheme()
  const [stocks, setStocks] = useState<StockItem[]>([])
  const [metrics, setMetrics] = useState<StockMetrics>({
    total_items: 0,
    total_physical_units: 0,
    critical_stock_count: 0,
    total_valuation: 0,
  })
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [warehouseFilter, setWarehouseFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof StockItem>("name")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC")
  const [page, setPage] = useState(1)
  const limit = 8

  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)

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

  const loadData = async () => {
    try {
      setLoading(true)
      const [stocksRes, metricsRes, whRes] = await Promise.all([
        inventoryService.getStocks({ limit: 500 }),
        inventoryService.getStockMetrics(),
        warehouseService.getWarehouses({ limit: 100 }),
      ])
      setStocks(stocksRes.items || [])
      setMetrics(metricsRes)
      setWarehousesList(whRes.items || [])
    } catch (err: any) {
      console.error("Failed to load inventory data", err)
      setFeedback("Gagal memuat data inventaris dari server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered & Sorted Stocks
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
      onConfirm: async () => {
        try {
          await inventoryService.deleteStock(id)
          setSelectedIds((prev) => prev.filter((i) => i !== id))
          setFeedback(`Data stok "${name}" berhasil dihapus.`)
          setTimeout(() => setFeedback(null), 3000)
          loadData()
        } catch (err: any) {
          setFeedback("Gagal menghapus data stok.")
        }
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
      onConfirm: async () => {
        try {
          await inventoryService.batchDeleteStocks(selectedIds)
          const count = selectedIds.length
          setSelectedIds([])
          setFeedback(`${count} item stok berhasil dihapus.`)
          setTimeout(() => setFeedback(null), 3000)
          loadData()
        } catch (err: any) {
          setFeedback("Gagal menghapus item stok terpilih.")
        }
      },
    })
  }

  const handleExportCSV = () => {
    if (filteredStocks.length === 0) {
      setFeedback("Tidak ada data untuk diekspor.")
      return
    }

    const headers = ["ID", "SKU", "Nama Produk", "Gudang", "Kategori", "Satuan", "Stok Minimum", "Stok Fisik", "Harga Satuan", "Status"]
    const rows = filteredStocks.map((s) => [
      s.id,
      `"${s.sku}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.warehouse.replace(/"/g, '""')}"`,
      `"${s.category}"`,
      `"${s.unit}"`,
      s.minStock,
      s.actualStock,
      s.unitPrice,
      `"${s.status}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Inventaris_Stok_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setFeedback("Laporan inventaris stok (.csv) berhasil diunduh.")
    setTimeout(() => setFeedback(null), 3000)
  }

  const isAllSelected = paginatedStocks.length > 0 && paginatedStocks.every((s) => selectedIds.includes(s.id))

  const warehouses = ["Semua", ...Array.from(new Set(warehousesList.map((w) => w.name)))]

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={loadData}
            title="Muat ulang data"
            className="cursor-pointer hover:bg-accent active:scale-95 transition-all"
          >
            <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="cursor-pointer hover:bg-accent active:scale-95 transition-all"
          >
            {theme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4 text-slate-700" />}
          </Button>
        </div>
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
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.total_items}</div>
            <div className="mt-2 text-xs text-muted-foreground">SKU terpantau di sistem</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Fisik Unit</span>
              <WarehouseIcon className="size-4 text-muted-foreground/70" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.total_physical_units.toLocaleString("id-ID")}</div>
            <div className="mt-2 text-xs text-muted-foreground">Unit barang di seluruh gudang</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stok Kritis / Habis</span>
              <AlertTriangleIcon className="size-4 text-amber-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{metrics.critical_stock_count}</div>
            <div className="mt-2 text-xs text-muted-foreground">Di bawah batas minimum aman</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Valuasi Stok</span>
              <DollarSignIcon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(metrics.total_valuation)}</div>
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
                onClick={handleExportCSV}
                className="cursor-pointer hover:bg-accent active:scale-95 transition-all text-xs font-medium"
              >
                <DownloadIcon className="size-3.5 mr-1" />
                Export CSV
              </Button>

              <Button
                size="sm"
                onClick={() => setAdjustmentDialogOpen(true)}
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
              >
                <PlusIcon className="size-3.5 mr-1" />
                Penyesuaian Stok
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
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
                      className="rounded border-border/70 accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("sku")}>
                    <div className="flex items-center gap-1">
                      SKU
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Nama Produk
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("warehouse")}>
                    <div className="flex items-center gap-1">
                      Lokasi Gudang
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold">Kategori</th>
                  <th className="p-3 font-semibold text-right">Min. Stok</th>
                  <th className="p-3 font-semibold text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("actualStock")}>
                    <div className="flex items-center justify-end gap-1">
                      Stok Fisik
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold text-right">Valuasi Stok</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      <Loader2Icon className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data saldo stok...
                    </td>
                  </tr>
                ) : paginatedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      Tidak ada data stok yang sesuai dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedStocks.map((stock) => {
                    const isSelected = selectedIds.includes(stock.id)
                    const itemValuation = stock.actualStock * stock.unitPrice
                    return (
                      <tr key={stock.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => [...prev, stock.id])
                              } else {
                                setSelectedIds((prev) => prev.filter((i) => i !== stock.id))
                              }
                            }}
                            className="rounded border-border/70 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-medium text-foreground">{stock.sku}</td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{stock.name}</div>
                          <div className="text-[11px] text-muted-foreground">Harga: {formatRupiah(stock.unitPrice)} / {stock.unit}</div>
                        </td>
                        <td className="p-3 text-foreground">{stock.warehouse}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {stock.category}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-muted-foreground">
                          {stock.minStock} {stock.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {stock.actualStock.toLocaleString("id-ID")} {stock.unit}
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {formatRupiah(itemValuation)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              stock.status === "Aman"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : stock.status === "Menipis"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {stock.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Hapus entri stok"
                              onClick={() => handleDeleteSingle(stock.id, stock.name)}
                              className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
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
          <div className="flex items-center justify-between p-4 border-t border-border/60 text-xs text-muted-foreground">
            <div>
              Menampilkan {paginatedStocks.length} dari {filteredStocks.length} data stok
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="size-7"
              >
                <ChevronLeftIcon className="size-3.5" />
              </Button>
              <span className="px-2 font-medium text-foreground">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="size-7"
              >
                <ChevronRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        onSuccess={() => {
          setFeedback("Penyesuaian saldo stok berhasil disimpan.")
          setTimeout(() => setFeedback(null), 3000)
          loadData()
        }}
      />

      {/* Confirmation Modal */}
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
