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
  PackageIcon,
  LayersIcon,
  AlertOctagonIcon,
  CoinsIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  CheckIcon,
} from "lucide-react"

interface ProductItem {
  id: number
  sku: string
  name: string
  category: string
  unit: string
  purchasePrice: number
  sellingPrice: number
  stock: number
  minStock: number
  status: "Tersedia" | "Menipis" | "Habis"
}

const DUMMY_PRODUCTS: ProductItem[] = [
  { id: 1, sku: "PRD-001", name: "Beras Premium Rojolele 5kg", category: "Bahan Pokok", unit: "KARUNG", purchasePrice: 65000, sellingPrice: 74000, stock: 450, minStock: 50, status: "Tersedia" },
  { id: 2, sku: "PRD-002", name: "Minyak Goreng Bimoli 2L", category: "Bahan Pokok", unit: "POUCH", purchasePrice: 31000, sellingPrice: 36500, stock: 120, minStock: 30, status: "Tersedia" },
  { id: 3, sku: "PRD-003", name: "Gula Pasir Gulaku 1kg", category: "Bahan Pokok", unit: "BKS", purchasePrice: 15500, sellingPrice: 18000, stock: 24, minStock: 50, status: "Menipis" },
  { id: 4, sku: "PRD-004", name: "Tepung Terigu Segitiga Biru 1kg", category: "Bahan Pokok", unit: "BKS", purchasePrice: 11000, sellingPrice: 13500, stock: 0, minStock: 25, status: "Habis" },
  { id: 5, sku: "PRD-005", name: "Susu Kental Manis Frisian Flag 370g", category: "Minuman & Susu", unit: "KALENG", purchasePrice: 11200, sellingPrice: 13000, stock: 280, minStock: 40, status: "Tersedia" },
  { id: 6, sku: "PRD-006", name: "Kopi Kapal Api Spesial Mix 20x24g", category: "Minuman & Susu", unit: "RENCENG", purchasePrice: 22000, sellingPrice: 26000, stock: 95, minStock: 20, status: "Tersedia" },
  { id: 7, sku: "PRD-007", name: "Mie Instan Indomie Goreng Spesial", category: "Makanan Siap Saji", unit: "DUS", purchasePrice: 108000, sellingPrice: 122000, stock: 15, minStock: 30, status: "Menipis" },
  { id: 8, sku: "PRD-008", name: "Kecap Manis Bango Refill 550ml", category: "Bumbu Dapur", unit: "POUCH", purchasePrice: 21500, sellingPrice: 25500, stock: 80, minStock: 25, status: "Tersedia" },
  { id: 9, sku: "PRD-009", name: "Garam Dapur Cap Kapal 250g", category: "Bumbu Dapur", unit: "BKS", purchasePrice: 2500, sellingPrice: 4000, stock: 320, minStock: 50, status: "Tersedia" },
  { id: 10, sku: "PRD-010", name: "Sabun Mandi Lifebuoy Total 10 4x110g", category: "Perawatan Diri", unit: "PACK", purchasePrice: 24000, sellingPrice: 29000, stock: 65, minStock: 15, status: "Tersedia" },
]

function formatRupiah(amount: number) {
  return `IDR ${amount.toLocaleString("id-ID")}`
}

export default function ProductsPage() {
  const { theme, setTheme } = useTheme()
  const [products, setProducts] = useState<ProductItem[]>(DUMMY_PRODUCTS)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [categoryFilter, setCategoryFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof ProductItem>("name")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC")
  const [page, setPage] = useState(1)
  const limit = 8

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description?: string
    variant?: "default" | "destructive" | "warning" | "success"
    onConfirm?: () => void
  }>({ open: false, title: "" })

  const [feedback, setFeedback] = useState<string | null>(null)

  // Metrics
  const totalProducts = products.length
  const totalCategories = new Set(products.map((p) => p.category)).size
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length
  const totalAssetValue = products.reduce((acc, p) => acc + p.purchasePrice * p.stock, 0)

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = categoryFilter === "Semua" || p.category === categoryFilter
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [products, search, categoryFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredProducts.length / limit) || 1
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof ProductItem) => {
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
      title: "Hapus Produk",
      description: `Apakah Anda yakin ingin menghapus produk "${name}"?`,
      variant: "destructive",
      onConfirm: () => {
        setProducts((prev) => prev.filter((p) => p.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Produk "${name}" berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Produk Terpilih",
      description: `Hapus ${selectedIds.length} produk yang dipilih dari katalog?`,
      variant: "destructive",
      onConfirm: () => {
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} produk berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.id))

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
                  <BreadcrumbLink href="/products" className="cursor-pointer hover:text-foreground transition-colors">Produk & Kategori</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Daftar Produk</BreadcrumbPage>
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Katalog Master Produk</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Kelola seluruh data SKU, penetapan harga jual/beli, dan ambang batas stok aman.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Produk</span>
                <PackageIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalProducts}</div>
              <div className="mt-2 text-xs text-muted-foreground">SKU terdaftar aktif</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategori Aktif</span>
                <LayersIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalCategories}</div>
              <div className="mt-2 text-xs text-muted-foreground">Pengelompokan barang</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stok Kritis / Habis</span>
                <AlertOctagonIcon className="size-4 text-amber-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{lowStockCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">Perlu segera dipesan ulang</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nilai Total Aset</span>
                <CoinsIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatRupiah(totalAssetValue)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Berdasarkan harga perolehan</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari SKU atau nama produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <FilterIcon className="size-3.5 text-muted-foreground ml-1" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-9 rounded-md border border-input bg-card px-2.5 text-xs font-medium cursor-pointer hover:border-foreground/40 transition-colors"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Bahan Pokok">Bahan Pokok</option>
                    <option value="Minuman & Susu">Minuman & Susu</option>
                    <option value="Makanan Siap Saji">Makanan Siap Saji</option>
                    <option value="Bumbu Dapur">Bumbu Dapur</option>
                    <option value="Perawatan Diri">Perawatan Diri</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => alert("Form tambah produk baru dibuka (dummy).")}
                  className="h-9 gap-1.5 text-xs cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 shadow-sm transition-all dark:bg-neutral-100 dark:text-neutral-900"
                >
                  <PlusIcon className="size-4" />
                  <span>Tambah Produk</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert("Ekspor katalog produk ke CSV.")}
                  className="h-9 w-9 p-0 cursor-pointer hover:bg-accent active:scale-95 transition-all"
                  title="Ekspor CSV"
                >
                  <DownloadIcon className="size-4" />
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedIds.length === 0}
                  onClick={handleBatchDelete}
                  className="h-9 gap-1.5 text-xs cursor-pointer bg-rose-500 hover:bg-rose-600 active:scale-95 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Hapus ({selectedIds.length})</span>
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground font-medium">
                  <tr>
                    <th className="w-10 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => {
                          if (isAllSelected) setSelectedIds([])
                          else setSelectedIds(paginatedProducts.map((p) => p.id))
                        }}
                        className="size-4 rounded-sm border-gray-300 accent-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("sku")}>
                      <div className="flex items-center gap-1">SKU <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nama Produk <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Satuan</th>
                    <th className="px-4 py-3 text-right">Harga Beli</th>
                    <th className="px-4 py-3 text-right">Harga Jual</th>
                    <th className="px-4 py-3 text-center">Sisa Stok</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40">
                  {paginatedProducts.map((p) => {
                    const isSelected = selectedIds.includes(p.id)
                    return (
                      <tr key={p.id} className={`transition-colors hover:bg-muted/40 ${isSelected ? "bg-muted/60" : ""}`}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                              )
                            }}
                            className="size-4 rounded-sm border-gray-300 accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-foreground whitespace-nowrap">{p.sku}</td>
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.category}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.unit}</td>
                        <td className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">{formatRupiah(p.purchasePrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">{formatRupiah(p.sellingPrice)}</td>
                        <td className="px-4 py-3 text-center font-bold whitespace-nowrap">{p.stock}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              p.status === "Tersedia"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : p.status === "Menipis"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => alert(`Edit produk: ${p.name}`)}
                              className="cursor-pointer hover:bg-primary/15 hover:text-primary active:scale-90 transition-all rounded-md"
                              title="Edit Produk"
                            >
                              <Edit2Icon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDeleteSingle(p.id, p.name)}
                              className="cursor-pointer hover:bg-rose-500/15 hover:text-rose-600 active:scale-90 transition-all rounded-md"
                              title="Hapus Produk"
                            >
                              <Trash2Icon className="size-3.5 text-rose-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 p-4 border-t border-border/60 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
              <div>
                Menampilkan <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> sampai{" "}
                <span className="font-medium text-foreground">{Math.min(page * limit, filteredProducts.length)}</span> dari{" "}
                <span className="font-medium text-foreground">{filteredProducts.length}</span> produk
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs cursor-pointer hover:bg-accent/80 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeftIcon className="size-3.5 mr-1" /> Sebelumnya
                </Button>
                <span className="px-2 text-xs font-medium">Hal {page} dari {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs cursor-pointer hover:bg-accent/80 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya <ChevronRightIcon className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Reusable Confirm Modal */}
        <ConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
          title={confirmModal.title}
          description={confirmModal.description}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
        />
      </SidebarInset>
  )
}
