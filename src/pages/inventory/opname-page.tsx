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
import { OpnameDialog } from "./opname-dialog"
import { inventoryService } from "@/services/inventory.service"
import { warehouseService } from "@/services/warehouse.service"
import type { OpnameItem, OpnameMetrics } from "@/types/inventory.types"
import type { Warehouse } from "@/types/warehouse.types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CheckCircleIcon,
  CheckIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"

function formatRupiah(amount: number) {
  const sign = amount < 0 ? "-IDR " : amount > 0 ? "+IDR " : "IDR "
  return `${sign}${Math.abs(amount).toLocaleString("id-ID")}`
}

export default function StockOpnamePage() {
  const { theme, setTheme } = useTheme()
  const [opnames, setOpnames] = useState<OpnameItem[]>([])
  const [metrics, setMetrics] = useState<OpnameMetrics>({
    total_opname: 0,
    approved_count: 0,
    pending_count: 0,
    accuracy_rate: 100,
  })
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof OpnameItem>("date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 6

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailModal, setDetailModal] = useState<{ open: boolean; opname: any | null }>({ open: false, opname: null })
  const [detailLoading, setDetailLoading] = useState(false)

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
      const [opnameRes, metricsRes, whRes] = await Promise.all([
        inventoryService.getOpnames({ limit: 500 }),
        inventoryService.getOpnameMetrics(),
        warehouseService.getWarehouses({ limit: 100 }),
      ])
      setOpnames(opnameRes.items || [])
      setMetrics(metricsRes)
      setWarehousesList(whRes.items || [])
    } catch (err: any) {
      console.error("Failed to load opname data", err)
      setFeedback("Gagal memuat data stok opname dari server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredOpnames = useMemo(() => {
    return opnames
      .filter((o) => {
        const matchesSearch =
          o.documentNo.toLowerCase().includes(search.toLowerCase()) ||
          o.inspector.toLowerCase().includes(search.toLowerCase()) ||
          o.warehouse.toLowerCase().includes(search.toLowerCase())
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

  const handleOpenDetail = async (id: number) => {
    try {
      setDetailLoading(true)
      setDetailModal({ open: true, opname: null })
      const data = await inventoryService.getOpnameById(id)
      setDetailModal({ open: true, opname: data })
    } catch {
      setFeedback("Gagal mengambil detail sesi opname.")
    } finally {
      setDetailLoading(false)
    }
  }

  const handleApprove = (id: number, docNo: string) => {
    setConfirmModal({
      open: true,
      title: "Setujui Hasil Opname",
      description: `Setujui sesi ${docNo}? Saldo stok fisik akan disinkronkan ke database dan kartu mutasi dicatat secara otomatis.`,
      variant: "success",
      confirmText: "Setujui & Sinkronisasi",
      onConfirm: async () => {
        try {
          await inventoryService.approveOpname(id)
          setFeedback(`Sesi opname ${docNo} berhasil disetujui. Saldo stok telah disesuaikan.`)
          setTimeout(() => setFeedback(null), 3500)
          loadData()
        } catch (err: any) {
          const msg = err.response?.data?.message || err.message || "Gagal menyetujui sesi opname."
          setFeedback(msg)
        }
      },
    })
  }

  const handleExportCSV = () => {
    if (filteredOpnames.length === 0) {
      setFeedback("Tidak ada data untuk diekspor.")
      return
    }

    const headers = ["No Dokumen", "Tanggal", "Gudang", "Inspektur", "Jumlah Item", "Selisih Unit", "Nilai Selisih", "Status"]
    const rows = filteredOpnames.map((o) => [
      `"${o.documentNo}"`,
      `"${o.date}"`,
      `"${o.warehouse.replace(/"/g, '""')}"`,
      `"${o.inspector.replace(/"/g, '""')}"`,
      o.itemsCount,
      o.discrepancyUnits,
      o.discrepancyValue,
      `"${o.status}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Stok_Opname_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setFeedback("Laporan stok opname (.csv) berhasil diunduh.")
    setTimeout(() => setFeedback(null), 3000)
  }

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
                <BreadcrumbPage>Stok Opname</BreadcrumbPage>
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">Sesi Rekonsiliasi Stok Opname</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Catat dan lakukan audit fisik persediaan barang berkala untuk memastikan akurasi saldo gudang.</p>
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
              <FileSpreadsheetIcon className="size-4 text-muted-foreground/70" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.total_opname}</div>
            <div className="mt-2 text-xs text-muted-foreground">Sesi audit tercatat</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selesai Disetujui</span>
              <ClipboardCheckIcon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{metrics.approved_count}</div>
            <div className="mt-2 text-xs text-muted-foreground">Saldo riil disinkronkan</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menunggu Review</span>
              <ClockIcon className="size-4 text-amber-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{metrics.pending_count}</div>
            <div className="mt-2 text-xs text-muted-foreground">Perlu verifikasi supervisor</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akurasi Stok</span>
              <PercentIcon className="size-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.accuracy_rate}%</div>
            <div className="mt-2 text-xs text-muted-foreground">Tingkat kecocokan fisik & sistem</div>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari no. dokumen, pemeriksa, gudang..."
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
                onClick={() => setCreateDialogOpen(true)}
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
              >
                <PlusIcon className="size-3.5 mr-1" />
                Buat Sesi Opname
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                  <th className="p-3 font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("documentNo")}>
                    <div className="flex items-center gap-1">
                      No. Dokumen
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("date")}>
                    <div className="flex items-center gap-1">
                      Tanggal
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("warehouse")}>
                    <div className="flex items-center gap-1">
                      Gudang
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold">Petugas Inspektur</th>
                  <th className="p-3 font-semibold text-right">Item Dihitung</th>
                  <th className="p-3 font-semibold text-right">Selisih Unit</th>
                  <th className="p-3 font-semibold text-right">Nilai Selisih</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <Loader2Icon className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data sesi opname...
                    </td>
                  </tr>
                ) : paginatedOpnames.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Tidak ada rekaman sesi stok opname.
                    </td>
                  </tr>
                ) : (
                  paginatedOpnames.map((opname) => {
                    return (
                      <tr key={opname.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{opname.documentNo}</td>
                        <td className="p-3 text-muted-foreground">{opname.date}</td>
                        <td className="p-3 font-medium text-foreground">{opname.warehouse}</td>
                        <td className="p-3 text-foreground">{opname.inspector}</td>
                        <td className="p-3 text-right font-medium text-foreground">{opname.itemsCount} SKU</td>
                        <td className="p-3 text-right font-bold">
                          <span className={opname.discrepancyUnits < 0 ? "text-destructive" : opname.discrepancyUnits > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                            {opname.discrepancyUnits > 0 ? `+${opname.discrepancyUnits}` : opname.discrepancyUnits}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold">
                          <span className={opname.discrepancyValue < 0 ? "text-destructive" : opname.discrepancyValue > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                            {formatRupiah(opname.discrepancyValue)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              opname.status === "Disetujui"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : opname.status === "Menunggu Review"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {opname.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Lihat Rincian Item"
                              onClick={() => handleOpenDetail(opname.id)}
                              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>
                            {opname.status === "Menunggu Review" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(opname.id, opname.documentNo)}
                                className="h-7 text-[11px] text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                              >
                                <CheckCircleIcon className="size-3 mr-1" />
                                Setujui
                              </Button>
                            )}
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
              Menampilkan {paginatedOpnames.length} dari {filteredOpnames.length} sesi opname
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

      {/* Create Opname Dialog */}
      <OpnameDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setFeedback("Sesi stok opname baru berhasil disimpan.")
          setTimeout(() => setFeedback(null), 3000)
          loadData()
        }}
      />

      {/* Detail Dialog */}
      <Dialog
        open={detailModal.open}
        onOpenChange={(open) => setDetailModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Rincian Item Stok Opname ({detailModal.opname?.document_no || "..."})
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perbandingan kuantitas sistem vs fisik riil saat proses audit.
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !detailModal.opname ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2Icon className="size-6 animate-spin mx-auto mb-2 text-primary" />
              Memuat detail item...
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-3 border border-border/60">
                <div>Gudang: <span className="font-semibold text-foreground">{detailModal.opname.warehouse?.name}</span></div>
                <div>Tanggal: <span className="font-semibold text-foreground">{detailModal.opname.date}</span></div>
                <div>Petugas: <span className="font-semibold text-foreground">{detailModal.opname.inspector_name}</span></div>
                <div>Status: <span className="font-semibold text-foreground">{detailModal.opname.status}</span></div>
              </div>

              <div className="border border-border/70 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr>
                      <th className="p-2.5 font-semibold">Produk</th>
                      <th className="p-2.5 text-right font-semibold">Sistem</th>
                      <th className="p-2.5 text-right font-semibold">Fisik</th>
                      <th className="p-2.5 text-right font-semibold">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(detailModal.opname.items || []).map((item: any) => {
                      const diff = parseFloat(item.difference)
                      return (
                        <tr key={item.id}>
                          <td className="p-2.5 font-medium text-foreground">
                            <div>{item.product?.name || item.product_id}</div>
                            <div className="text-[10px] text-muted-foreground">{item.product?.code}</div>
                          </td>
                          <td className="p-2.5 text-right text-muted-foreground">{item.system_stock}</td>
                          <td className="p-2.5 text-right font-bold text-foreground">{item.physical_stock}</td>
                          <td className="p-2.5 text-right font-bold">
                            <span className={diff < 0 ? "text-destructive" : diff > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
