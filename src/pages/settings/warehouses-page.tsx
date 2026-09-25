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
import { warehouseService } from "@/services/warehouse.service"
import { WarehouseDialog } from "@/pages/settings/warehouse-dialog"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import type { Warehouse, WarehouseMetrics, WarehouseFormData } from "@/types/settings.types"
import {
  SunIcon,
  MoonIcon,
  Building2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  UserCheckIcon,
  SearchIcon,
  PlusIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  Loader2Icon,
  MapPinIcon,
  PhoneIcon,
  CheckIcon,
} from "lucide-react"

export default function WarehousesPage() {
  const { resolvedTheme, toggleTheme } = useTheme()

  const [metrics, setMetrics] = useState<WarehouseMetrics>({
    total_warehouses: 0,
    active_warehouses: 0,
    inactive_warehouses: 0,
    total_pics: 0,
  })

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 10

  // Modals
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description?: string
    variant?: "default" | "destructive" | "warning" | "success"
    onConfirm?: () => void
    confirmText?: string
  }>({ open: false, title: "" })

  const [feedback, setFeedback] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3000)
  }

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await warehouseService.getWarehouseMetrics()
      setMetrics(data)
    } catch (err) {
      console.error("Failed to load warehouse metrics:", err)
    }
  }, [])

  const fetchWarehouses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await warehouseService.getWarehouses({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort: sortField,
        order: sortOrder,
      })
      setWarehouses(res.items || [])
      setTotalCount(res.pagination?.total || 0)
    } catch (err) {
      console.error("Failed to load warehouses:", err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, sortField, sortOrder])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
    setPage(1)
  }

  const handleSaveWarehouse = async (data: WarehouseFormData) => {
    if (selectedWarehouse) {
      await warehouseService.updateWarehouse(selectedWarehouse.id, data)
      showToast("Gudang berhasil diperbarui")
    } else {
      await warehouseService.createWarehouse(data)
      showToast("Gudang baru berhasil ditambahkan")
    }
    fetchMetrics()
    fetchWarehouses()
  }

  const handleDelete = (wh: Warehouse) => {
    setConfirmModal({
      open: true,
      title: "Hapus Gudang",
      description: `Apakah Anda yakin ingin menghapus gudang "${wh.name}" (${wh.code})?`,
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await warehouseService.deleteWarehouse(wh.id)
          showToast(`Gudang "${wh.name}" berhasil dihapus`)
          fetchMetrics()
          fetchWarehouses()
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string }
          showToast(e.response?.data?.message || "Gagal menghapus gudang")
        }
      },
    })
  }

  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/settings/users">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Daftar Warehouse</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full cursor-pointer hover:bg-accent active:scale-95 transition-all"
        >
          {resolvedTheme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4" />}
        </Button>
      </header>

      {/* Floating Feedback Toast */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <CheckIcon className="size-4" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daftar Warehouse & Lokasi</h1>
            <p className="text-sm text-muted-foreground">
              Kelola daftar fasilitas gudang penyimpanan, alamat pengiriman, dan penanggung jawab fisik (PIC).
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedWarehouse(null)
              setDialogOpen(true)
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground shadow"
          >
            <PlusIcon className="size-4" />
            Tambah Gudang
          </Button>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Gudang</p>
                <h3 className="text-2xl font-bold mt-1">{metrics.total_warehouses}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Fasilitas terdaftar</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <Building2Icon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Gudang Aktif</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {metrics.active_warehouses}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Operasional penuh</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Nonaktif / Tutup</p>
                <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                  {metrics.inactive_warehouses}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Tidak menerima stok</p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                <XCircleIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Penanggung Jawab (PIC)</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {metrics.total_pics}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Kepala gudang unik</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
                <UserCheckIcon className="size-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Table Container */}
        <Card className="border">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between border-b">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari kode, nama gudang, PIC, alamat..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <FilterIcon className="size-4 text-muted-foreground" />
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif Saja</option>
                  <option value="inactive">Nonaktif Saja</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-1">
                      Kode
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Nama Fasilitas Gudang
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3">PIC & Kontak</th>
                  <th className="px-6 py-3">Alamat</th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2Icon className="size-6 animate-spin text-primary" />
                        <span>Memuat data gudang...</span>
                      </div>
                    </td>
                  </tr>
                ) : warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2Icon className="size-8 text-muted-foreground/50" />
                        <span>Tidak ada gudang ditemukan</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  warehouses.map((wh) => (
                    <tr key={wh.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-primary text-xs">
                        {wh.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{wh.name}</div>
                        <div className="text-xs text-muted-foreground">ID Database #{wh.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{wh.pic_name || "-"}</div>
                        {wh.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <PhoneIcon className="size-3" />
                            {wh.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {wh.address ? (
                          <div className="flex items-start gap-1 text-xs text-muted-foreground line-clamp-2">
                            <MapPinIcon className="size-3 shrink-0 mt-0.5" />
                            <span>{wh.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            wh.status === "active"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              wh.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {wh.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedWarehouse(wh)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit2Icon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(wh)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Menampilkan {warehouses.length > 0 ? (page - 1) * limit + 1 : 0} hingga{" "}
              {Math.min(page * limit, totalCount)} dari {totalCount} gudang
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeftIcon className="size-3.5" />
                Sebelumnya
              </Button>
              <div className="text-xs font-medium">
                Halaman {page} dari {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 gap-1 text-xs"
              >
                Selanjutnya
                <ChevronRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Warehouse Modal Dialog */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouse={selectedWarehouse}
        onSave={handleSaveWarehouse}
      />

      {/* Confirm Action Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
      />
    </SidebarInset>
  )
}
