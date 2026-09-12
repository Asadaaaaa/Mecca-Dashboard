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
import { CategoryDialog } from "@/pages/products/category-dialog"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import type { ProductCategory, ProductCategoryMetrics, ProductCategoryFormData } from "@/types/product.types"
import {
  SunIcon,
  MoonIcon,
  LayersIcon,
  BoxesIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SearchIcon,
  PlusIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  Loader2Icon,
  CheckIcon,
} from "lucide-react"

export default function CategoriesPage() {
  const { theme, setTheme } = useTheme()

  const [metrics, setMetrics] = useState<ProductCategoryMetrics>({
    total_categories: 0,
    active_categories: 0,
    inactive_categories: 0,
    total_products: 0,
  })

  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 10

  // Modals
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
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

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await productService.getCategoryMetrics()
      setMetrics(data)
    } catch (err) {
      console.error("Failed to load category metrics:", err)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productService.getCategories({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort: sortField,
        order: sortOrder,
      })
      setCategories(res.items || [])
      setTotalCount(res.pagination?.total || 0)
    } catch (err) {
      console.error("Failed to load categories:", err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, sortField, sortOrder])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
    setPage(1)
  }

  const handleSaveCategory = async (data: ProductCategoryFormData) => {
    if (selectedCategory) {
      await productService.updateCategory(selectedCategory.id, data)
      showToast("Kategori produk berhasil diperbarui")
    } else {
      await productService.createCategory(data)
      showToast("Kategori baru berhasil ditambahkan")
    }
    fetchMetrics()
    fetchCategories()
  }

  const handleDelete = (cat: ProductCategory) => {
    setConfirmModal({
      open: true,
      title: "Hapus Kategori",
      description: `Apakah Anda yakin ingin menghapus kategori "${cat.name}" (${cat.code})?`,
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: async () => {
        try {
          await productService.deleteCategory(cat.id)
          showToast(`Kategori "${cat.name}" berhasil dihapus`)
          fetchMetrics()
          fetchCategories()
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string }
          showToast(e.response?.data?.message || "Gagal menghapus kategori")
        }
      },
    })
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
                <BreadcrumbPage className="font-semibold">Daftar Kategori</BreadcrumbPage>
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
            <h1 className="text-2xl font-bold tracking-tight">Kategori Produk</h1>
            <p className="text-sm text-muted-foreground">
              Kelola pengelompokan klasifikasi katalog barang untuk mempermudah manajemen harga, inventaris, dan filter transaksi.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedCategory(null)
              setDialogOpen(true)
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground shadow"
          >
            <PlusIcon className="size-4" />
            Tambah Kategori
          </Button>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Kategori</p>
                <h3 className="text-2xl font-bold mt-1">{metrics.total_categories}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Klasifikasi produk</p>
              </div>
              <div className="rounded-full bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
                <LayersIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Kategori Aktif</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {metrics.active_categories}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Tersedia di katalog</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Nonaktif</p>
                <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                  {metrics.inactive_categories}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Arsip / Discontinued</p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                <XCircleIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Produk Terhubung</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  {metrics.total_products}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">SKU terdaftar</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <BoxesIcon className="size-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Table Container */}
        <Card className="border">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between border-b">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari kode, nama kategori, deskripsi..."
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
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif Saja</option>
                  <option value="inactive">Nonaktif Saja</option>
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
                      Nama Kategori
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3">Deskripsi</th>
                  <th className="px-6 py-3 text-center">Jumlah Produk</th>
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
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2Icon className="size-6 animate-spin text-primary" />
                        <span>Memuat data kategori...</span>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <LayersIcon className="size-8 text-muted-foreground/50" />
                        <span>Tidak ada kategori ditemukan</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-primary text-xs">
                        {cat.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">ID #{cat.id}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm text-muted-foreground">
                        {cat.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                          {cat.product_count || 0} Produk
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cat.status === "active"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              cat.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {cat.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedCategory(cat)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit2Icon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(cat)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Menampilkan {categories.length > 0 ? (page - 1) * limit + 1 : 0} hingga{" "}
              {Math.min(page * limit, totalCount)} dari {totalCount} kategori
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

      {/* Category Modal Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        onSave={handleSaveCategory}
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
