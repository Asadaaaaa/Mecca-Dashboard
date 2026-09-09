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
  WarehouseIcon,
  LayersIcon,
  PercentIcon,
  CheckCircle2Icon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  MapPinIcon,
  PhoneIcon,
  CheckIcon,
} from "lucide-react"

interface WarehouseItem {
  id: number
  code: string
  name: string
  type: "Distribusi Kering (Ambient)" | "Distribusi Hub Transit" | "Cold Storage (Chilled/Frozen)" | "Buffer Warehouse"
  address: string
  picName: string
  picPhone: string
  capacityM3: number
  utilizationRate: number
  status: "Aktif" | "Maintenance" | "Nonaktif"
}

const DUMMY_WAREHOUSES: WarehouseItem[] = [
  { id: 1, code: "WH-CKG-01", name: "Gudang Utama Cakung", type: "Distribusi Kering (Ambient)", address: "Jl. Raya Cakung Cilincing Km. 4, Jakarta Timur", picName: "Budi Santoso", picPhone: "+62 811-9871-234", capacityM3: 15000, utilizationRate: 74, status: "Aktif" },
  { id: 2, code: "WH-SBY-01", name: "Gudang Transit Surabaya", type: "Distribusi Hub Transit", address: "Kawasan Industri Rungkut Blok B-12, Surabaya", picName: "Ahmad Dahlan", picPhone: "+62 812-3344-556", capacityM3: 8500, utilizationRate: 62, status: "Aktif" },
  { id: 3, code: "WH-MRD-02", name: "Gudang Dingin Marunda", type: "Cold Storage (Chilled/Frozen)", address: "Kawasan Berikat Marunda Center Blok C-05, Bekasi", picName: "Siti Rahma", picPhone: "+62 813-8899-001", capacityM3: 6000, utilizationRate: 85, status: "Aktif" },
  { id: 4, code: "WH-CKR-03", name: "Gudang Penyangga Cikarang", type: "Buffer Warehouse", address: "Delta Silicon Industrial Park Kav. 8, Cikarang", picName: "Rudi Hidayat", picPhone: "+62 817-6655-443", capacityM3: 5000, utilizationRate: 40, status: "Aktif" },
  { id: 5, code: "WH-MDN-01", name: "Gudang Hub Medan", type: "Distribusi Hub Transit", address: "Kawasan Industri Medan (KIM 2), Deli Serdang", picName: "Zulkifli Lubis", picPhone: "+62 812-7788-990", capacityM3: 7200, utilizationRate: 0, status: "Maintenance" },
]

export default function WarehousesPage() {
  const { theme, setTheme } = useTheme()
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(DUMMY_WAREHOUSES)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [typeFilter, setTypeFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof WarehouseItem>("name")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC")
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
  const totalWarehouses = warehouses.length
  const activeWarehouses = warehouses.filter((w) => w.status === "Aktif").length
  const totalCapacity = warehouses.reduce((acc, w) => acc + w.capacityM3, 0)
  const avgUtilization = (
    warehouses.reduce((acc, w) => acc + w.utilizationRate, 0) / (warehouses.length || 1)
  ).toFixed(1)

  const filteredWarehouses = useMemo(() => {
    return warehouses
      .filter((w) => {
        const matchesSearch =
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.code.toLowerCase().includes(search.toLowerCase()) ||
          w.address.toLowerCase().includes(search.toLowerCase()) ||
          w.picName.toLowerCase().includes(search.toLowerCase())
        const matchesType = typeFilter === "Semua" || w.type === typeFilter
        const matchesStatus = statusFilter === "Semua" || w.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [warehouses, search, typeFilter, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredWarehouses.length / limit) || 1
  const paginatedWarehouses = filteredWarehouses.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof WarehouseItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
  }

  const handleDeleteSingle = (id: number, name: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Data Gudang",
      description: `Apakah Anda yakin ingin menonaktifkan & menghapus gudang "${name}"?`,
      variant: "destructive",
      onConfirm: () => {
        setWarehouses((prev) => prev.filter((w) => w.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Gudang "${name}" berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Gudang Terpilih",
      description: `Hapus ${selectedIds.length} fasilitas gudang yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setWarehouses((prev) => prev.filter((w) => !selectedIds.includes(w.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} gudang berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedWarehouses.length > 0 && paginatedWarehouses.every((w) => selectedIds.includes(w.id))
  const types = ["Semua", ...Array.from(new Set(warehouses.map((w) => w.type)))]

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
                  <BreadcrumbLink href="/settings/users" className="cursor-pointer hover:text-foreground transition-colors">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Daftar Warehouse</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Fasilitas Pergudangan (Warehouses)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Konfigurasi pusat logistik, fasilitas cold storage, hub transit, dan penanggung jawab operasional.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Fasilitas</span>
                <WarehouseIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalWarehouses}</div>
              <div className="mt-2 text-xs text-muted-foreground">Pusat logistik terdaftar</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gudang Beroperasi</span>
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{activeWarehouses}</div>
              <div className="mt-2 text-xs text-muted-foreground">Siap menerima & kirim barang</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Kapasitas Fisik</span>
                <LayersIcon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{totalCapacity.toLocaleString("id-ID")} m³</div>
              <div className="mt-2 text-xs text-muted-foreground">Total volume tampung ruang</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rata-rata Utilisasi</span>
                <PercentIcon className="size-4 text-purple-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{avgUtilization}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Tingkat keterisian ruang simpan</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari kode, nama gudang, PIC..."
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
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value)
                      setPage(1)
                    }}
                    className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                  >
                    {types.map((t) => (
                      <option key={t} value={t} className="bg-popover text-popover-foreground">
                        {t === "Semua" ? "Semua Tipe" : t}
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
                    <option value="Aktif" className="bg-popover text-popover-foreground">Aktif</option>
                    <option value="Maintenance" className="bg-popover text-popover-foreground">Maintenance</option>
                    <option value="Nonaktif" className="bg-popover text-popover-foreground">Nonaktif</option>
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
                      title: "Export Master Fasilitas Gudang",
                      description: "File direktori gudang & zonasi kapasitas (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File master gudang berhasil diunduh.")
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
                      title: "Tambah Gudang Baru",
                      description: "Buka formulir registrasi fasilitas pergudangan atau hub distribusi baru.",
                      variant: "default",
                      confirmText: "Buat Gudang",
                      onConfirm: () => {
                        setFeedback("Formulir gudang baru siap diisi.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Tambah Gudang
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
                            setSelectedIds(paginatedWarehouses.map((w) => w.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("code")}>
                      <div className="flex items-center gap-1">Kode <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nama Gudang & Tipe <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Alamat Lokasi</th>
                    <th className="p-3">Penanggung Jawab (PIC)</th>
                    <th className="p-3 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("capacityM3")}>
                      <div className="flex items-center justify-end gap-1">Kapasitas <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 text-center">Utilisasi</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedWarehouses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Tidak ada gudang yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedWarehouses.map((item) => {
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
                          <td className="p-3 font-mono font-semibold text-foreground">{item.code}</td>
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-[11px] text-muted-foreground">{item.type}</div>
                          </td>
                          <td className="p-3 max-w-xs text-muted-foreground">
                            <div className="flex items-start gap-1">
                              <MapPinIcon className="size-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
                              <span className="truncate">{item.address}</span>
                            </div>
                          </td>
                          <td className="p-3 text-foreground">
                            <div className="font-medium">{item.picName}</div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <PhoneIcon className="size-3" />
                              <span>{item.picPhone}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-foreground">
                            {item.capacityM3.toLocaleString("id-ID")} m³
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-14 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.utilizationRate >= 80
                                      ? "bg-red-500"
                                      : item.utilizationRate >= 60
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${item.utilizationRate}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-medium">{item.utilizationRate}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Aktif"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : item.status === "Maintenance"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
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
                                    title: "Edit Data Gudang",
                                    description: `Perbarui konfigurasi kontak PIC atau kapasitas untuk ${item.name}.`,
                                    variant: "default",
                                    confirmText: "Simpan Perubahan",
                                    onConfirm: () => {
                                      setFeedback(`Data gudang ${item.name} berhasil disimpan.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <Edit2Icon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.name)}
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
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredWarehouses.length)} dari {filteredWarehouses.length} data
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
