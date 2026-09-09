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
  ShoppingCartIcon,
  DollarSignIcon,
  PackageCheckIcon,
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
} from "lucide-react"

interface SalesOrderItem {
  id: number
  orderNo: string
  refQuotation?: string
  date: string
  customerName: string
  warehouse: string
  itemsCount: number
  totalQty: number
  totalAmount: number
  status: "Selesai Dikirim" | "Proses Kirim" | "Siap Kirim" | "Menunggu Stok" | "Dibatalkan"
}

const DUMMY_ORDERS: SalesOrderItem[] = [
  { id: 1, orderNo: "SO-202609-001", refQuotation: "QT-202609-001", date: "2026-09-08", customerName: "PT Lorem Ipsum", warehouse: "Gudang Utama Cakung", itemsCount: 4, totalQty: 320, totalAmount: 48500000, status: "Siap Kirim" },
  { id: 2, orderNo: "SO-202609-002", refQuotation: "QT-202609-004", date: "2026-09-07", customerName: "PT Sentosa Jaya", warehouse: "Gudang Utama Cakung", itemsCount: 6, totalQty: 540, totalAmount: 34000000, status: "Proses Kirim" },
  { id: 3, orderNo: "SO-202609-003", refQuotation: "-", date: "2026-09-06", customerName: "PT John Doe", warehouse: "Gudang Transit Surabaya", itemsCount: 8, totalQty: 720, totalAmount: 62000000, status: "Selesai Dikirim" },
  { id: 4, orderNo: "SO-202609-004", refQuotation: "-", date: "2026-09-05", customerName: "PT Jane Doe", warehouse: "Gudang Dingin Marunda", itemsCount: 3, totalQty: 180, totalAmount: 18200000, status: "Menunggu Stok" },
  { id: 5, orderNo: "SO-202609-005", refQuotation: "QT-202608-027", date: "2026-09-04", customerName: "Toko Sinar Terang", warehouse: "Gudang Utama Cakung", itemsCount: 2, totalQty: 90, totalAmount: 12500000, status: "Selesai Dikirim" },
  { id: 6, orderNo: "SO-202609-006", refQuotation: "-", date: "2026-09-02", customerName: "CV Berkah Mandiri", warehouse: "Gudang Transit Surabaya", itemsCount: 5, totalQty: 260, totalAmount: 22600000, status: "Selesai Dikirim" },
]

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function SalesOrdersPage() {
  const { theme, setTheme } = useTheme()
  const [orders, setOrders] = useState<SalesOrderItem[]>(DUMMY_ORDERS)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof SalesOrderItem>("date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 5

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
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0)
  const activeShipping = orders.filter((o) => o.status === "Proses Kirim" || o.status === "Siap Kirim").length
  const fulfillmentRate = 95.8

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchesSearch =
          o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.warehouse.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "Semua" || o.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [orders, search, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredOrders.length / limit) || 1
  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof SalesOrderItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
  }

  const handleDeleteSingle = (id: number, orderNo: string) => {
    setConfirmModal({
      open: true,
      title: "Batalkan & Hapus Pesanan",
      description: `Apakah Anda yakin ingin membatalkan pesanan penjualan ${orderNo}?`,
      variant: "destructive",
      onConfirm: () => {
        setOrders((prev) => prev.filter((o) => o.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Pesanan ${orderNo} berhasil dibatalkan.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Pesanan Terpilih",
      description: `Hapus ${selectedIds.length} pesanan penjualan yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setOrders((prev) => prev.filter((o) => !selectedIds.includes(o.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} pesanan berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.includes(o.id))

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
                  <BreadcrumbPage>Daftar Pesanan Penjualan</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Pesanan Penjualan (Sales Orders)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Pantau konfirmasi pesanan pelanggan, komitmen alokasi stok gudang, dan progres pengiriman.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sales Order</span>
                <ShoppingCartIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalOrders}</div>
              <div className="mt-2 text-xs text-muted-foreground">Order masuk periode ini</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Nilai Penjualan</span>
                <DollarSignIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(totalRevenue)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Omzet kotor seluruh pesanan</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antrian Pengiriman</span>
                <TruckIcon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{activeShipping}</div>
              <div className="mt-2 text-xs text-muted-foreground">Siap atau sedang dikirim</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tingkat Pemenuhan</span>
                <PackageCheckIcon className="size-4 text-purple-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{fulfillmentRate}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Rasio order terkirim tepat waktu</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. SO, customer, gudang..."
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
                    <option value="Siap Kirim" className="bg-popover text-popover-foreground">Siap Kirim</option>
                    <option value="Proses Kirim" className="bg-popover text-popover-foreground">Proses Kirim</option>
                    <option value="Selesai Dikirim" className="bg-popover text-popover-foreground">Selesai Dikirim</option>
                    <option value="Menunggu Stok" className="bg-popover text-popover-foreground">Menunggu Stok</option>
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
                      title: "Export Data Sales Order",
                      description: "File rekapitulasi pesanan (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File data sales order berhasil diunduh.")
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
                      title: "Buat Sales Order Baru",
                      description: "Formulir pembuatan pesanan langsung (Direct Sales Order) dari pelanggan.",
                      variant: "default",
                      confirmText: "Buat SO",
                      onConfirm: () => {
                        setFeedback("Formulir pesanan baru siap diisi.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
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
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(paginatedOrders.map((o) => o.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("orderNo")}>
                      <div className="flex items-center gap-1">No. SO <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1">Tanggal <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Gudang Pemenuhan</th>
                    <th className="p-3 text-right">Kuantitas</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("totalAmount")}>
                      <div className="flex items-center justify-end gap-1">Total Nilai <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 text-center">Status Pemenuhan</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Tidak ada pesanan penjualan yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((item) => {
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
                          <td className="p-3 text-muted-foreground">{item.warehouse}</td>
                          <td className="p-3 text-right font-mono font-medium">
                            <div>{item.totalQty} Unit</div>
                            <div className="text-[10px] text-muted-foreground">{item.itemsCount} SKU</div>
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
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
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
                                    title: `Detail Pesanan ${item.orderNo}`,
                                    description: `Pesanan oleh ${item.customerName} sebesar ${formatRupiah(item.totalAmount)} dari ${item.warehouse}.`,
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
                                    title: "Buat Surat Jalan (Delivery Order)",
                                    description: `Generate surat jalan pengiriman untuk pesanan ${item.orderNo}?`,
                                    variant: "default",
                                    confirmText: "Generate DO",
                                    onConfirm: () => {
                                      setFeedback(`Surat jalan untuk ${item.orderNo} berhasil dibuat.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <TruckIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.orderNo)}
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredOrders.length)} dari {filteredOrders.length} data
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
