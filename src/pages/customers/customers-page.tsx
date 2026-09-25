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
import { customerService } from "@/services/customer.service"
import { CustomerDialog } from "@/pages/customers/customer-dialog"
import { ConfirmModal, type ConfirmModalVariant } from "@/components/ui/confirm-modal"
import type { Customer, CustomerMetrics } from "@/types/customer.types"
import {
  SunIcon,
  MoonIcon,
  UsersIcon,
  UserCheckIcon,
  CrownIcon,
  AlertTriangleIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  CalendarIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  Edit2Icon,
  CheckIcon,
} from "lucide-react"

function formatRupiah(val: number | string): string {
  const num = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(num)) return "IDR 0"
  return `IDR ${num.toLocaleString("id-ID")}`
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "-"
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export default function CustomersPage() {
  const { resolvedTheme, toggleTheme } = useTheme()

  // State
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    newThisMonth: 0,
    returningCustomers: 0,
    retentionRate: 0,
    biggestSpender: { name: "-", spend: 0, initials: "-" },
    outstandingDebt: 0,
    customersWithDebt: 0,
  })

  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sortField, setSortField] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [hasDebtFilter, setHasDebtFilter] = useState(false)
  const [timePeriod, setTimePeriod] = useState("All Time")

  // Modal Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Confirm / Alert Modal State (DRY)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description?: string
    type?: "confirm" | "alert"
    variant?: ConfirmModalVariant
    confirmText?: string
    onConfirm?: () => Promise<void> | void
    loading?: boolean
  }>({
    open: false,
    title: "",
  })

  // Feedback Banner
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await customerService.getCustomerMetrics()
      setMetrics(data)
    } catch (err) {
      console.error("Failed to load metrics", err)
    }
  }, [])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await customerService.getCustomers({
        page,
        limit,
        search,
        sort: sortField,
        order: sortOrder,
        hasDebt: hasDebtFilter,
      })
      setCustomers(res.items || [])
      setTotalCount(res.pagination?.total || 0)
      setTotalPages(res.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Failed to load customers", err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, sortField, sortOrder, hasDebtFilter])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
    setPage(1)
  }

  // Single Delete with Confirm Modal
  const handleDeleteSingle = (id: number, name: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Customer",
      description: `Apakah Anda yakin ingin menghapus customer "${name}"?`,
      variant: "destructive",
      confirmText: "Ya, Hapus",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }))
        try {
          await customerService.deleteCustomer(id)
          setFeedback(`Customer "${name}" berhasil dihapus.`)
          setTimeout(() => setFeedback(null), 4000)
          fetchCustomers()
          fetchMetrics()
        } catch {
          setConfirmModal({
            open: true,
            title: "Gagal Menghapus",
            description: `Gagal menghapus customer "${name}".`,
            type: "alert",
            variant: "destructive",
          })
        } finally {
          setConfirmModal((prev) => ({ ...prev, loading: false }))
        }
      },
    })
  }

  // Export CSV with Alert Modal when empty
  const handleExportCSV = () => {
    const listToExport = customers

    if (listToExport.length === 0) {
      setConfirmModal({
        open: true,
        title: "Ekspor Data Customer",
        description: "Tidak ada data customer yang tersedia untuk diekspor ke format CSV.",
        type: "alert",
        variant: "warning",
        confirmText: "Tutup",
      })
      return
    }

    const headers = [
      "Code",
      "Customer Name",
      "Phone",
      "Email",
      "Address",
      "Created At",
    ]

    const rows = listToExport.map((c) => [
      c.code,
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone || "-",
      c.email || "-",
      `"${(c.address || "-").replace(/"/g, '""')}"`,
      c.created_at,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `customers_export_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <SidebarInset>
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 cursor-pointer hover:bg-accent transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="cursor-pointer hover:text-foreground transition-colors">
                    Mecca Distribution
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/customers" className="cursor-pointer hover:text-foreground transition-colors">
                    Customers
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Daftar Customer</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTheme}
              title="Ganti Tema"
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all"
            >
              {resolvedTheme === "dark" ? (
                <SunIcon className="size-4 text-amber-400" />
              ) : (
                <MoonIcon className="size-4 text-slate-700" />
              )}
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6 p-6">
          {/* Subtitle & Top Right Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground font-normal">
              Overview of customer data and performance metrics
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant={hasDebtFilter ? "default" : "outline"}
                size="sm"
                className="h-9 gap-1.5 text-xs font-medium cursor-pointer hover:bg-accent/80 active:scale-98 transition-all"
                onClick={() => setHasDebtFilter(!hasDebtFilter)}
                title={hasDebtFilter ? "Filter Aktif: Hanya Pelanggan Berhutang" : "Filter Pelanggan"}
              >
                <FilterIcon className="size-3.5" />
                <span>{hasDebtFilter ? "Hanya Berhutang" : "Filter"}</span>
              </Button>

              <div className="relative">
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="h-9 appearance-none rounded-md border border-input bg-card pl-8 pr-7 text-xs font-medium shadow-2xs cursor-pointer hover:border-foreground/40 transition-colors focus:outline-hidden"
                >
                  <option value="All Time">All Time</option>
                  <option value="This Month">This Month</option>
                  <option value="This Quarter">This Quarter</option>
                  <option value="This Year">This Year</option>
                </select>
                <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
              <CheckIcon className="size-4 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Customers */}
            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total Customers</span>
                <UsersIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {metrics.totalCustomers.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Registered customers
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  +{metrics.newThisMonth} new this month
                </span>
              </div>
            </Card>

            {/* Card 2: Returning Customers */}
            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Returning Customers</span>
                <UserCheckIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {metrics.returningCustomers.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Have visited multiple times
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  {metrics.retentionRate}% retention rate
                </span>
              </div>
            </Card>

            {/* Card 3: Biggest Spender */}
            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Biggest Spender</span>
                <CrownIcon className="size-4 text-amber-500 fill-amber-500/20" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-sm text-foreground/80">
                  {metrics.biggestSpender.initials}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-foreground text-sm truncate">
                    {metrics.biggestSpender.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatRupiah(metrics.biggestSpender.spend)}
                  </div>
                </div>
              </div>
              <div className="mt-4 h-5" />
            </Card>

            {/* Card 4: Outstanding Debt */}
            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Outstanding Debt</span>
                <AlertTriangleIcon className="size-4 text-rose-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-500">
                  {formatRupiah(metrics.outstandingDebt)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total unpaid amount
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  {metrics.customersWithDebt} customers with debt
                </span>
              </div>
            </Card>
          </div>

          {/* Main Data Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            {/* Table Toolbar */}
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 pl-9 text-xs"
                />
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center gap-2">
                {/* Add Customer Button (+) */}
                <Button
                  size="sm"
                  className="h-9 w-9 p-0 cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 shadow-sm hover:shadow transition-all dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  onClick={() => {
                    setEditingCustomer(null)
                    setDialogOpen(true)
                  }}
                  title="Tambah Customer Baru"
                >
                  <PlusIcon className="size-4" />
                </Button>

                {/* Export CSV Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-900 active:scale-95 shadow-sm hover:shadow transition-all dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  onClick={handleExportCSV}
                  title="Export Data CSV"
                >
                  <DownloadIcon className="size-4" />
                </Button>
              </div>
            </div>

            {/* Table Container */}
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground font-medium">
                  <tr>
                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Customer Name</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("phone")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Phone</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("affiliate")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Affiliate</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("date_of_birth")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date of Birth</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("first_visit")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>First Visit</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("recent_visit")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Recent Visit</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("lifetime_spend")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Lifetime Spend</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th
                      className="cursor-pointer px-4 py-3 font-medium hover:text-foreground transition-colors"
                      onClick={() => handleSort("total_unpaid")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Total Unpaid</span>
                        <ArrowUpDownIcon className="size-3 text-muted-foreground/60" />
                      </div>
                    </th>

                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="h-40 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2Icon className="size-5 animate-spin text-primary" />
                          <span>Memuat data pelanggan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="h-32 text-center text-muted-foreground">
                        Tidak ada data customer yang cocok dengan kriteria.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => {
                      const unpaidNum = parseFloat(String(c.total_unpaid || 0))
                      const hasUnpaid = unpaidNum > 0

                      return (
                        <tr
                          key={c.id}
                          className="transition-colors hover:bg-muted/40"
                        >
                          <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                            {c.name}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {c.phone || "-"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {c.affiliate || "-"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(c.date_of_birth)}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(c.first_visit)}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(c.recent_visit)}
                          </td>

                          <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                            {formatRupiah(c.lifetime_spend)}
                          </td>

                          <td
                            className={`px-4 py-3 font-semibold whitespace-nowrap ${
                              hasUnpaid ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500"
                            }`}
                          >
                            {formatRupiah(c.total_unpaid)}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                  setEditingCustomer(c)
                                  setDialogOpen(true)
                                }}
                                title="Edit Customer"
                                className="cursor-pointer hover:bg-primary/15 hover:text-primary active:scale-90 transition-all rounded-md"
                              >
                                <Edit2Icon className="size-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleDeleteSingle(c.id, c.name)}
                                title="Hapus Customer"
                                className="cursor-pointer hover:bg-rose-500/15 hover:text-rose-600 active:scale-90 transition-all rounded-md"
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

            {/* Pagination Controls */}
            <div className="flex flex-col gap-3 p-4 border-t border-border/60 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
              <div>
                Menampilkan{" "}
                <span className="font-medium text-foreground">
                  {totalCount > 0 ? (page - 1) * limit + 1 : 0}
                </span>{" "}
                sampai{" "}
                <span className="font-medium text-foreground">
                  {Math.min(page * limit, totalCount)}
                </span>{" "}
                dari <span className="font-medium text-foreground">{totalCount}</span> pelanggan
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs cursor-pointer hover:bg-accent/80 active:scale-98 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeftIcon className="size-3.5 mr-1" />
                  Sebelumnya
                </Button>

                <span className="px-2 text-xs font-medium">
                  Hal {page} dari {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs cursor-pointer hover:bg-accent/80 active:scale-98 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                  <ChevronRightIcon className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Modal Dialog Add/Edit Customer */}
        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={editingCustomer}
          onSuccess={() => {
            fetchCustomers()
            fetchMetrics()
            setFeedback(
              editingCustomer
                ? "Data customer berhasil diperbarui."
                : "Customer baru berhasil ditambahkan."
            )
            setTimeout(() => setFeedback(null), 4000)
          }}
        />

        {/* Reusable DRY Confirm / Alert Modal */}
        <ConfirmModal
          open={confirmModal.open}
          onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
          title={confirmModal.title}
          description={confirmModal.description}
          type={confirmModal.type}
          variant={confirmModal.variant}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          loading={confirmModal.loading}
        />
      </SidebarInset>
  )
}
