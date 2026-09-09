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
} from "lucide-react"

interface DeliveryItem {
  id: number
  deliveryNo: string
  refOrder: string
  date: string
  customerName: string
  courierFleet: string
  warehouse: string
  totalItems: number
  status: "Diterima" | "Dalam Perjalanan" | "Siap Muat" | "Kendala Pengiriman"
}

const DUMMY_DELIVERIES: DeliveryItem[] = [
  { id: 1, deliveryNo: "DO-202609-001", refOrder: "SO-202609-001", date: "2026-09-08", customerName: "PT Lorem Ipsum", courierFleet: "Truk Box Mecca 01 (B 9123 SCD)", warehouse: "Gudang Utama Cakung", totalItems: 320, status: "Dalam Perjalanan" },
  { id: 2, deliveryNo: "DO-202609-002", refOrder: "SO-202609-002", date: "2026-09-07", customerName: "PT Sentosa Jaya", courierFleet: "Pickup Mecca 03 (B 8721 KLA)", warehouse: "Gudang Utama Cakung", totalItems: 540, status: "Dalam Perjalanan" },
  { id: 3, deliveryNo: "DO-202609-003", refOrder: "SO-202609-003", date: "2026-09-06", customerName: "PT John Doe", courierFleet: "JNE Trucking (JTR)", warehouse: "Gudang Transit Surabaya", totalItems: 720, status: "Diterima" },
  { id: 4, deliveryNo: "DO-202609-004", refOrder: "SO-202609-005", date: "2026-09-05", customerName: "Toko Sinar Terang", courierFleet: "Pickup Mecca 02 (B 3329 MPO)", warehouse: "Gudang Utama Cakung", totalItems: 90, status: "Diterima" },
  { id: 5, deliveryNo: "DO-202609-005", refOrder: "SO-202609-006", date: "2026-09-04", customerName: "CV Berkah Mandiri", courierFleet: "Dakota Cargo", warehouse: "Gudang Transit Surabaya", totalItems: 260, status: "Diterima" },
  { id: 6, deliveryNo: "DO-202609-006", refOrder: "SO-202609-004", date: "2026-09-08", customerName: "PT Jane Doe", courierFleet: "Truk Pendingin 01 (B 9481 FGT)", warehouse: "Gudang Dingin Marunda", totalItems: 180, status: "Siap Muat" },
]

export default function DeliveriesPage() {
  const { theme, setTheme } = useTheme()
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(DUMMY_DELIVERIES)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof DeliveryItem>("date")
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
  const totalDeliveries = deliveries.length
  const deliveredCount = deliveries.filter((d) => d.status === "Diterima").length
  const inTransitCount = deliveries.filter((d) => d.status === "Dalam Perjalanan").length
  const onTimeRate = 97.4

  const filteredDeliveries = useMemo(() => {
    return deliveries
      .filter((d) => {
        const matchesSearch =
          d.deliveryNo.toLowerCase().includes(search.toLowerCase()) ||
          d.refOrder.toLowerCase().includes(search.toLowerCase()) ||
          d.customerName.toLowerCase().includes(search.toLowerCase()) ||
          d.courierFleet.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "Semua" || d.status === statusFilter
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
  }, [deliveries, search, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredDeliveries.length / limit) || 1
  const paginatedDeliveries = filteredDeliveries.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof DeliveryItem) => {
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
      title: "Hapus Surat Jalan",
      description: `Apakah Anda yakin ingin menghapus surat jalan ${no}?`,
      variant: "destructive",
      onConfirm: () => {
        setDeliveries((prev) => prev.filter((d) => d.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Surat jalan ${no} berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Surat Jalan Terpilih",
      description: `Hapus ${selectedIds.length} surat jalan pengiriman yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setDeliveries((prev) => prev.filter((d) => !selectedIds.includes(d.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} surat jalan berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedDeliveries.length > 0 && paginatedDeliveries.every((d) => selectedIds.includes(d.id))

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
                  <BreadcrumbPage>Daftar Pengiriman Penjualan</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Pengiriman Penjualan (Delivery Orders)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Lacak status surat jalan, manifes muatan armada kurir, dan bukti tanda terima pelanggan (POD).</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Surat Jalan</span>
                <TruckIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalDeliveries}</div>
              <div className="mt-2 text-xs text-muted-foreground">Manifest pengiriman aktif</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dalam Pengiriman</span>
                <ClockIcon className="size-4 text-amber-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{inTransitCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Armada sedang menuju lokasi</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Berhasil Diterima</span>
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{deliveredCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Tanda terima sah pelanggan</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ketepatan Waktu</span>
                <NavigationIcon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{onTimeRate}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Tiba sesuai estimasi jadwal</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. DO, SO, atau customer..."
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
                    <option value="Dalam Perjalanan" className="bg-popover text-popover-foreground">Dalam Perjalanan</option>
                    <option value="Diterima" className="bg-popover text-popover-foreground">Diterima</option>
                    <option value="Siap Muat" className="bg-popover text-popover-foreground">Siap Muat</option>
                    <option value="Kendala Pengiriman" className="bg-popover text-popover-foreground">Kendala Pengiriman</option>
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
                      title: "Export Laporan Pengiriman",
                      description: "File log ekspedisi pengiriman (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File data ekspedisi berhasil diunduh.")
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
                      title: "Jadwalkan Pengiriman Baru",
                      description: "Buat Surat Jalan baru berdasarkan Sales Order yang telah teralokasi.",
                      variant: "default",
                      confirmText: "Buat Jadwal",
                      onConfirm: () => {
                        setFeedback("Jadwal pengiriman baru berhasil dibuat.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Jadwalkan Kirim
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
                            setSelectedIds(paginatedDeliveries.map((d) => d.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("deliveryNo")}>
                      <div className="flex items-center gap-1">No. Surat Jalan <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1">Tanggal Kirim <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Ref Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Armada / Kurir</th>
                    <th className="p-3">Gudang Asal</th>
                    <th className="p-3 text-right">Muatan Unit</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Tidak ada pengiriman penjualan yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedDeliveries.map((item) => {
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
                          <td className="p-3 font-mono font-semibold text-foreground">{item.deliveryNo}</td>
                          <td className="p-3 text-muted-foreground">{item.date}</td>
                          <td className="p-3 font-mono text-muted-foreground">{item.refOrder}</td>
                          <td className="p-3 font-medium text-foreground">{item.customerName}</td>
                          <td className="p-3 text-muted-foreground">{item.courierFleet}</td>
                          <td className="p-3 text-muted-foreground">{item.warehouse}</td>
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
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setConfirmModal({
                                    open: true,
                                    title: `Detail Pengiriman ${item.deliveryNo}`,
                                    description: `Pengiriman ke ${item.customerName} menggunakan ${item.courierFleet}. Status: ${item.status}.`,
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
                                    title: "Cetak Surat Jalan",
                                    description: `Cetak dokumen fisik surat jalan pengiriman nomor ${item.deliveryNo}?`,
                                    variant: "default",
                                    confirmText: "Cetak Sekarang",
                                    onConfirm: () => {
                                      setFeedback(`Surat Jalan ${item.deliveryNo} dikirim ke antrian cetak.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <PrinterIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.deliveryNo)}
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredDeliveries.length)} dari {filteredDeliveries.length} data
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
