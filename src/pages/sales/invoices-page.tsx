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
import { invoiceService } from "@/services/invoice.service"
import { InvoiceDialog } from "@/pages/sales/invoice-dialog"
import { PaymentDialog } from "@/pages/sales/payment-dialog"
import { usePermission } from "@/hooks/use-permission"
import type { Invoice, InvoiceMetrics } from "@/types/invoice.types"
import {
  SunIcon,
  MoonIcon,
  ReceiptIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertOctagonIcon,
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
  AlertTriangleIcon,
  Building2Icon,
  CreditCardIcon,
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
import {
  generateInvoiceDotMatrixHtml,
  printDotMatrixHtml,
  DotMatrixPreview,
} from "@/lib/dot-matrix-print"

function formatRupiah(amount: number | string | undefined) {
  const val = typeof amount === "string" ? parseFloat(amount) || 0 : amount || 0
  return `IDR ${val.toLocaleString("id-ID")}`
}

export default function InvoicesPage() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const { canDelete } = usePermission()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [metrics, setMetrics] = useState<InvoiceMetrics>({
    totalInvoices: 0,
    totalReceivables: 0,
    paidTotal: 0,
    unpaidCount: 0,
    partiallyPaidCount: 0,
    paidCount: 0,
    overdueCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState("invoice_date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentPreselectedCust, setPaymentPreselectedCust] = useState<number | null>(null)
  const [paymentPreselectedInv, setPaymentPreselectedInv] = useState<number | null>(null)
  const [previewItem, setPreviewItem] = useState<Invoice | null>(null)
  const [printItem, setPrintItem] = useState<Invoice | null>(null)
  const [printFormat, setPrintFormat] = useState<"dotmatrix" | "pdf">("dotmatrix")

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
        invoiceService.getInvoices({
          page,
          limit,
          search: search || undefined,
          status: statusFilter !== "Semua" ? statusFilter : undefined,
          sort: sortField,
          order: sortOrder,
        }),
        invoiceService.getInvoiceMetrics(),
      ])

      setInvoices(listRes.items || [])
      setTotalPages(listRes.pagination?.totalPages || 1)
      setTotalCount(listRes.pagination?.total || 0)
      setMetrics(metricsRes)
    } catch {
      setErrorFeedback("Gagal memuat data faktur penjualan.")
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

  const handleDeleteSingle = (id: number, no: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Faktur Penjualan",
      description: `Apakah Anda yakin ingin membatalkan & menghapus faktur ${no}? Tindakan ini tidak dapat dibatalkan.`,
      variant: "destructive",
      confirmText: "Hapus Faktur",
      onConfirm: async () => {
        try {
          await invoiceService.deleteInvoice(id)
          setFeedback(`Faktur ${no} berhasil dihapus.`)
          fetchData()
        } catch {
          setErrorFeedback("Gagal menghapus faktur penjualan.")
        }
      },
    })
  }

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      setErrorFeedback("Tidak ada data faktur untuk diekspor.")
      return
    }

    const headers = [
      "No. Faktur",
      "Ref. Pengiriman",
      "Ref. Order",
      "Customer",
      "Tanggal Terbit",
      "Jatuh Tempo",
      "Subtotal",
      "Diskon",
      "PPN",
      "Total Tagihan",
      "Terbayar",
      "Sisa Tagihan",
      "Status",
    ]

    const rows = invoices.map((i) => [
      i.invoiceNo,
      i.refDelivery || "-",
      i.refOrder || "-",
      `"${(i.customerName || "").replace(/"/g, '""')}"`,
      i.issueDate,
      i.dueDate,
      i.subtotal,
      i.discount_amount,
      i.tax_amount,
      i.totalAmount,
      i.paidAmount,
      i.remainingAmount,
      i.status,
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `Laporan_Faktur_Penjualan_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setFeedback("File rekapitulasi faktur berhasil diunduh (.csv)")
    setTimeout(() => setFeedback(null), 3000)
  }

  const handlePrintDocument = () => {
    if (!printItem) return

    if (printFormat === "dotmatrix") {
      printDotMatrixHtml(
        generateInvoiceDotMatrixHtml(printItem),
        `Invoice - ${printItem.invoiceNo}`
      )
      return
    }

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

    const itemsRows = (printItem.items || [])
      .map(
        (it, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace;">${it.productCode || it.product?.code || "-"}</td>
          <td>${it.productName || it.product?.name || `Produk #${it.product_id}`}</td>
          <td style="text-align: center; font-family: monospace;">${it.quantity} Unit</td>
          <td style="text-align: right; font-family: monospace;">${formatRupiah(it.unit_price)}</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace;">${formatRupiah(it.total || it.subtotal || it.quantity * it.unit_price)}</td>
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
            <div class="company-address">Kawasan Pergudangan Cakung Blok B No. 12, Jakarta Timur 13910</div>
            <div class="company-address">Telp: (021) 8899-7700 | Email: finance@mecca.co.id</div>
          </div>
          <div class="doc-badge">
            <div class="doc-title">FAKTUR PENJUALAN</div>
            <div class="doc-no">${printItem.invoiceNo}</div>
            <div class="doc-date">Tanggal: ${printItem.issueDate}</div>
            <div class="doc-date" style="color: #dc2626;">Jatuh Tempo: ${printItem.dueDate}</div>
          </div>
        </div>

        <hr class="divider" />

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">DITAGIHKAN KEPADA (BILL TO):</div>
            <div class="info-title">${printItem.customerName}</div>
            <div class="info-detail">${printItem.customerAddress || "Alamat penagihan sesuai kontrak"}</div>
            ${printItem.customerPhone ? `<div class="info-detail">Kontak: ${printItem.customerPhone}</div>` : ""}
          </div>
          <div class="info-card">
            <div class="info-label">REFERENSI DOKUMEN:</div>
            <div class="info-detail">No. Surat Jalan: <strong>${printItem.refDelivery || "-"}</strong></div>
            <div class="info-detail">No. Sales Order: <strong>${printItem.refOrder || "-"}</strong></div>
            <div class="info-detail">Status Pembayaran: <strong>${printItem.status}</strong></div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">NO</th>
              <th style="width: 140px;">KODE BARANG</th>
              <th>DESKRIPSI BARANG</th>
              <th style="width: 90px; text-align: center;">JUMLAH</th>
              <th style="width: 130px; text-align: right;">HARGA SATUAN</th>
              <th style="width: 140px; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="bottom-section">
          <div class="payment-info">
            <div class="info-label">INFO REKENING PEMBAYARAN:</div>
            <div class="info-detail"><strong>Bank BCA:</strong> 7332-2000-22</div>
            <div class="info-detail"><strong>Bank Mandiri:</strong> 127-00-0806202-6</div>
            <div class="info-detail">a.n. <strong>PT MECCA DISTRIBUSI SOLUSINDO</strong></div>
            ${printItem.notes ? `<div class="notes">Catatan: ${printItem.notes}</div>` : ""}
          </div>
          <div class="totals-table">
            <div class="total-row"><span>Subtotal:</span><span>${formatRupiah(printItem.subtotal)}</span></div>
            ${printItem.discount_amount > 0 ? `<div class="total-row"><span>Diskon:</span><span style="color: #dc2626;">- ${formatRupiah(printItem.discount_amount)}</span></div>` : ""}
            ${printItem.tax_amount > 0 ? `<div class="total-row"><span>PPN:</span><span>+ ${formatRupiah(printItem.tax_amount)}</span></div>` : ""}
            <div class="total-row grand"><span>Total Tagihan:</span><span>${formatRupiah(printItem.totalAmount)}</span></div>
            <div class="total-row"><span>Sudah Dibayar:</span><span>${formatRupiah(printItem.paidAmount)}</span></div>
            <div class="total-row" style="color: #dc2626; font-weight: bold;"><span>Sisa Tagihan:</span><span>${formatRupiah(printItem.remainingAmount)}</span></div>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-col">
            <div class="sig-title">Penerima Tagihan,</div>
            <div class="sig-line">( ${printItem.customerName} )</div>
          </div>
          <div class="sig-col">
            <div class="sig-title">Hormat Kami, Finance Dept.</div>
            <div class="sig-line">( PT Mecca Distribusi Solusindo )</div>
          </div>
        </div>
      </div>
    `

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Faktur Penjualan - ${printItem.invoiceNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * { box-sizing: border-box; }
            .pdf-container {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }
            .company-name { font-size: 18px; font-weight: 800; color: #1e1b4b; }
            .company-sub { font-size: 11px; font-weight: 700; color: #4338ca; }
            .company-address { font-size: 10px; color: #64748b; margin-top: 1px; }
            .doc-badge { text-align: right; }
            .doc-title { font-size: 18px; font-weight: 900; color: #1e1b4b; letter-spacing: 1px; }
            .doc-no { font-family: monospace; font-size: 13px; font-weight: bold; margin-top: 2px; }
            .doc-date { font-size: 11px; color: #64748b; margin-top: 2px; }
            .divider { border: 0; border-top: 2px solid #e2e8f0; margin: 12px 0 16px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
            .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
            .info-label { font-size: 9px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; }
            .info-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
            .info-detail { font-size: 11px; color: #334155; margin-top: 2px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
            .table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: 700; color: #334155; }
            .table td { border: 1px solid #e2e8f0; padding: 7px 10px; color: #1e293b; }
            .bottom-section { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
            .payment-info { width: 48%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; font-size: 11px; }
            .notes { margin-top: 8px; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
            .totals-table { width: 48%; font-size: 11px; }
            .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
            .total-row.grand { font-size: 13px; font-weight: 800; color: #1e1b4b; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 6px 0; margin: 4px 0; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px; text-align: center; }
            .sig-col { padding: 0 16px; }
            .sig-title { font-size: 11px; color: #64748b; margin-bottom: 50px; }
            .sig-line { font-size: 11px; font-weight: 600; color: #1e293b; border-top: 1px solid #94a3b8; padding-top: 4px; }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `)
    doc.close()

    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1500)
    }, 300)
  }

  const totalBilled = (metrics.totalReceivables || 0) + (metrics.paidTotal || 0)


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
                <BreadcrumbPage>Daftar Faktur (Invoices)</BreadcrumbPage>
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Faktur Penjualan (Invoices)</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Penerbitan faktur komersial, kontrol piutang usaha (AR), dan pemantauan masa jatuh tempo.</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Tagihan Terbit</p>
                <h3 className="text-2xl font-bold mt-1">{formatRupiah(totalBilled)}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{metrics.totalInvoices} faktur komersial</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <ReceiptIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Piutang Belum Bayar</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-500">
                  {formatRupiah(metrics.totalReceivables)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {metrics.unpaidCount + metrics.partiallyPaidCount} faktur belum lunas
                </p>
              </div>
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <ClockIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Kas Piutang Tertagih</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-500">
                  {formatRupiah(metrics.paidTotal)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{metrics.paidCount} faktur telah lunas</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Faktur Overdue</p>
                <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-500">
                  {metrics.overdueCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Lewat tanggal jatuh tempo</p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                <AlertOctagonIcon className="size-6" />
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
                  placeholder="Cari No. Faktur, DO, Customer..."
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
                  <option value="Lunas" className="bg-popover text-popover-foreground">Lunas</option>
                  <option value="Sebagian" className="bg-popover text-popover-foreground">Sebagian</option>
                  <option value="Belum Dibayar" className="bg-popover text-popover-foreground">Belum Dibayar</option>
                  <option value="Jatuh Tempo" className="bg-popover text-popover-foreground">Jatuh Tempo</option>
                  <option value="Draf" className="bg-popover text-popover-foreground">Draf</option>
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
                onClick={() => setDialogOpen(true)}
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
              >
                <PlusIcon className="size-3.5 mr-1" />
                Terbitkan Faktur
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("invoice_number")}>
                    <div className="flex items-center gap-1">No. Faktur <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("invoice_date")}>
                    <div className="flex items-center gap-1">Tanggal Terbit <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("due_date")}>
                    <div className="flex items-center gap-1">Jatuh Tempo <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("grand_total")}>
                    <div className="flex items-center justify-end gap-1">Total Tagihan <ArrowUpDownIcon className="size-3" /></div>
                  </th>
                  <th className="p-3 text-right">Terbayar</th>
                  <th className="p-3 text-right">Sisa Tagihan</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2Icon className="size-4 animate-spin text-primary" />
                        <span>Memuat data faktur penjualan...</span>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Tidak ada faktur tagihan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  invoices.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="p-3 font-mono font-semibold text-foreground">
                          <div>{item.invoiceNo}</div>
                          {item.refDelivery && item.refDelivery !== "-" && (
                            <div className="text-[10px] text-muted-foreground font-mono">DO: {item.refDelivery}</div>
                          )}
                          {item.refOrder && item.refOrder !== "-" && (
                            <div className="text-[10px] text-muted-foreground font-mono">SO: {item.refOrder}</div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">{item.issueDate}</td>
                        <td className="p-3 text-muted-foreground font-mono">{item.dueDate}</td>
                        <td className="p-3 font-medium text-foreground">
                          <div>{item.customerName}</div>
                          {item.customerPhone && item.customerPhone !== "-" && (
                            <div className="text-[10px] text-muted-foreground">{item.customerPhone}</div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-foreground">
                          {formatRupiah(item.totalAmount)}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(item.paidAmount)}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-500">
                          {formatRupiah(item.remainingAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === "Lunas"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : item.status === "Sebagian"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : item.status === "Belum Dibayar"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : item.status === "Jatuh Tempo"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Detail preview */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPreviewItem(item)}
                              title="Lihat Rincian Faktur"
                              className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <EyeIcon className="size-3.5" />
                            </Button>

                            {/* Print modal */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPrintItem(item)}
                              title="Cetak Faktur Penjualan"
                              className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <PrinterIcon className="size-3.5" />
                            </Button>

                            {/* Record Payment */}
                            {item.status !== "Lunas" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setPaymentPreselectedCust(item.customer_id)
                                  setPaymentPreselectedInv(item.id)
                                  setPaymentDialogOpen(true)
                                }}
                                title="Catat Pembayaran / Pelunasan"
                                className="cursor-pointer hover:bg-emerald-500/10 text-emerald-600 active:scale-95 transition-all"
                              >
                                <CreditCardIcon className="size-3.5" />
                              </Button>
                            )}

                            {/* Delete button */}
                            {canDelete("invoices") && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.invoiceNo)}
                                title="Hapus Faktur"
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
                disabled={page <= 1 || loading}
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
                disabled={page >= totalPages || loading}
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

      {/* Invoice Creation Dialog */}
      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setFeedback("Faktur komersial berhasil diterbitkan!")
          setTimeout(() => setFeedback(null), 3500)
          fetchData()
        }}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        preselectedCustomerId={paymentPreselectedCust}
        preselectedInvoiceId={paymentPreselectedInv}
        onSuccess={() => {
          setFeedback("Pembayaran faktur berhasil dicatat!")
          setTimeout(() => setFeedback(null), 3500)
          fetchData()
        }}
      />

      {/* Preview Invoice Detail Dialog */}
      {previewItem && (
        <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center justify-between">
                <span>Rincian Faktur: {previewItem.invoiceNo}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    previewItem.status === "Lunas"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : previewItem.status === "Sebagian"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      : previewItem.status === "Belum Dibayar"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {previewItem.status}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Customer: {previewItem.customerName} {previewItem.refDelivery ? `| DO: ${previewItem.refDelivery}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground">Tanggal Terbit: </span>
                  <span className="font-semibold text-foreground font-mono">{previewItem.issueDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Jatuh Tempo: </span>
                  <span className="font-semibold text-foreground font-mono">{previewItem.dueDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ref. Surat Jalan: </span>
                  <span className="font-semibold text-foreground font-mono">{previewItem.refDelivery || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ref. Sales Order: </span>
                  <span className="font-semibold text-foreground font-mono">{previewItem.refOrder || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-semibold text-foreground">{previewItem.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dibuat Oleh: </span>
                  <span className="font-semibold text-foreground">{previewItem.creator || "Admin"}</span>
                </div>
                {previewItem.customerAddress && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Alamat Penagihan: </span>
                    <span className="text-foreground">{previewItem.customerAddress}</span>
                  </div>
                )}
                {previewItem.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Catatan Faktur: </span>
                    <span className="text-foreground">{previewItem.notes}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-2">
                  Daftar Barang & Jasa Ditagihkan
                </div>
                <div className="border rounded-md divide-y overflow-hidden">
                  <div className="grid grid-cols-12 bg-muted/40 p-2 font-semibold text-[10px] text-muted-foreground uppercase">
                    <div className="col-span-6">Deskripsi Barang</div>
                    <div className="col-span-2 text-center">Jumlah</div>
                    <div className="col-span-2 text-right">Harga Satuan</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>
                  {previewItem.items && previewItem.items.length > 0 ? (
                    previewItem.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 p-2.5 items-center">
                        <div className="col-span-6">
                          <div className="font-medium text-foreground">{it.productName || it.product?.name || `Produk #${it.product_id}`}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            SKU: {it.productCode || it.product?.code || "-"}
                          </div>
                        </div>
                        <div className="col-span-2 text-center font-mono font-medium">
                          {it.quantity} Unit
                        </div>
                        <div className="col-span-2 text-right font-mono text-muted-foreground">
                          {formatRupiah(it.unit_price)}
                        </div>
                        <div className="col-span-2 text-right font-mono font-semibold text-foreground">
                          {formatRupiah(it.total || it.subtotal || it.quantity * it.unit_price)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">Tidak ada rincian item faktur</div>
                  )}
                </div>
              </div>

              {/* Total calculations */}
              <div className="bg-muted/20 border rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal Produk:</span>
                  <span className="font-mono">{formatRupiah(previewItem.subtotal)}</span>
                </div>
                {previewItem.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Potongan / Diskon:</span>
                    <span className="font-mono">- {formatRupiah(previewItem.discount_amount)}</span>
                  </div>
                )}
                {previewItem.tax_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>PPN (11%):</span>
                    <span className="font-mono">+ {formatRupiah(previewItem.tax_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-sm text-foreground pt-1">
                  <span>Grand Total Tagihan:</span>
                  <span className="font-mono text-primary">{formatRupiah(previewItem.totalAmount)}</span>
                </div>
                <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                  <span>Jumlah Terbayar:</span>
                  <span className="font-mono">{formatRupiah(previewItem.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-600 dark:text-amber-500">
                  <span>Sisa Tagihan (Piutang):</span>
                  <span className="font-mono">{formatRupiah(previewItem.remainingAmount)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPrintItem(previewItem)
                  setPreviewItem(null)
                }}
              >
                <PrinterIcon className="size-3.5 mr-1" />
                Cetak Faktur
              </Button>
              <Button size="sm" variant="default" onClick={() => setPreviewItem(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Faktur Penjualan Modal */}
      {printItem && (
        <Dialog open={Boolean(printItem)} onOpenChange={(open) => !open && setPrintItem(null)}>
          <DialogContent className="sm:max-w-[760px] max-h-[92vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="text-base font-semibold flex items-center gap-2">
                    <ReceiptIcon className="size-4 text-primary" />
                    Cetak Faktur Penjualan (Invoice)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    No. Faktur: <span className="font-mono font-semibold text-foreground">{printItem.invoiceNo}</span> | Pelanggan: {printItem.customerName}
                  </DialogDescription>
                </div>

                {/* 2 Print Format Tabs: Dot Matrix vs PDF */}
                <div className="inline-flex rounded-lg border bg-muted p-1 shrink-0 self-start sm:self-auto">
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
                </div>
              </div>
            </DialogHeader>

            {printFormat === "dotmatrix" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <PrinterIcon className="size-4 shrink-0 text-emerald-600" />
                    <span>Format Continuous Form Dot Matrix (Epson LX/LQ Series 11" x 8.5")</span>
                  </div>
                </div>
                <DotMatrixPreview html={generateInvoiceDotMatrixHtml(printItem)} />
              </div>
            ) : (
              <div className="p-5 border border-dashed rounded-lg bg-white text-slate-900 font-sans space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2Icon className="size-5 text-indigo-700" />
                      <h2 className="text-xl font-black tracking-tight text-slate-900">MECCA DISTRIBUTION</h2>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600 mt-1">PT Mecca Distribusi Solusindo</p>
                    <p className="text-[11px] text-slate-500">Kawasan Pergudangan Cakung Blok B No. 12, Jakarta Timur</p>
                    <p className="text-[11px] text-slate-500">Telp: (021) 8899-7700 | Email: finance@mecca.co.id</p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black uppercase tracking-wider text-indigo-900">FAKTUR PENJUALAN</div>
                    <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">{printItem.invoiceNo}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Tanggal: <span className="font-mono font-medium">{printItem.issueDate}</span></div>
                    <div className="text-[11px] text-slate-500">Jatuh Tempo: <span className="font-mono font-semibold text-rose-600">{printItem.dueDate}</span></div>
                  </div>
                </div>

                {/* Bill to & Reference */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ditagihkan Kepada (Bill To):</div>
                    <div className="font-bold text-slate-900 text-sm mt-1">{printItem.customerName}</div>
                    <div className="text-slate-600 text-[11px] mt-0.5">{printItem.customerAddress || "Alamat penagihan sesuai kontrak"}</div>
                    {printItem.customerPhone && (
                      <div className="text-slate-500 text-[11px]">Kontak: {printItem.customerPhone}</div>
                    )}
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Referensi Dokumen:</div>
                    <div className="text-slate-700 text-[11px] mt-1">
                      <span className="font-medium">No. Surat Jalan:</span> <span className="font-mono font-semibold">{printItem.refDelivery || "-"}</span>
                    </div>
                    <div className="text-slate-700 text-[11px] mt-0.5">
                      <span className="font-medium">No. Sales Order:</span> <span className="font-mono font-semibold">{printItem.refOrder || "-"}</span>
                    </div>
                    <div className="text-slate-700 text-[11px] mt-0.5">
                      <span className="font-medium">Status Pembayaran:</span> <span className="font-bold text-indigo-800 uppercase text-[10px] ml-1">{printItem.status}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <table className="w-full text-xs border text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border text-center w-10">No.</th>
                        <th className="p-2 border">Kode Barang</th>
                        <th className="p-2 border">Deskripsi Barang</th>
                        <th className="p-2 border text-center">Jumlah</th>
                        <th className="p-2 border text-right">Harga Satuan</th>
                        <th className="p-2 border text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printItem.items && printItem.items.length > 0 ? (
                        printItem.items.map((it, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 border text-center">{idx + 1}</td>
                            <td className="p-2 border font-mono text-slate-600">{it.productCode || it.product?.code || "-"}</td>
                            <td className="p-2 border font-medium text-slate-800">{it.productName || it.product?.name || `Produk #${it.product_id}`}</td>
                            <td className="p-2 border text-center font-mono">{it.quantity} Unit</td>
                            <td className="p-2 border text-right font-mono">{formatRupiah(it.unit_price)}</td>
                            <td className="p-2 border text-right font-mono font-semibold text-slate-900">
                              {formatRupiah(it.total || it.subtotal || it.quantity * it.unit_price)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-500">Tidak ada rincian item</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary and Bank Details */}
                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-1">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Instruksi Pembayaran:</div>
                    <p className="text-[11px] text-slate-600">Pembayaran dapat ditransfer melalui rekening resmi:</p>
                    <div className="pt-1 text-[11px] space-y-0.5">
                      <div>Bank Central Asia (BCA): <span className="font-mono font-bold text-slate-800">7332-2000-22</span></div>
                      <div>Bank Mandiri: <span className="font-mono font-bold text-slate-800">127-00-0806202-6</span></div>
                      <div className="text-slate-600">a.n. <span className="font-semibold text-slate-800">PT MECCA DISTRIBUSI SOLUSINDO</span></div>
                    </div>
                    {printItem.notes && (
                      <div className="pt-2 text-[10px] text-slate-500 italic">
                        Catatan: {printItem.notes}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-right">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-mono font-medium">{formatRupiah(printItem.subtotal)}</span>
                    </div>
                    {printItem.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Potongan Diskon:</span>
                        <span className="font-mono">- {formatRupiah(printItem.discount_amount)}</span>
                      </div>
                    )}
                    {printItem.tax_amount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>PPN (11%):</span>
                        <span className="font-mono">+ {formatRupiah(printItem.tax_amount)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
                      <span>Total Tagihan:</span>
                      <span className="font-mono text-indigo-950">{formatRupiah(printItem.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-emerald-700">
                      <span>Sudah Dibayar:</span>
                      <span className="font-mono">{formatRupiah(printItem.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-700 text-xs">
                      <span>Sisa Tagihan:</span>
                      <span className="font-mono">{formatRupiah(printItem.remainingAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                  <div>
                    <div className="text-slate-500 mb-12">Penerima Tagihan,</div>
                    <div className="border-t border-slate-400 mx-8 pt-1 text-slate-700 font-medium">
                      ( {printItem.customerName} )
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-12">Hormat Kami, Finance Dept.</div>
                    <div className="border-t border-slate-400 mx-8 pt-1 text-slate-700 font-medium">
                      ( PT Mecca Distribusi Solusindo )
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button size="sm" variant="outline" onClick={() => setPrintItem(null)}>
                Tutup
              </Button>
              <Button size="sm" onClick={handlePrintDocument} className="gap-1.5">
                <PrinterIcon className="size-3.5" />
                {printFormat === "dotmatrix" ? "Cetak ke Dot Matrix" : "Cetak / Simpan PDF"}
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
