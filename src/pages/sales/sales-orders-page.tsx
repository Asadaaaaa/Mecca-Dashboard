import { useState, useEffect, useCallback } from "react"
import { useTheme } from "@/components/theme-provider"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { salesOrderService } from "@/services/sales-order.service"
import { SalesOrderDialog } from "@/pages/sales/sales-order-dialog"
import { DeliveryDialog } from "@/pages/sales/delivery-dialog"
import { usePermission } from "@/hooks/use-permission"
import type { SalesOrder, SalesOrderMetrics } from "@/types/sales-order.types"
import {
  SunIcon,
  MoonIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  TruckIcon,
  SearchIcon,
  PlusIcon,
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
  PencilIcon,
  PrinterIcon,
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
  const { resolvedTheme, toggleTheme } = useTheme()
  const { canDelete } = usePermission()
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
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState("order_date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null)
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [selectedSoForDelivery, setSelectedSoForDelivery] = useState<number | null>(null)
  const [previewItem, setPreviewItem] = useState<SalesOrder | null>(null)
  const [printItem, setPrintItem] = useState<SalesOrder | null>(null)

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

  const handleEditOrder = async (item: SalesOrder) => {
    try {
      const fullOrder = await salesOrderService.getSalesOrderById(item.id)
      setEditingOrder(fullOrder || item)
    } catch {
      setEditingOrder(item)
    }
    setDialogOpen(true)
  }

  const handleOpenPrint = async (item: SalesOrder) => {
    try {
      const fullOrder = await salesOrderService.getSalesOrderById(item.id)
      setPrintItem(fullOrder || item)
    } catch {
      setPrintItem(item)
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
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string }
          setFeedback(e.response?.data?.message || e.message || "Gagal mengonfirmasi pesanan.")
        }
      },
    })
  }

  const handleCancelOrder = (item: SalesOrder) => {
    setConfirmModal({
      open: true,
      title: "Batalkan Pesanan Penjualan",
      description: `Apakah Anda yakin ingin membatalkan pesanan ${item.orderNo}? Alokasi stok pesanan ini akan dibebaskan.`,
      variant: "warning",
      confirmText: "Batalkan Pesanan",
      onConfirm: async () => {
        try {
          await salesOrderService.cancelSalesOrder(item.id)
          setFeedback(`Sales Order ${item.orderNo} berhasil dibatalkan.`)
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
      description: `Apakah Anda yakin ingin menghapus pesanan ${no}? Tindakan ini tidak dapat dibatalkan.`,
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await salesOrderService.deleteSalesOrder(id)
          setFeedback(`Sales Order ${no} berhasil dihapus.`)
          fetchData()
        } catch {
          setFeedback("Gagal menghapus pesanan.")
        }
      },
    })
  }

  const handlePrintDirect = () => {
    if (!printItem) return

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    const warehouseName =
      typeof printItem.warehouse === "object"
        ? (printItem.warehouse as { name?: string })?.name || "Gudang Utama"
        : printItem.warehouse || "Gudang Utama"

    const itemsRows = (printItem.items || [])
      .map(
        (it, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace;">${it.productCode || it.product?.code || "-"}</td>
          <td>${it.productName || it.product?.name || `Produk #${it.product_id}`}</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace;">${it.quantity}</td>
          <td style="text-align: right; font-family: monospace;">${formatRupiah(it.unit_price)}</td>
          <td style="text-align: right; font-family: monospace;">${it.discount_amount ? formatRupiah(it.discount_amount) : "-"}</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace;">${formatRupiah(it.total || (it.quantity * it.unit_price))}</td>
        </tr>
      `
      )
      .join("")

    const contentHtml = `
      <div class="pdf-container">
        <div class="header">
          <div>
            <div class="company-name">MECCA DISTRIBUTION</div>
            <div class="company-sub">PT MECCA DISTRIBUSI SOLUSINDO</div>
            <div class="company-address">Kawasan Pergudangan Cakung Blok B-12, Jakarta Timur 13910</div>
            <div class="company-address">Telp: (021) 8901-2345 | sales@mecca.co.id</div>
          </div>
          <div class="doc-badge">
            <div class="doc-title">PESANAN PENJUALAN</div>
            <div class="doc-no">${printItem.orderNo}</div>
            <div class="doc-date">Tanggal: ${printItem.date}</div>
            <div class="doc-status">Status: ${printItem.status}</div>
          </div>
        </div>

        <hr class="divider" />

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">PELANGGAN (CUSTOMER):</div>
            <div class="info-title">${printItem.customerName}</div>
            <div class="info-detail">Ref. Penawaran: <strong>${printItem.refQuotation || "-"}</strong></div>
            <div class="info-detail">Gudang Pemenuhan: <strong>${warehouseName}</strong></div>
          </div>
          <div class="info-card">
            <div class="info-label">TUJUAN PENGIRIMAN & PENERIMA:</div>
            <div class="info-title">${printItem.recipient_name || printItem.customerName}</div>
            <div class="info-detail">Telepon / HP: <strong>${printItem.recipient_phone || printItem.customer?.phone || "-"}</strong></div>
            <div class="info-detail">Alamat Kirim: ${printItem.shipping_address || printItem.customer?.address || "Sesuai alamat kontrak"}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">NO</th>
              <th style="width: 120px;">KODE BARANG</th>
              <th>NAMA BARANG</th>
              <th style="width: 70px; text-align: right;">QTY</th>
              <th style="width: 110px; text-align: right;">HARGA</th>
              <th style="width: 80px; text-align: right;">DISKON</th>
              <th style="width: 120px; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="notes-box">
            <div class="notes-title">Catatan / Instruksi Pengiriman:</div>
            <div class="notes-content">${printItem.notes || "Tidak ada catatan khusus."}</div>
          </div>
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span style="font-family: monospace;">${formatRupiah(printItem.subtotal)}</span>
            </div>
            ${
              printItem.discount_amount > 0
                ? `<div class="totals-row">
                    <span>Diskon:</span>
                    <span style="font-family: monospace; color: #dc2626;">- ${formatRupiah(printItem.discount_amount)}</span>
                  </div>`
                : ""
            }
            ${
              printItem.tax_amount > 0
                ? `<div class="totals-row">
                    <span>PPN:</span>
                    <span style="font-family: monospace;">+ ${formatRupiah(printItem.tax_amount)}</span>
                  </div>`
                : ""
            }
            <div class="totals-row grand-total">
              <span>Grand Total:</span>
              <span style="font-family: monospace;">${formatRupiah(printItem.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">Pemesan / Pelanggan,</div>
            <div class="sig-space"></div>
            <div class="sig-line">( ${printItem.customerName} )</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Bagian Gudang / Logistik,</div>
            <div class="sig-space"></div>
            <div class="sig-line">(                          )</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Sales / Finance Dept.,</div>
            <div class="sig-space"></div>
            <div class="sig-line">( PT Mecca Distribusi Solusindo )</div>
          </div>
        </div>

        <div class="footer-note">
          * Dokumen Pesanan Penjualan ini dicetak otomatis dari sistem ERP Mecca Distribusi Solusindo *
        </div>
      </div>
    `

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pesanan Penjualan - ${printItem.orderNo}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm 15mm 15mm 15mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              color: #1e293b;
              margin: 0;
              padding: 0;
            }
            .pdf-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 12px;
            }
            .company-name {
              font-size: 16px;
              font-weight: 800;
              letter-spacing: 0.5px;
              color: #0f172a;
            }
            .company-sub {
              font-size: 12px;
              font-weight: 700;
              color: #2563eb;
              margin-top: 1px;
            }
            .company-address {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .doc-badge {
              text-align: right;
            }
            .doc-title {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .doc-no {
              font-family: monospace;
              font-size: 13px;
              font-weight: 700;
              color: #2563eb;
              margin-top: 2px;
            }
            .doc-date, .doc-status {
              font-size: 10px;
              color: #64748b;
              margin-top: 1px;
            }
            .divider {
              border: none;
              border-top: 1.5px solid #cbd5e1;
              margin: 10px 0 12px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 14px;
            }
            .info-card {
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 9px 12px;
              background-color: #f8fafc;
            }
            .info-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-title {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .info-detail {
              font-size: 10.5px;
              color: #334155;
              line-height: 1.4;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            .table th {
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
              font-size: 10px;
              font-weight: 700;
              color: #334155;
              text-align: left;
            }
            .table td {
              border: 1px solid #e2e8f0;
              padding: 6px 8px;
              font-size: 10.5px;
            }
            .totals-section {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 20px;
            }
            .notes-box {
              flex: 1;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 12px;
              background-color: #f8fafc;
            }
            .notes-title {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 4px;
            }
            .notes-content {
              font-size: 10.5px;
              color: #334155;
            }
            .totals-box {
              width: 260px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 12px;
              background-color: #f8fafc;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 4px;
            }
            .totals-row.grand-total {
              font-size: 12.5px;
              font-weight: 800;
              color: #0f172a;
              border-top: 1px dashed #cbd5e1;
              padding-top: 6px;
              margin-top: 6px;
              margin-bottom: 0;
            }
            .signatures {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-top: 24px;
              text-align: center;
            }
            .sig-box {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .sig-title {
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
            }
            .sig-space {
              height: 48px;
            }
            .sig-line {
              font-size: 10px;
              font-weight: 700;
              color: #1e293b;
              border-top: 1px solid #94a3b8;
              width: 80%;
              padding-top: 4px;
            }
            .footer-note {
              margin-top: 24px;
              font-size: 9px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }, 300)
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/40 px-6 bg-background/95 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="size-5 text-primary" />
            <h1 className="text-base font-semibold text-foreground">
              Pesanan Penjualan (Sales Orders)
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="cursor-pointer hover:bg-accent"
          >
            {resolvedTheme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        {feedback && (
          <div className="flex items-center justify-between p-3.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
            <span>{feedback}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedback(null)}
              className="h-6 px-2 text-xs"
            >
              Tutup
            </Button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Pesanan
              </CardTitle>
              <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ShoppingCartIcon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {metrics.totalOrders}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Semua SO terdata di sistem
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Siap Dikirim
              </CardTitle>
              <div className="size-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <CheckIcon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {metrics.readyToShip}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Menunggu pembuatan surat jalan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Proses Pengiriman
              </CardTitle>
              <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <TruckIcon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {metrics.inDeliveryProcess}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Sebagian barang sedang dikirim
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Nilai Penjualan
              </CardTitle>
              <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSignIcon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground font-mono">
                {formatRupiah(metrics.totalAmount)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Akumulasi seluruh pesanan aktif
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="bg-card shadow-xs border-border/60">
          {/* Controls */}
          <div className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between border-b border-border/60">
            <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari No. SO atau Customer..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 h-8 text-xs bg-background"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <FilterIcon className="size-3.5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Draf">Draf</option>
                  <option value="Siap Kirim">Siap Kirim</option>
                  <option value="Proses Kirim">Proses Kirim</option>
                  <option value="Selesai Dikirim">Selesai Dikirim</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setEditingOrder(null)
                  setDialogOpen(true)
                }}
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
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("sales_order_number")}>
                    <div className="flex items-center gap-1">No. Pesanan <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("order_date")}>
                    <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3">Customer / Pelanggan</th>
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
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2Icon className="size-4 animate-spin text-primary" />
                        <span>Memuat data sales order...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Tidak ada pesanan penjualan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  orders.map((item) => {
                    const isEditable =
                      item.status !== "Proses Kirim" &&
                      item.status !== "Selesai Dikirim" &&
                      item.status !== "Dibatalkan"

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="p-3 font-mono font-semibold text-foreground">
                          <div>{item.orderNo}</div>
                          {item.refQuotation && item.refQuotation !== "-" && (
                            <div className="text-[10px] text-muted-foreground font-normal">Ref: {item.refQuotation}</div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{item.date}</td>
                        <td className="p-3 font-medium text-foreground">
                          <div>{item.customerName}</div>
                          {item.recipient_name && item.recipient_name !== item.customerName && (
                            <div className="text-[10px] text-muted-foreground">Penerima: {item.recipient_name}</div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {typeof item.warehouse === "object" ? item.warehouse?.name : item.warehouse || "Gudang Utama"}
                        </td>
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

                            {/* Edit Sales Order (Only if not processed/shipped) */}
                            {isEditable && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleEditOrder(item)}
                                title="Edit Pesanan Penjualan"
                                className="cursor-pointer hover:bg-amber-500/10 text-amber-600 active:scale-95 transition-all"
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                            )}

                            {/* Download / Cetak Dokumen Pesanan Penjualan */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleOpenPrint(item)}
                              title="Cetak / Download Pesanan Penjualan"
                              className="cursor-pointer hover:bg-primary/10 text-primary active:scale-95 transition-all"
                            >
                              <PrinterIcon className="size-3.5" />
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
                            {canDelete("sales-orders") && isEditable && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.orderNo)}
                                title="Hapus"
                                className="cursor-pointer hover:bg-red-500/10 text-red-500 hover:text-red-600 active:scale-95 transition-all"
                              >
                                <Trash2Icon className="size-3.5" />
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

      {/* Create / Edit Sales Order Dialog */}
      <SalesOrderDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingOrder(null)
        }}
        salesOrder={editingOrder}
        onSuccess={() => {
          setFeedback(editingOrder ? "Pesanan penjualan berhasil diperbarui." : "Pesanan penjualan berhasil dibuat.")
          setEditingOrder(null)
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
              {/* Store & Customer Identity Info */}
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] pb-2 border-b border-border/50">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Toko / Pengirim
                    </span>
                    <span className="font-semibold text-foreground">PT MECCA DISTRIBUSI SOLUSINDO</span>
                    <div className="text-[10px] text-muted-foreground">
                      Kawasan Pergudangan Cakung Blok B-12, Jakarta Timur 13910 | Telp: (021) 8901-2345
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Customer:</span>
                    <span className="font-semibold text-foreground">{previewItem.customerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Penerima & Kontak:</span>
                    <span className="font-semibold text-foreground">
                      {previewItem.recipient_name || previewItem.customerName} {previewItem.recipient_phone ? `(${previewItem.recipient_phone})` : ""}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-[10px] block">Alamat Pengiriman:</span>
                    <span className="text-foreground">
                      {previewItem.shipping_address || previewItem.customer?.address || "Sesuai alamat terdaftar pelanggan"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground">Gudang Pemenuhan: </span>
                  <span className="font-semibold text-foreground">
                    {typeof previewItem.warehouse === "object" ? previewItem.warehouse?.name : previewItem.warehouse || "Gudang Utama"}
                  </span>
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

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const itemToPrint = previewItem
                  setPreviewItem(null)
                  handleOpenPrint(itemToPrint)
                }}
                className="text-xs gap-1.5"
              >
                <PrinterIcon className="size-3.5" />
                Cetak / Download PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPreviewItem(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print / Download Sales Order Document Modal */}
      {printItem && (
        <Dialog open={Boolean(printItem)} onOpenChange={(open) => !open && setPrintItem(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center justify-between">
                <span>Cetak / Download Pesanan Penjualan</span>
                <span className="font-mono text-xs font-bold text-primary">{printItem.orderNo}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pratinjau resmi dokumen pesanan penjualan PT Mecca Distribusi Solusindo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Document Paper Preview */}
              <div className="border rounded-lg p-5 bg-card shadow-xs space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <div className="font-bold text-sm text-foreground">MECCA DISTRIBUTION</div>
                    <div className="font-semibold text-xs text-primary">PT MECCA DISTRIBUSI SOLUSINDO</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Kawasan Pergudangan Cakung Blok B-12, Jakarta Timur 13910
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Telp: (021) 8901-2345 | sales@mecca.co.id
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">PESANAN PENJUALAN</div>
                    <div className="font-mono font-bold text-primary text-xs mt-0.5">{printItem.orderNo}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Tanggal: {printItem.date}</div>
                    <div className="text-[10px] font-semibold uppercase text-cyan-600 mt-0.5">{printItem.status}</div>
                  </div>
                </div>

                {/* Recipient & Customer Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-lg border">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Pelanggan (Customer):
                    </div>
                    <div className="font-semibold text-foreground">{printItem.customerName}</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">
                      Ref Quotation: <span className="font-medium text-foreground">{printItem.refQuotation || "-"}</span>
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      Gudang: <span className="font-medium text-foreground">
                        {typeof printItem.warehouse === "object" ? printItem.warehouse?.name : printItem.warehouse || "Gudang Utama"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      Penerima & Alamat Kirim:
                    </div>
                    <div className="font-semibold text-foreground">{printItem.recipient_name || printItem.customerName}</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">
                      Kontak: <span className="font-medium text-foreground">{printItem.recipient_phone || printItem.customer?.phone || "-"}</span>
                    </div>
                    <div className="text-muted-foreground text-[11px] line-clamp-2">
                      Alamat: <span className="text-foreground">{printItem.shipping_address || printItem.customer?.address || "Sesuai alamat kontrak"}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs border border-border/70">
                  <thead className="bg-muted/60 text-muted-foreground text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-2 border text-center w-8">No</th>
                      <th className="p-2 border text-left">Kode & Nama Barang</th>
                      <th className="p-2 border text-right w-16">Qty</th>
                      <th className="p-2 border text-right w-24">Harga</th>
                      <th className="p-2 border text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(printItem.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-2 border text-center">{idx + 1}</td>
                        <td className="p-2 border">
                          <div className="font-medium text-foreground">{it.productName || it.product?.name || `Produk #${it.product_id}`}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{it.productCode || it.product?.code || "-"}</div>
                        </td>
                        <td className="p-2 border text-right font-mono font-semibold">{it.quantity}</td>
                        <td className="p-2 border text-right font-mono">{formatRupiah(it.unit_price)}</td>
                        <td className="p-2 border text-right font-mono font-bold text-foreground">
                          {formatRupiah(it.total || (it.quantity * it.unit_price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary & Notes */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-muted/20 p-2.5 rounded border text-[11px]">
                    <span className="font-semibold text-muted-foreground block mb-0.5">Catatan Pesanan:</span>
                    <span className="text-foreground">{printItem.notes || "Tidak ada catatan tambahan."}</span>
                  </div>
                  <div className="space-y-1 text-right text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-mono font-medium">{formatRupiah(printItem.subtotal)}</span>
                    </div>
                    {printItem.discount_amount > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>Diskon:</span>
                        <span className="font-mono">- {formatRupiah(printItem.discount_amount)}</span>
                      </div>
                    )}
                    {printItem.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PPN:</span>
                        <span className="font-mono">+ {formatRupiah(printItem.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-1.5 border-t">
                      <span>Grand Total:</span>
                      <span className="font-mono text-primary">{formatRupiah(printItem.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-3 pt-4 text-center text-[10px]">
                  <div>
                    <div className="text-muted-foreground mb-8">Pemesan / Pelanggan,</div>
                    <div className="border-t mx-4 pt-1 font-semibold text-foreground">
                      ( {printItem.customerName} )
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-8">Bagian Gudang,</div>
                    <div className="border-t mx-4 pt-1 font-semibold text-foreground">
                      (                  )
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-8">Sales & Finance Dept.,</div>
                    <div className="border-t mx-4 pt-1 font-semibold text-foreground">
                      ( PT Mecca Distribusi Solusindo )
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setPrintItem(null)}>
                Tutup
              </Button>
              <Button size="sm" onClick={handlePrintDirect} className="gap-1.5">
                <PrinterIcon className="size-3.5" />
                Cetak / Download PDF
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
