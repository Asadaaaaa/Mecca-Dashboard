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
import { productService } from "@/services/product.service"
import { ProductDialog } from "@/pages/products/product-dialog"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import type { Product, ProductMetrics, ProductFormData, ProductCategory, Unit } from "@/types/product.types"
import {
  SunIcon,
  MoonIcon,
  PackageIcon,
  LayersIcon,
  BoxesIcon,
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
  Loader2Icon,
  CheckIcon,
} from "lucide-react"

function formatRupiah(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(num)) return "IDR 0"
  return `IDR ${num.toLocaleString("id-ID")}`
}

export default function ProductsPage() {
  const { theme, setTheme } = useTheme()

  const [metrics, setMetrics] = useState<ProductMetrics>({
    total_products: 0,
    active_products: 0,
    total_categories: 0,
    average_price: 0,
  })

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 10

  // Modals
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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

  const fetchDependencies = useCallback(async () => {
    try {
      const [catsRes, unitsRes] = await Promise.all([
        productService.getCategories({ limit: 100 }),
        productService.getUnits(),
      ])
      setCategories(catsRes.items || [])
      setUnits(unitsRes || [])
    } catch (err) {
      console.error("Failed to load categories/units:", err)
    }
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await productService.getProductMetrics()
      setMetrics(data)
    } catch (err) {
      console.error("Failed to load product metrics:", err)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productService.getProducts({
        page,
        limit,
        search: search.trim() || undefined,
        category_id: categoryFilter !== "all" ? categoryFilter : undefined,
        unit_id: unitFilter !== "all" ? unitFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort: sortField,
        order: sortOrder,
      })
      setProducts(res.items || [])
      setTotalCount(res.pagination?.total || 0)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, categoryFilter, unitFilter, statusFilter, sortField, sortOrder])

  useEffect(() => {
    fetchDependencies()
    fetchMetrics()
  }, [fetchDependencies, fetchMetrics])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
    setPage(1)
  }

  const handleSaveProduct = async (data: ProductFormData) => {
    if (selectedProduct) {
      await productService.updateProduct(selectedProduct.id, data)
      showToast("Produk berhasil diperbarui")
    } else {
      await productService.createProduct(data)
      showToast("Produk baru berhasil ditambahkan")
    }
    fetchMetrics()
    fetchProducts()
  }

  const handleDelete = (prd: Product) => {
    setConfirmModal({
      open: true,
      title: "Hapus Produk",
      description: `Apakah Anda yakin ingin menghapus produk "${prd.name}" (${prd.code})?`,
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await productService.deleteProduct(prd.id)
          showToast(`Produk "${prd.name}" berhasil dihapus`)
          fetchMetrics()
          fetchProducts()
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string }
          showToast(e.response?.data?.message || "Gagal menghapus produk")
        }
      },
    })
  }

  const handleExportCSV = () => {
    if (products.length === 0) return
    const headers = ["ID", "Kode", "Nama Produk", "Kategori", "Satuan", "Harga Jual", "Status"]
    const rows = products.map((p) => [
      p.id,
      p.code,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category?.name || "-",
      p.unit?.code || "-",
      p.selling_price,
      p.status === "active" ? "Aktif" : "Nonaktif",
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `products_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast("Data produk berhasil diexport ke CSV")
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
                <BreadcrumbLink href="/products">Produk & Kategori</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Daftar Produk</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full"
        >
          {theme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4" />}
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
            <h1 className="text-2xl font-bold tracking-tight">Katalog Produk & Master Item</h1>
            <p className="text-sm text-muted-foreground">
              Kelola daftar master produk, penetapan harga jual, klasifikasi kategori, dan satuan unit (PCS & BOX).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs font-medium"
            >
              <DownloadIcon className="size-3.5 mr-1" />
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setSelectedProduct(null)
                setDialogOpen(true)
              }}
              className="flex items-center gap-2 bg-primary text-primary-foreground shadow"
            >
              <PlusIcon className="size-4" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Produk</p>
                <h3 className="text-2xl font-bold mt-1">{metrics.total_products}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">SKU katalog terdaftar</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <PackageIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Produk Aktif</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {metrics.active_products}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Siap dijual</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <BoxesIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Kategori</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {metrics.total_categories}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Kategori aktif</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
                <LayersIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Rata-rata Harga</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {formatRupiah(metrics.average_price)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Harga jual per unit</p>
              </div>
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <CoinsIcon className="size-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Table Container */}
        <Card className="border">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between border-b">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-full max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari kode, nama produk, spesifikasi..."
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
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={unitFilter}
                  onChange={(e) => {
                    setUnitFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">Semua Satuan</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code}
                    </option>
                  ))}
                </select>

                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
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
                      Nama Produk
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3 text-center">Satuan</th>
                  <th
                    className="px-6 py-3 text-right cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort("selling_price")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Harga Jual
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
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
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2Icon className="size-6 animate-spin text-primary" />
                        <span>Memuat katalog produk...</span>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <PackageIcon className="size-8 text-muted-foreground/50" />
                        <span>Tidak ada produk ditemukan</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((prd) => {
                    return (
                      <tr
                        key={prd.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-medium text-primary text-xs">
                          {prd.code}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{prd.name}</div>
                          {prd.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
                              {prd.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {prd.category ? (
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                              {prd.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold font-mono ${
                              prd.unit?.code === "BOX"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {prd.unit?.code || "PCS"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                          {formatRupiah(prd.selling_price)}
                          {prd.tax && (
                            <div className="text-[10px] text-muted-foreground font-normal">
                              +{prd.tax.code} ({prd.tax.rate}%)
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              prd.status === "active"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                prd.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {prd.status === "active" ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setSelectedProduct(prd)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit2Icon className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(prd)}
                            >
                              <Trash2Icon className="size-4" />
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
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Menampilkan {products.length > 0 ? (page - 1) * limit + 1 : 0} hingga{" "}
              {Math.min(page * limit, totalCount)} dari {totalCount} produk
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

      {/* Product Modal Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
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
