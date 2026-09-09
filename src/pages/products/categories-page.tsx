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
  LayersIcon,
  FolderTreeIcon,
  BoxesIcon,
  CheckCircle2Icon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  CheckIcon,
} from "lucide-react"

interface CategoryItem {
  id: number
  code: string
  name: string
  description: string
  productCount: number
  status: "Aktif" | "Nonaktif"
}

const DUMMY_CATEGORIES: CategoryItem[] = [
  { id: 1, code: "CAT-001", name: "Bahan Pokok", description: "Sembako inti seperti beras, minyak goreng, gula, dan tepung", productCount: 42, status: "Aktif" },
  { id: 2, code: "CAT-002", name: "Minuman & Susu", description: "Produk olahan susu, kopi bubuk, teh, sirup, dan minuman kemasan", productCount: 28, status: "Aktif" },
  { id: 3, code: "CAT-003", name: "Makanan Siap Saji", description: "Mie instan, biskuit, sereal sarapan, dan camilan kering", productCount: 35, status: "Aktif" },
  { id: 4, code: "CAT-004", name: "Bumbu Dapur", description: "Garam, kecap, saus, bumbu instan, penyedap rasa, dan rempah", productCount: 19, status: "Aktif" },
  { id: 5, code: "CAT-005", name: "Perawatan Diri", description: "Sabun mandi, pasta gigi, sampo, dan produk kebersihan tubuh", productCount: 22, status: "Aktif" },
  { id: 6, code: "CAT-006", name: "Pembersih Rumah Tangga", description: "Deterjen pencuci pakaian, cairan pembersih lantai, dan sabun cuci piring", productCount: 14, status: "Aktif" },
  { id: 7, code: "CAT-007", name: "Perlengkapan Bayi & Anak", description: "Popok sekali pakai, susu formula anak, dan makanan pendamping", productCount: 8, status: "Nonaktif" },
]

export default function CategoriesPage() {
  const { theme, setTheme } = useTheme()
  const [categories, setCategories] = useState<CategoryItem[]>(DUMMY_CATEGORIES)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [sortField, setSortField] = useState<keyof CategoryItem>("name")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC")
  const [page, setPage] = useState(1)
  const limit = 5

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description?: string
    variant?: "default" | "destructive" | "warning" | "success"
    onConfirm?: () => void
  }>({ open: false, title: "" })

  const [feedback, setFeedback] = useState<string | null>(null)

  const totalCategories = categories.length
  const activeCategories = categories.filter((c) => c.status === "Aktif").length
  const totalLinkedProducts = categories.reduce((acc, c) => acc + c.productCount, 0)

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => {
        return (
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
        )
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [categories, search, sortField, sortOrder])

  const totalPages = Math.ceil(filteredCategories.length / limit) || 1
  const paginated = filteredCategories.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof CategoryItem) => {
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
      title: "Hapus Kategori",
      description: `Apakah Anda yakin ingin menghapus kategori "${name}"?`,
      variant: "destructive",
      onConfirm: () => {
        setCategories((prev) => prev.filter((c) => c.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Kategori "${name}" berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Kategori Terpilih",
      description: `Hapus ${selectedIds.length} kategori yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setCategories((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} kategori berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginated.length > 0 && paginated.every((c) => selectedIds.includes(c.id))

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
                  <BreadcrumbPage>Daftar Kategori</BreadcrumbPage>
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
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Struktur Kategori Produk</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Klasifikasi dan taksonomi barang untuk pelaporan penjualan dan pengelolaan persediaan.</p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Kategori</span>
                <LayersIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalCategories}</div>
              <div className="mt-2 text-xs text-muted-foreground">Kelompok produk induk</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategori Aktif</span>
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{activeCategories}</div>
              <div className="mt-2 text-xs text-muted-foreground">Siap digunakan pada katalog</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Item Tertaut</span>
                <BoxesIcon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalLinkedProducts}</div>
              <div className="mt-2 text-xs text-muted-foreground">SKU terhubung kategori</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tingkat Taksonomi</span>
                <FolderTreeIcon className="size-4 text-purple-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">1 Tingkat</div>
              <div className="mt-2 text-xs text-muted-foreground">Struktur kategori langsung</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari kode atau nama kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => alert("Form tambah kategori baru dibuka (dummy).")}
                  className="h-9 gap-1.5 text-xs cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 shadow-sm transition-all dark:bg-neutral-100 dark:text-neutral-900"
                >
                  <PlusIcon className="size-4" />
                  <span>Tambah Kategori</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert("Ekspor data kategori ke CSV.")}
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
                          else setSelectedIds(paginated.map((c) => c.id))
                        }}
                        className="size-4 rounded-sm border-gray-300 accent-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("code")}>
                      <div className="flex items-center gap-1">Kode <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nama Kategori <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3 text-center cursor-pointer hover:text-foreground" onClick={() => handleSort("productCount")}>
                      <div className="flex items-center justify-center gap-1">Jumlah SKU <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40">
                  {paginated.map((c) => {
                    const isSelected = selectedIds.includes(c.id)
                    return (
                      <tr key={c.id} className={`transition-colors hover:bg-muted/40 ${isSelected ? "bg-muted/60" : ""}`}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                              )
                            }}
                            className="size-4 rounded-sm border-gray-300 accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-foreground whitespace-nowrap">{c.code}</td>
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{c.description}</td>
                        <td className="px-4 py-3 text-center font-bold text-foreground whitespace-nowrap">{c.productCount}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              c.status === "Aktif"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => alert(`Edit kategori: ${c.name}`)}
                              className="cursor-pointer hover:bg-primary/15 hover:text-primary active:scale-90 transition-all rounded-md"
                              title="Edit Kategori"
                            >
                              <Edit2Icon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDeleteSingle(c.id, c.name)}
                              className="cursor-pointer hover:bg-rose-500/15 hover:text-rose-600 active:scale-90 transition-all rounded-md"
                              title="Hapus Kategori"
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
                <span className="font-medium text-foreground">{Math.min(page * limit, filteredCategories.length)}</span> dari{" "}
                <span className="font-medium text-foreground">{filteredCategories.length}</span> kategori
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
