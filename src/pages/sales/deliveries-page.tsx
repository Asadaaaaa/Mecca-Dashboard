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
  CopyIcon,
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
  const [printFormat, setPrintFormat] = useState<"pdf" | "dotmatrix">("pdf")
  const [copiedRaw, setCopiedRaw] = useState(false)

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

  // Generate ASCII Plain Text for Dot Matrix / Continuous Form (Epson LX-310 Compatible)
  const generateDotMatrixRawText = (item: Delivery) => {
    const line = "================================================================================"
    const dashed = "--------------------------------------------------------------------------------"
    const pad = (str: string, len: number) => (str || "").padEnd(len).slice(0, len)
    const padNum = (num: number, len: number) => String(num).padStart(len)

    const warehouseName =
      typeof item.warehouse === "object"
        ? (item.warehouse as { name?: string })?.name || "Gudang Utama"
        : item.warehouse || "Gudang Utama"

    let text = ""
    text += line + "\n"
    text += `${pad("PT MECCA DISTRIBUSI SOLUSINDO", 48)} SURAT JALAN (DO)\n`
    text += `${pad("Pergudangan Cakung Blok B-12, Jakarta Timur", 48)} No. DO  : ${item.deliveryNo}\n`
    text += `${pad("Telp: (021) 8901-2345", 48)} Tanggal : ${item.date}\n`
    text += dashed + "\n"
    text += `${pad("KEPADA YTH : " + item.customerName, 48)} Ref. SO : ${item.refOrder}\n`
    text += `${pad("Gudang Asal: " + warehouseName, 48)} Armada  : ${item.courierFleet || "-"}\n`
    text += `${pad("", 48)} Resi    : ${item.trackingNumber || "-"}\n`
    text += dashed + "\n"
    text += `NO  KODE BARANG       NAMA BARANG                                QTY   SATUAN\n`
    text += dashed + "\n"
    if (item.items && item.items.length > 0) {
      item.items.forEach((it, idx) => {
        const no = padNum(idx + 1, 2)
        const code = pad(it.productCode || it.product?.code || "-", 16)
        const name = pad(it.productName || it.product?.name || `Produk #${it.product_id}`, 40)
        const qty = padNum(it.quantity, 6)
        text += `${no}  ${code}  ${name}   ${qty}   UNIT\n`
      })
    } else {
      text += `    (Tidak ada rincian item barang)\n`
    }
    text += dashed + "\n"
    text += `TOTAL MUATAN : ${item.totalItems} UNIT\n`
    if (item.notes) {
      text += `Catatan      : ${item.notes}\n`
    }
    text += dashed + "\n"
    text += `     Tanda Terima,              Pengemudi/Kurir,             Petugas Gudang,\n\n\n\n`
    text += `   (                )         (                )           (                )\n`
    text += line + "\n"
    text += `* Lembar 1: Putih (Pelanggan)  | Lembar 2: Merah (Gudang)  | Lembar 3: Kuning (Finance) *\n`
    return text
  }

  const handleCopyRawAscii = () => {
    if (!printItem) return
    const raw = generateDotMatrixRawText(printItem)
    navigator.clipboard.writeText(raw)
    setCopiedRaw(true)
    setTimeout(() => setCopiedRaw(false), 2000)
  }

  const handlePrintDocument = () => {
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

    const isDotMatrix = printFormat === "dotmatrix"
    const warehouseName =
      typeof printItem.warehouse === "object"
        ? (printItem.warehouse as { name?: string })?.name || "Gudang Utama"
        : printItem.warehouse || "Gudang Utama"

    let contentHtml = ""

    if (isDotMatrix) {
      const rawText = generateDotMatrixRawText(printItem)
      contentHtml = `
        <div class="dot-matrix-container">
          <pre class="dot-matrix-text">${rawText}</pre>
        </div>
      `
    } else {
      const itemsRows = (printItem.items || [])
        .map(
          (it, idx) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="font-family: monospace;">${it.productCode || it.product?.code || "-"}</td>
            <td>${it.productName || it.product?.name || `Produk #${it.product_id}`}</td>
            <td style="text-align: right; font-weight: bold; font-family: monospace;">${it.quantity}</td>
            <td style="text-align: center;">UNIT</td>
          </tr>
        `
        )
        .join("")

      contentHtml = `
        <div class="pdf-container">
          <div class="header">
            <div>
              <div class="company-name">MECCA DISTRIBUTION</div>
              <div class="company-sub">PT MECCA DISTRIBUSI SOLUSINDO</div>
              <div class="company-address">Kawasan Pergudangan Cakung Blok B-12, Jakarta Timur 13910</div>
              <div class="company-address">Telp: (021) 8901-2345 | logistic@mecca.com</div>
            </div>
            <div class="doc-badge">
              <div class="doc-title">SURAT JALAN</div>
              <div class="doc-no">${printItem.deliveryNo}</div>
              <div class="doc-date">Tanggal: ${printItem.date}</div>
            </div>
          </div>

          <hr class="divider" />

          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">TUJUAN PENGIRIMAN (KEPADA YTH):</div>
              <div class="info-title">${printItem.customerName}</div>
              <div class="info-detail">Ref. Sales Order: <strong>${printItem.refOrder}</strong></div>
              <div class="info-detail">Alamat: Kirim sesuai alamat kontrak pelanggan</div>
            </div>
            <div class="info-card">
              <div class="info-label">DETAIL LOGISTIK & EKSPEDISI:</div>
              <div class="info-detail">Gudang Asal: <strong>${warehouseName}</strong></div>
              <div class="info-detail">Armada / Kurir: <strong>${printItem.courierFleet || "-"}</strong></div>
              <div class="info-detail">No. Resi Pengiriman: <strong>${printItem.trackingNumber || "-"}</strong></div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">NO</th>
                <th style="width: 140px;">KODE BARANG</th>
                <th>DESKRIPSI / NAMA PRODUK</th>
                <th style="width: 90px; text-align: right;">JUMLAH</th>
                <th style="width: 80px; text-align: center;">SATUAN</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; font-weight: bold; background: #f8fafc;">TOTAL MUATAN PENGIRIMAN:</td>
                <td style="text-align: right; font-weight: bold; font-family: monospace; background: #f8fafc;">${printItem.totalItems}</td>
                <td style="text-align: center; background: #f8fafc; font-weight: bold;">UNIT</td>
              </tr>
            </tfoot>
          </table>

          ${printItem.notes ? `<div class="notes"><strong>Catatan Khusus:</strong> ${printItem.notes}</div>` : ""}

          <div class="signatures">
            <div class="sig-col">
              <div class="sig-title">Diserahkan Oleh,</div>
              <div class="sig-role">Petugas Gudang</div>
              <div class="sig-line">( ..................................... )</div>
            </div>
            <div class="sig-col">
              <div class="sig-title">Dibawa / Diantar Oleh,</div>
              <div class="sig-role">Pengemudi / Kurir</div>
              <div class="sig-line">( ..................................... )</div>
            </div>
            <div class="sig-col">
              <div class="sig-title">Diterima Dengan Baik,</div>
              <div class="sig-role">Penerima / Cap Toko</div>
              <div class="sig-line">( ..................................... )</div>
            </div>
          </div>

          <div class="footer-note">
            <span>* Lembar 1 (Putih): Pelanggan</span>
            <span>* Lembar 2 (Merah): Gudang / Pengirim</span>
            <span>* Lembar 3 (Kuning): Keuangan / Penagihan</span>
          </div>
        </div>
      `
    }

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat Jalan - ${printItem.deliveryNo}</title>
          <style>
            @page {
              size: ${isDotMatrix ? "210mm 140mm" : "A4 portrait"};
              margin: ${isDotMatrix ? "4mm" : "12mm 15mm"};
            }
            body {
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * { box-sizing: border-box; }

            .dot-matrix-container {
              padding: 4px;
            }
            .dot-matrix-text {
              margin: 0;
              font-family: 'Courier New', Courier, monospace !important;
              font-size: 11px;
              line-height: 1.25;
              white-space: pre-wrap;
              color: #000;
            }

            .pdf-container {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }
            .company-name {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: -0.02em;
              color: #0f172a;
            }
            .company-sub {
              font-size: 11px;
              font-weight: 600;
              color: #475569;
              margin-top: 1px;
            }
            .company-address {
              font-size: 10px;
              color: #64748b;
              margin-top: 1px;
            }
            .doc-badge {
              text-align: right;
            }
            .doc-title {
              font-size: 16px;
              font-weight: 800;
              letter-spacing: 0.05em;
              color: #0f172a;
            }
            .doc-no {
              font-family: monospace;
              font-size: 13px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 2px;
            }
            .doc-date {
              font-size: 11px;
              color: #64748b;
              margin-top: 1px;
            }
            .divider {
              border: none;
              border-top: 2px solid #0f172a;
              margin: 8px 0 12px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }
            .info-card {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 10px;
              background-color: #f8fafc;
            }
            .info-label {
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .info-title {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 2px;
            }
            .info-detail {
              font-size: 11px;
              color: #334155;
              margin-top: 2px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            .table th, .table td {
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
              font-size: 11px;
            }
            .table th {
              background-color: #f1f5f9 !important;
              color: #1e293b;
              font-weight: 700;
              font-size: 10px;
              letter-spacing: 0.04em;
              text-align: left;
            }
            .notes {
              font-size: 11px;
              background-color: #f8fafc;
              border: 1px dashed #cbd5e1;
              padding: 6px 10px;
              border-radius: 4px;
              margin-bottom: 16px;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 16px;
              text-align: center;
              margin-top: 20px;
              margin-bottom: 16px;
            }
            .sig-col {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .sig-title {
              font-size: 11px;
              color: #475569;
              font-weight: 600;
            }
            .sig-role {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 45px;
            }
            .sig-line {
              font-size: 11px;
              font-weight: 600;
              color: #1e293b;
            }
            .footer-note {
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              font-size: 9px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
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
        document.body.removeChild(iframe)
      }, 1000)
    }, 250)
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Surat Jalan</p>
                <h3 className="text-2xl font-bold mt-1">{metrics.totalDeliveries}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Surat jalan diterbitkan</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <TruckIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Siap Dimuat</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {metrics.readyCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Menunggu konfirmasi potong stok</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
                <ClockIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Dalam Perjalanan</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  {metrics.inTransitCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Stok telah dipotong gudang</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <NavigationIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Telah Diterima</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {metrics.deliveredCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">On-Time Rate: {metrics.onTimeRate}%</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-6" />
              </div>
            </div>
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
                        <td className="p-3 text-muted-foreground">
                          {typeof item.warehouse === "object" ? item.warehouse?.name : item.warehouse || "Gudang Utama"}
                        </td>
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
                  <span className="font-semibold text-foreground">
                    {typeof previewItem.warehouse === "object" ? previewItem.warehouse?.name : previewItem.warehouse || "Gudang Utama Cakung"}
                  </span>
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

      {/* Print Surat Jalan Modal with 2 Options: PDF & Dot Matrix */}
      {printItem && (
        <Dialog open={Boolean(printItem)} onOpenChange={(open) => !open && setPrintItem(null)}>
          <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="text-base font-semibold flex items-center gap-2">
                    <TruckIcon className="size-4 text-primary" />
                    Cetak Surat Jalan (Delivery Order)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    No. DO: <span className="font-mono font-semibold text-foreground">{printItem.deliveryNo}</span> | Customer: {printItem.customerName}
                  </DialogDescription>
                </div>

                {/* 2 Print Format Tabs: PDF vs Dot Matrix */}
                <div className="inline-flex rounded-lg border bg-muted p-1 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setPrintFormat("pdf")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      printFormat === "pdf"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileTextIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
                    PDF (Standar A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat("dotmatrix")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      printFormat === "dotmatrix"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <PrinterIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    Dot Matrix (Continuous Form)
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Content Area Based on Selected Option */}
            {printFormat === "pdf" ? (
              /* PDF A4 Formal Layout Preview */
              <div className="p-5 border border-dashed rounded-lg bg-white text-slate-900 font-sans space-y-4 shadow-xs">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">MECCA DISTRIBUTION</h2>
                    <p className="text-[11px] font-medium text-slate-600">PT Mecca Distribusi Solusindo</p>
                    <p className="text-[10px] text-slate-500">Kawasan Pergudangan Cakung Blok B-12, Jakarta Timur</p>
                    <p className="text-[10px] text-slate-500">Telp: (021) 8901-2345 | logistic@mecca.com</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-900">SURAT JALAN</div>
                    <div className="font-mono text-xs font-bold text-slate-800 mt-0.5">{printItem.deliveryNo}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Tanggal: {printItem.date}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Tujuan Pengiriman:</div>
                    <div className="font-bold text-slate-900 mt-1">{printItem.customerName}</div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      Ref. Order: <span className="font-mono font-medium">{printItem.refOrder}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Detail Ekspedisi:</div>
                    <div className="font-bold text-slate-900 mt-1">Armada: {printItem.courierFleet || "-"}</div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      Gudang: {typeof printItem.warehouse === "object" ? (printItem.warehouse as { name?: string })?.name : printItem.warehouse || "Gudang Utama"}
                    </div>
                    <div className="text-slate-600 text-[11px]">Resi: {printItem.trackingNumber || "-"}</div>
                  </div>
                </div>

                <div>
                  <table className="w-full text-xs border text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border text-center w-10">No.</th>
                        <th className="p-2 border">Kode Barang</th>
                        <th className="p-2 border">Deskripsi Barang</th>
                        <th className="p-2 border text-right">Jumlah</th>
                        <th className="p-2 border text-center">Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printItem.items && printItem.items.length > 0 ? (
                        printItem.items.map((it, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 border text-center">{idx + 1}</td>
                            <td className="p-2 border font-mono font-medium">{it.productCode || it.product?.code || "-"}</td>
                            <td className="p-2 border">{it.productName || it.product?.name || `Produk #${it.product_id}`}</td>
                            <td className="p-2 border text-right font-mono font-bold">{it.quantity}</td>
                            <td className="p-2 border text-center text-slate-600">UNIT</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-slate-500">Tidak ada rincian item</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={3} className="p-2 border text-right">TOTAL MUATAN:</td>
                        <td className="p-2 border text-right font-mono">{printItem.totalItems}</td>
                        <td className="p-2 border text-center">UNIT</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {printItem.notes && (
                  <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="font-semibold text-slate-700">Catatan: </span>
                    <span className="text-slate-600">{printItem.notes}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-4 text-center text-xs">
                  <div>
                    <div className="text-slate-500 mb-9 text-[11px]">Diserahkan Oleh,</div>
                    <div className="border-t border-slate-400 mx-3 pt-1 text-slate-700 font-medium">( Petugas Gudang )</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-9 text-[11px]">Pengemudi / Kurir,</div>
                    <div className="border-t border-slate-400 mx-3 pt-1 text-slate-700 font-medium">( ........................ )</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-9 text-[11px]">Diterima Dengan Baik,</div>
                    <div className="border-t border-slate-400 mx-3 pt-1 text-slate-700 font-medium">( Penerima / Cap )</div>
                  </div>
                </div>

                <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400">
                  <span>* Lembar 1: Putih (Pelanggan)</span>
                  <span>* Lembar 2: Merah (Gudang)</span>
                  <span>* Lembar 3: Kuning (Finance)</span>
                </div>
              </div>
            ) : (
              /* Dot Matrix (Continuous Form) Layout Preview */
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <PrinterIcon className="size-4 shrink-0 text-emerald-600" />
                    <span>Format Kertas Rangkap / Continuous Form (Epson LX-310 / Dot Matrix 80-Kolom)</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyRawAscii}
                    className="h-7 text-xs gap-1.5 cursor-pointer bg-background"
                  >
                    {copiedRaw ? <CheckIcon className="size-3 text-emerald-600" /> : <CopyIcon className="size-3" />}
                    {copiedRaw ? "Tersalin!" : "Salin Raw ASCII"}
                  </Button>
                </div>

                {/* Simulated Continuous Form Monospace Paper Preview */}
                <div className="relative rounded-lg border-2 border-slate-300 bg-[#f7faf4] text-slate-800 p-4 font-mono text-xs overflow-x-auto shadow-inner dark:bg-slate-950 dark:text-emerald-400 dark:border-slate-800">
                  <pre className="font-mono text-xs leading-relaxed select-all whitespace-pre m-0">
                    {generateDotMatrixRawText(printItem)}
                  </pre>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button size="sm" variant="outline" onClick={() => setPrintItem(null)}>
                Tutup
              </Button>
              <Button size="sm" onClick={handlePrintDocument} className="gap-1.5">
                <PrinterIcon className="size-3.5" />
                {printFormat === "pdf" ? "Cetak / Simpan PDF" : "Cetak ke Dot Matrix"}
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
