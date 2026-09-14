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
import { WasteDialog } from "./waste-dialog"
import { inventoryService } from "@/services/inventory.service"
import { warehouseService } from "@/services/warehouse.service"
import type { WasteItem, WasteMetrics } from "@/types/inventory.types"
import type { Warehouse } from "@/types/warehouse.types"
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
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  CheckCircleIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function WastePage() {
  const { theme, setTheme } = useTheme()
  const [wastes, setWastes] = useState<WasteItem[]>([])
  const [metrics, setMetrics] = useState<WasteMetrics>({
    total_incidents: 0,
    total_units_wasted: 0,
    total_loss: 0,
    waste_rate: 0,
  })
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("Semua")
  const [reasonFilter, setReasonFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof WasteItem>("date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 6

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

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
      const [wastesRes, metricsRes, whRes] = await Promise.all([
        inventoryService.getWastes({ limit: 500 }),
        inventoryService.getWasteMetrics(),
        warehouseService.getWarehouses({ limit: 100 }),
      ])
      setWastes(wastesRes.items || [])
      setMetrics(metricsRes)
      setWarehousesList(whRes.items || [])
    } catch (err: any) {
      console.error("Failed to load waste data", err)
      setFeedback("Gagal memuat data barang terbuang dari server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredWastes = useMemo(() => {
    return wastes
      .filter((w) => {
        const matchesSearch =
          w.documentNo.toLowerCase().includes(search.toLowerCase()) ||
          w.productName.toLowerCase().includes(search.toLowerCase()) ||
          w.sku.toLowerCase().includes(search.toLowerCase()) ||
          w.warehouse.toLowerCase().includes(search.toLowerCase())
        const matchesWarehouse = warehouseFilter === "Semua" || w.warehouse === warehouseFilter
        const matchesReason = reasonFilter === "Semua" || w.reason === reasonFilter
        const matchesStatus = statusFilter === "Semua" || w.status === statusFilter
        return matchesSearch && matchesWarehouse && matchesReason && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [wastes, search, warehouseFilter, reasonFilter, statusFilter, sortField, sortOrder])

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

  const handleApprove = (id: number, docNo: string) => {
    setConfirmModal({
      open: true,
      title: "Setujui Pemusnahan Barang",
      description: `Konfirmasi pemusnahan barang untuk dokumen ${docNo}? Saldo stok fisik akan dipotong permanen dan kartu mutasi dicatat.`,
      variant: "destructive",
      confirmText: "Setujui & Potong Stok",
      onConfirm: async () => {
        try {
          await inventoryService.approveWaste(id)
          setFeedback(`Barang rusak ${docNo} berhasil disetujui untuk dimusnahkan.`)
          setTimeout(() => setFeedback(null), 3500)
          loadData()
        } catch (err: any) {
          const msg = err.response?.data?.message || err.message || "Gagal memproses persetujuan waste."
          setFeedback(msg)
        }
      },
    })
  }

  const handleExportCSV = () => {
    if (filteredWastes.length === 0) {
      setFeedback("Tidak ada data untuk diekspor.")
      return
    }

    const headers = ["No Dokumen", "Tanggal", "SKU", "Nama Produk", "Gudang", "Kuantitas", "Satuan", "Alasan Kerusakan", "Nilai Kerugian", "Status"]
    const rows = filteredWastes.map((w) => [
      `"${w.documentNo}"`,
      `"${w.date}"`,
      `"${w.sku}"`,
      `"${w.productName.replace(/"/g, '""')}"`,
      `"${w.warehouse.replace(/"/g, '""')}"`,
      w.qty,
      `"${w.unit}"`,
      `"${w.reason}"`,
      w.lossAmount,
      `"${w.status}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Barang_Rusak_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setFeedback("Laporan barang rusak (.csv) berhasil diunduh.")
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
                <BreadcrumbPage>Stok Terbuang (Waste)</BreadcrumbPage>
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">Pencatatan Stok Terbuang / Rusak (Waste)</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Pantau barang rusak, kadaluarsa, bocor, atau susut kualitas untuk investigasi dan pengendalian risiko kerugian.</p>
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
              <AlertCircleIcon className="size-4 text-muted-foreground/70" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.total_incidents}</div>
            <div className="mt-2 text-xs text-muted-foreground">Kasus kerusakan tercatat</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Unit Terbuang</span>
              <TrashIcon className="size-4 text-rose-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{metrics.total_units_wasted.toLocaleString("id-ID")}</div>
            <div className="mt-2 text-xs text-muted-foreground">Unit barang rusak / expired</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimasi Kerugian</span>
              <TrendingDownIcon className="size-4 text-destructive" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-destructive">{formatRupiah(metrics.total_loss)}</div>
            <div className="mt-2 text-xs text-muted-foreground">Total modal aset terbuang</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tingkat Susut (Waste Rate)</span>
              <ShieldCheckIcon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.waste_rate}%</div>
            <div className="mt-2 text-xs text-muted-foreground">Di bawah ambang toleransi 0.5%</div>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari no dokumen, SKU, produk..."
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
                  value={reasonFilter}
                  onChange={(e) => {
                    setReasonFilter(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-popover text-popover-foreground">Semua Alasan</option>
                  <option value="Kemasan Bocor / Rusak" className="bg-popover text-popover-foreground">Kemasan Rusak</option>
                  <option value="Kadaluarsa (Expired)" className="bg-popover text-popover-foreground">Expired</option>
                  <option value="Kualitas Turun / Lembap" className="bg-popover text-popover-foreground">Kualitas Turun</option>
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
                className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95 transition-all text-xs font-medium"
              >
                <PlusIcon className="size-3.5 mr-1" />
                Catat Barang Rusak
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
                  <th className="p-3 font-semibold">SKU & Produk</th>
                  <th className="p-3 font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("warehouse")}>
                    <div className="flex items-center gap-1">
                      Gudang
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold text-right">Kuantitas</th>
                  <th className="p-3 font-semibold">Alasan Waste</th>
                  <th className="p-3 font-semibold text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("lossAmount")}>
                    <div className="flex items-center justify-end gap-1">
                      Nilai Kerugian
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="p-3 font-semibold text-center">Tindakan / Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <Loader2Icon className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data barang rusak...
                    </td>
                  </tr>
                ) : paginatedWastes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Tidak ada rekaman barang rusak / waste.
                    </td>
                  </tr>
                ) : (
                  paginatedWastes.map((waste) => {
                    return (
                      <tr key={waste.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{waste.documentNo}</td>
                        <td className="p-3 text-muted-foreground">{waste.date}</td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{waste.productName}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{waste.sku}</div>
                        </td>
                        <td className="p-3 text-foreground">{waste.warehouse}</td>
                        <td className="p-3 text-right font-bold text-destructive">
                          {waste.qty} {waste.unit}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                            {waste.reason}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-destructive">
                          {formatRupiah(waste.lossAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              waste.status === "Dimusnahkan"
                                ? "bg-destructive/15 text-destructive"
                                : waste.status === "Retur Supplier"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {waste.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {waste.status === "Menunggu Approval" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(waste.id, waste.documentNo)}
                                className="h-7 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
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
              Menampilkan {paginatedWastes.length} dari {filteredWastes.length} data insiden
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

      {/* Create Waste Dialog */}
      <WasteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setFeedback("Catatan barang terbuang baru berhasil disimpan.")
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
