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
import { deliveryService } from "@/services/delivery.service"
import { DeliveryDialog } from "@/pages/sales/delivery-dialog"
import { InvoiceDialog } from "@/pages/sales/invoice-dialog"
import type { Delivery, DeliveryMetrics } from "@/types/delivery.types"
import {
  SunIcon,
  MoonIcon,
  TruckIcon,
  CheckCircle2Icon,
  ClockIcon,
  NavigationIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PrinterIcon,
  CheckIcon,
  Loader2Icon,
  PackageOpenIcon,
  AlertTriangleIcon,
  FileTextIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function DeliveriesPage() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [metrics, setMetrics] = useState<DeliveryMetrics>({
    totalDeliveries: 0,
    deliveredCount: 0,
    inTransitCount: 0,
    readyCount: 0,
    onTimeRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState("delivery_date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [selectedDeliveryForInvoice, setSelectedDeliveryForInvoice] = useState<number | null>(null)
  const [previewItem, setPreviewItem] = useState<Delivery | null>(null)
  const [printItem, setPrintItem] = useState<Delivery | null>(null)

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
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, metricsRes] = await Promise.all([
        deliveryService.getDeliveries({
          page,
          limit,
          search: search || undefined,
          status: statusFilter !== "Semua" ? statusFilter : undefined,
          sort: sortField,
          order: sortOrder,
        }),
        deliveryService.getDeliveryMetrics(),
      ])

      setDeliveries(listRes.items || [])
      setTotalPages(listRes.pagination?.totalPages || 1)
      setTotalCount(listRes.pagination?.total || 0)
      setMetrics(metricsRes)
    } catch {
      setErrorFeedback("Gagal memuat data pengiriman.")
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

  // Atomic Confirm & Stock Deduction
  const handleConfirmAndDeductStock = (item: Delivery) => {
    setConfirmModal({
      open: true,
      title: "Konfirmasi Muat & Kirim (Potong Stok)",
      description: `Konfirmasi pengiriman ${item.deliveryNo}? Stok akan otomatis terpotong dari gudang ${item.warehouse || "asal"} dan pergerakan stok (stock movement) akan dicatat.`,
      variant: "success",
      confirmText: "Kirim & Potong Stok",
      onConfirm: async () => {
        try {
          await deliveryService.confirmDelivery(item.id)
          setFeedback(`Surat Jalan ${item.deliveryNo} berhasil dikonfirmasi dan stok gudang telah terpotong!`)
          setErrorFeedback(null)
          fetchData()
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string }
          setErrorFeedback(e.response?.data?.message || e.message || "Gagal mengonfirmasi pengiriman. Cek ketersediaan stok di gudang.")
        }
      },
    })
  }

  const handleCompleteDelivery = (item: Delivery) => {
    setConfirmModal({
      open: true,
      title: "Tandai Pengiriman Diterima",
      description: `Apakah paket dengan nomor surat jalan ${item.deliveryNo} sudah sampai di customer ${item.customerName}?`,
      variant: "default",
      confirmText: "Tandai Diterima",
      onConfirm: async () => {
        try {
          await deliveryService.completeDelivery(item.id)
          setFeedback(`Pengiriman ${item.deliveryNo} telah selesai dan diterima klien.`)
          setErrorFeedback(null)
          fetchData()
        } catch {
          setErrorFeedback("Gagal memperbarui status pengiriman.")
        }
      },
    })
  }

  const handleDeleteSingle = (id: number, no: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Surat Jalan",
      description: `Apakah Anda yakin ingin menghapus surat jalan ${no}?`,
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await deliveryService.deleteDelivery(id)
          setFeedback(`Surat Jalan ${no} berhasil dihapus.`)
          fetchData()
        } catch {
          setErrorFeedback("Gagal menghapus surat jalan.")
        }
      },
    })
  }

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
                <BreadcrumbPage>Surat Jalan & Pengiriman (Deliveries)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={toggleTheme}
          className="cursor-pointer hover:bg-accent active:scale-95 transition-all"
        >
          {resolvedTheme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4 text-slate-700" />}
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Surat Jalan & Pengiriman (Deliveries)</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Kelola ekspedisi, cetak surat jalan, dan sinkronisasi pemotongan stok gudang secara otomatis.</p>
          </div>
        </div>

        {feedback && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckIcon className="size-4" />
            <span>{feedback}</span>
          </div>
        )}

        {errorFeedback && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
            <AlertTriangleIcon className="size-4" />
            <span>{errorFeedback}</span>
          </div>
        )}

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Surat Jalan</span>
              <TruckIcon className="size-4 text-muted-foreground/70" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{metrics.totalDeliveries}</div>
            <div className="mt-2 text-xs text-muted-foreground">Surat jalan diterbitkan</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Siap Dimuat</span>
              <ClockIcon className="size-4 text-purple-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{metrics.readyCount}</div>
            <div className="mt-2 text-xs text-muted-foreground">Menunggu konfirmasi potong stok</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dalam Perjalanan</span>
              <NavigationIcon className="size-4 text-blue-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{metrics.inTransitCount}</div>
            <div className="mt-2 text-xs text-muted-foreground">Stok telah dipotong dari gudang</div>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telah Diterima</span>
              <CheckCircle2Icon className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{metrics.deliveredCount}</div>
            <div className="mt-2 text-xs text-muted-foreground">On-Time Rate: {metrics.onTimeRate}%</div>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari No. DO, armada, order..."
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
                  <option value="Siap Muat" className="bg-popover text-popover-foreground">Siap Muat</option>
                  <option value="Dalam Perjalanan" className="bg-popover text-popover-foreground">Dalam Perjalanan</option>
                  <option value="Diterima" className="bg-popover text-popover-foreground">Diterima</option>
                  <option value="Kendala Pengiriman" className="bg-popover text-popover-foreground">Kendala Pengiriman</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFeedback("File data pengiriman berhasil disiapkan.")
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
                Buat Surat Jalan
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("delivery_number")}>
                    <div className="flex items-center gap-1">No. Surat Jalan <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("delivery_date")}>
                    <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3">Ref. Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Armada / Kurir</th>
                  <th className="p-3">Gudang</th>
                  <th className="p-3 text-right">Total Item</th>
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
                        <span>Memuat data pengiriman...</span>
                      </div>
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Tidak ada data surat jalan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="p-3 font-mono font-semibold text-foreground">
                          <div>{item.deliveryNo}</div>
                          {item.trackingNumber && item.trackingNumber !== "-" && (
                            <div className="text-[10px] text-muted-foreground">Resi: {item.trackingNumber}</div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{item.date}</td>
                        <td className="p-3 font-mono text-muted-foreground">{item.refOrder}</td>
                        <td className="p-3 font-medium text-foreground">{item.customerName}</td>
                        <td className="p-3 text-muted-foreground">{item.courierFleet || "-"}</td>
                        <td className="p-3 text-muted-foreground">{item.warehouse || "Gudang Utama"}</td>
                        <td className="p-3 text-right font-mono font-medium text-foreground">{item.totalItems} Unit</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === "Diterima"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : item.status === "Dalam Perjalanan"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : item.status === "Siap Muat"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Preview detail */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPreviewItem(item)}
                              title="Lihat Detail"
                              className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>

                            {/* Print modal */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPrintItem(item)}
                              title="Cetak Surat Jalan"
                              className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <PrinterIcon className="size-3.5" />
                            </Button>

                            {/* Atomic Stock Deduction & Ship */}
                            {item.status === "Siap Muat" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleConfirmAndDeductStock(item)}
                                title="Kirim & Potong Stok"
                                className="cursor-pointer hover:bg-purple-500/10 text-purple-600 active:scale-95 transition-all"
                              >
                                <PackageOpenIcon className="size-3.5" />
                              </Button>
                            )}

                            {/* Complete / Received */}
                            {item.status === "Dalam Perjalanan" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleCompleteDelivery(item)}
                                title="Tandai Diterima"
                                className="cursor-pointer hover:bg-emerald-500/10 text-emerald-600 active:scale-95 transition-all"
                              >
                                <CheckCircle2Icon className="size-3.5" />
                              </Button>
                            )}

                            {/* Issue Invoice from Delivery */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setSelectedDeliveryForInvoice(item.id)
                                setInvoiceDialogOpen(true)
                              }}
                              title="Terbitkan Faktur (Invoice)"
                              className="cursor-pointer hover:bg-blue-500/10 text-blue-600 active:scale-95 transition-all"
                            >
                              <FileTextIcon className="size-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteSingle(item.id, item.deliveryNo)}
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

      {/* Create Delivery Dialog */}
      <DeliveryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setFeedback("Surat jalan berhasil dibuat dan siap dimuat.")
          fetchData()
        }}
      />

      {/* Issue Invoice Dialog */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        preselectedDeliveryId={selectedDeliveryForInvoice}
        onSuccess={() => {
          setFeedback("Faktur komersial berhasil diterbitkan dari Surat Jalan!")
          setTimeout(() => setFeedback(null), 3500)
        }}
      />

      {/* Preview Dialog */}
      {previewItem && (
        <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Detail Pengiriman: {previewItem.deliveryNo}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Ref Order: {previewItem.refOrder} | Customer: {previewItem.customerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground">Gudang Asal: </span>
                  <span className="font-semibold text-foreground">{previewItem.warehouse || "Gudang Utama Cakung"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tanggal Kirim: </span>
                  <span className="font-semibold text-foreground">{previewItem.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Armada: </span>
                  <span className="font-semibold text-foreground">{previewItem.courierFleet || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">No. Resi: </span>
                  <span className="font-semibold text-foreground">{previewItem.trackingNumber || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span className="font-semibold text-foreground">{previewItem.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dibuat Oleh: </span>
                  <span className="font-semibold text-foreground">{previewItem.creator || "Admin"}</span>
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
                  Item Barang yang Dimuat
                </div>
                <div className="border rounded-md divide-y">
                  {previewItem.items && previewItem.items.length > 0 ? (
                    previewItem.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5">
                        <div>
                          <div className="font-medium text-foreground">{it.productName || it.product?.name || `Produk #${it.product_id}`}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Kode SKU: {it.productCode || it.product?.code || "-"}
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-foreground">
                          {it.quantity} Unit
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">Tidak ada rincian item</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t font-semibold text-sm">
                <span>Total Muatan:</span>
                <span className="font-mono text-primary">{previewItem.totalItems} Unit</span>
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

      {/* Print Surat Jalan Modal */}
      {printItem && (
        <Dialog open={Boolean(printItem)} onOpenChange={(open) => !open && setPrintItem(null)}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <div className="p-4 border border-dashed rounded-lg bg-white text-slate-900 font-sans space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">MECCA DISTRIBUTION</h2>
                  <p className="text-[11px] text-slate-500">PT Mecca Distribusi Solusindo</p>
                  <p className="text-[11px] text-slate-500">Kawasan Pergudangan Cakung, Jakarta Timur</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold uppercase tracking-wider text-slate-900">SURAT JALAN</div>
                  <div className="font-mono text-xs font-semibold text-slate-700">{printItem.deliveryNo}</div>
                  <div className="text-[11px] text-slate-500">Tanggal: {printItem.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Tujuan Pengiriman:</div>
                  <div className="font-bold text-slate-900 mt-1">{printItem.customerName}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">Ref. Order: {printItem.refOrder}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Detail Ekspedisi:</div>
                  <div className="font-bold text-slate-900 mt-1">Armada: {printItem.courierFleet || "-"}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">Gudang: {printItem.warehouse || "Gudang Utama"}</div>
                  <div className="text-slate-600 text-[11px]">Resi: {printItem.trackingNumber || "-"}</div>
                </div>
              </div>

              <div>
                <table className="w-full text-xs border text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border">No.</th>
                      <th className="p-2 border">Kode Barang</th>
                      <th className="p-2 border">Deskripsi Barang</th>
                      <th className="p-2 border text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printItem.items && printItem.items.map((it, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 border text-center">{idx + 1}</td>
                        <td className="p-2 border font-mono">{it.productCode || it.product?.code || "-"}</td>
                        <td className="p-2 border">{it.productName || it.product?.name || `Produk #${it.product_id}`}</td>
                        <td className="p-2 border text-right font-mono font-bold">{it.quantity} Unit</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="p-2 border text-right">TOTAL MUATAN:</td>
                      <td className="p-2 border text-right font-mono">{printItem.totalItems} Unit</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-6 text-center text-xs">
                <div>
                  <div className="text-slate-500 mb-10">Penerima,</div>
                  <div className="border-t border-slate-400 mx-4 pt-1 text-slate-700">( ........................ )</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-10">Sopir / Kurir,</div>
                  <div className="border-t border-slate-400 mx-4 pt-1 text-slate-700">( ........................ )</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-10">Hormat Kami,</div>
                  <div className="border-t border-slate-400 mx-4 pt-1 text-slate-700">( Gudang Mecca )</div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setPrintItem(null)}>
                Tutup
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <PrinterIcon className="size-3.5 mr-1.5" />
                Cetak Dokumen
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
