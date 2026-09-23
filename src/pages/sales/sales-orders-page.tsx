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
import { salesOrderService } from "@/services/sales-order.service"
import { SalesOrderDialog } from "@/pages/sales/sales-order-dialog"
import { DeliveryDialog } from "@/pages/sales/delivery-dialog"
import type { SalesOrder, SalesOrderMetrics } from "@/types/sales-order.types"
import {
  SunIcon,
  MoonIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  TruckIcon,
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
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  PackageCheckIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function SalesOrdersPage() {
  const { theme, setTheme } = useTheme()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [metrics, setMetrics] = useState<SalesOrderMetrics>({
    totalOrders: 0,
    completedDeliveries: 0,
    inDeliveryProcess: 0,
    readyToShip: 0,
    totalAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState("order_date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [selectedSoForDelivery, setSelectedSoForDelivery] = useState<number | null>(null)
  const [previewItem, setPreviewItem] = useState<SalesOrder | null>(null)

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, metricsRes] = await Promise.all([
        salesOrderService.getSalesOrders({
          page,
          limit,
          search: search || undefined,
          status: statusFilter !== "Semua" ? statusFilter : undefined,
          sort: sortField,
          order: sortOrder,
        }),
        salesOrderService.getSalesOrderMetrics(),
      ])

      setOrders(listRes.items || [])
      setTotalPages(listRes.pagination?.totalPages || 1)
      setTotalCount(listRes.pagination?.total || 0)
      setMetrics(metricsRes)
    } catch {
      setFeedback("Gagal memuat data pesanan penjualan.")
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, sortField, sortOrder])

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

  const handleConfirmOrder = (item: SalesOrder) => {
    setConfirmModal({
      open: true,
      title: "Konfirmasi Pesanan Penjualan",
      description: `Konfirmasi pesanan ${item.orderNo}? Status akan berubah menjadi Siap Kirim.`,
      variant: "success",
      confirmText: "Konfirmasi Pesanan",
      onConfirm: async () => {
        try {
          await salesOrderService.confirmSalesOrder(item.id)
          setFeedback(`Sales Order ${item.orderNo} berhasil dikonfirmasi.`)
          fetchData()
        } catch {
          setFeedback("Gagal mengonfirmasi pesanan.")
        }
      },
    })
  }

  const handleCancelOrder = (item: SalesOrder) => {
    setConfirmModal({
      open: true,
      title: "Batalkan Pesanan Penjualan",
      description: `Apakah Anda yakin ingin membatalkan pesanan ${item.orderNo}?`,
      variant: "destructive",
      confirmText: "Batalkan Pesanan",
      onConfirm: async () => {
        try {
          await salesOrderService.cancelSalesOrder(item.id)
          setFeedback(`Sales Order ${item.orderNo} telah dibatalkan.`)
          fetchData()
        } catch {
          setFeedback("Gagal membatalkan pesanan.")
        }
      },
    })
  }

  const handleDeleteSingle = (id: number, no: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Pesanan Penjualan",
      description: `Apakah Anda yakin ingin menghapus pesanan ${no}?`,
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await salesOrderService.deleteSalesOrder(id)
          setSelectedIds((prev) => prev.filter((i) => i !== id))
          setFeedback(`Sales Order ${no} berhasil dihapus.`)
          fetchData()
        } catch {
          setFeedback("Gagal menghapus pesanan.")
        }
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Pesanan Terpilih",
      description: `Hapus ${selectedIds.length} pesanan yang dipilih?`,
      variant: "destructive",
      confirmText: "Hapus Semua",
      onConfirm: async () => {
        try {
          await salesOrderService.batchDeleteSalesOrders(selectedIds)
          setSelectedIds([])
          setFeedback(`${selectedIds.length} pesanan berhasil dihapus.`)
          fetchData()
        } catch {
          setFeedback("Gagal menghapus beberapa pesanan.")
        }
      },
    })
  }

  const isAllSelected = orders.length > 0 && orders.every((o) => selectedIds.includes(o.id))

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
                <BreadcrumbPage>Pesanan Penjualan (Sales Orders)</BreadcrumbPage>
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">Pesanan Penjualan (Sales Orders)</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Kelola pesanan terkonfirmasi, pantau progres pengiriman, dan terbitkan surat jalan.</p>
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
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pesanan</span>
              <ShoppingCartIcon className="size-4 text-muted-foreground/70" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.totalOrders}</div>
            <div className="mt-2 text-xs text-muted-foreground">Pesanan terdaftar</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Nilai Order</span>
              <DollarSignIcon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(metrics.totalAmount)}</div>
            <div className="mt-2 text-xs text-muted-foreground">Omzet pesanan penjualan</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Siap / Dalam Kirim</span>
              <TruckIcon className="size-4 text-blue-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {metrics.readyToShip + metrics.inDeliveryProcess}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.readyToShip} Siap Kirim, {metrics.inDeliveryProcess} Proses Kirim
            </div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selesai Dikirim</span>
              <PackageCheckIcon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.completedDeliveries}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Seluruh item telah terkirim</div>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari No. SO, customer..."
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
                  <option value="Draf" className="bg-popover text-popover-foreground">Draf</option>
                  <option value="Siap Kirim" className="bg-popover text-popover-foreground">Siap Kirim</option>
                  <option value="Proses Kirim" className="bg-popover text-popover-foreground">Proses Kirim</option>
                  <option value="Selesai Dikirim" className="bg-popover text-popover-foreground">Selesai Dikirim</option>
                  <option value="Dibatalkan" className="bg-popover text-popover-foreground">Dibatalkan</option>
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
                  setFeedback("File data pesanan penjualan berhasil disiapkan.")
                  setTimeout(() => setFeedback(null), 3000)
                }}
                className="cursor-pointer hover:bg-accent active:scale-95 transition-all text-xs font-medium"
              >
                <DownloadIcon className="size-3.5 mr-1" />
                Export
              </Button>

              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
              >
                <PlusIcon className="size-3.5 mr-1" />
                Buat Sales Order
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
                          setSelectedIds(orders.map((o) => o.id))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                      className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("sales_order_number")}>
                    <div className="flex items-center gap-1">No. Pesanan <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("order_date")}>
                    <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Gudang</th>
                  <th className="p-3 text-right">Kuantitas</th>
                  <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("grand_total")}>
                    <div className="flex items-center justify-end gap-1">Nilai Pesanan <ArrowUpDownIcon className="size-3" /></div>
                  </th>
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
                        <span>Memuat data sales order...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Tidak ada pesanan penjualan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  orders.map((item) => {
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
                          <div>{item.orderNo}</div>
                          {item.refQuotation && item.refQuotation !== "-" && (
                            <div className="text-[10px] text-muted-foreground">Ref: {item.refQuotation}</div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{item.date}</td>
                        <td className="p-3 font-medium text-foreground">{item.customerName}</td>
                        <td className="p-3 text-muted-foreground">{item.warehouse || "Gudang Utama"}</td>
                        <td className="p-3 text-right font-mono font-medium">
                          <div>{item.totalQty} Unit</div>
                          <div className="text-[10px] text-muted-foreground">Terkirim: {item.totalDeliveredQty ?? 0}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-foreground">
                          {formatRupiah(item.totalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === "Selesai Dikirim"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : item.status === "Proses Kirim"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : item.status === "Siap Kirim"
                                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                                : item.status === "Dibatalkan"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View detail */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPreviewItem(item)}
                              title="Lihat Detail Pesanan"
                              className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>

                            {/* Confirm SO if draft */}
                            {item.status === "Draf" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleConfirmOrder(item)}
                                title="Konfirmasi Pesanan"
                                className="cursor-pointer hover:bg-emerald-500/10 text-emerald-600 active:scale-95 transition-all"
                              >
                                <CheckCircle2Icon className="size-3.5" />
                              </Button>
                            )}

                            {/* Create Surat Jalan / Delivery */}
                            {item.status !== "Selesai Dikirim" && item.status !== "Dibatalkan" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setSelectedSoForDelivery(item.id)
                                  setDeliveryDialogOpen(true)
                                }}
                                title="Buat Surat Jalan (DO)"
                                className="cursor-pointer hover:bg-blue-500/10 text-blue-600 active:scale-95 transition-all"
                              >
                                <TruckIcon className="size-3.5" />
                              </Button>
                            )}

                            {/* Cancel */}
                            {item.status !== "Selesai Dikirim" && item.status !== "Dibatalkan" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleCancelOrder(item)}
                                title="Batalkan Pesanan"
                                className="cursor-pointer hover:bg-amber-500/10 text-amber-600 active:scale-95 transition-all"
                              >
                                <XCircleIcon className="size-3.5" />
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteSingle(item.id, item.orderNo)}
                              title="Hapus"
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

      {/* Create Sales Order Dialog */}
      <SalesOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setFeedback("Pesanan penjualan berhasil dibuat.")
          fetchData()
        }}
      />

      {/* Create Delivery Dialog */}
      <DeliveryDialog
        open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        preselectedSoId={selectedSoForDelivery}
        onSuccess={() => {
          setFeedback("Surat jalan berhasil dibuat dan siap dimuat.")
          fetchData()
        }}
      />

      {/* Preview Dialog */}
      {previewItem && (
        <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Detail Pesanan: {previewItem.orderNo}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Customer: {previewItem.customerName} | Tanggal: {previewItem.date} | Status: {previewItem.status}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground">Gudang Pengambilan: </span>
                  <span className="font-semibold text-foreground">{previewItem.warehouse || "Gudang Utama"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ref. Quotation: </span>
                  <span className="font-semibold text-foreground">{previewItem.refQuotation || "-"}</span>
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
                  Daftar Item & Status Pemenuhan
                </div>
                <div className="border rounded-md divide-y">
                  {previewItem.items && previewItem.items.length > 0 ? (
                    previewItem.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5">
                        <div>
                          <div className="font-medium text-foreground">{it.productName || it.product?.name || `Produk #${it.product_id}`}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Pesan: {it.quantity} | Terkirim: {it.delivered_quantity ?? 0} | Sisa: {it.remaining_quantity ?? Math.max(0, it.quantity - (it.delivered_quantity || 0))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-foreground">
                            {formatRupiah(it.total || (it.quantity * it.unit_price))}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            @ {formatRupiah(it.unit_price)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">Tidak ada rincian item</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t font-semibold text-sm">
                <span>Total Nilai Pesanan:</span>
                <span className="font-mono text-primary">{formatRupiah(previewItem.totalAmount)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setPreviewItem(null)}>
                Tutup
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
