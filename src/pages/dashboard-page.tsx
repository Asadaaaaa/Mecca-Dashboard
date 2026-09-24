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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { DateRangePicker, type DateRange } from "@/components/date-range-picker"
import { dashboardService } from "@/services/dashboard.service"
import type { DashboardMetrics, RecentTransaction, SalesTrendPoint } from "@/types/dashboard.types"
import {
  SunIcon,
  MoonIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ClockIcon,
  CheckCircle2Icon,
  ShoppingCartIcon,
  AlertCircleIcon,
  ArrowUpRightIcon,
  Loader2Icon,
  ReceiptIcon,
  CreditCardIcon,
  PackageIcon,
  SparklesIcon,
} from "lucide-react"

function formatRupiah(amount: number | string | undefined): string {
  const val = typeof amount === "string" ? parseFloat(amount) || 0 : amount || 0
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Baru saja"
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return new Date(dateStr).toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { theme, setTheme } = useTheme()

  const todayStr = new Date().toISOString().split("T")[0]
  const now = new Date()
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: firstDayOfMonth,
    endDate: todayStr,
    preset: "thisMonth",
    label: "Bulan Ini",
  })

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    unpaidSales: 0,
    paidSales: 0,
    transactions: 0,
    growthRate: "+0%",
    unpaidRatio: "0%",
    paidRatio: "0%",
    transactionGrowth: "+0%",
  })

  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [m, r, t] = await Promise.all([
        dashboardService.getDashboardMetrics({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
        }),
        dashboardService.getRecentTransactions(5),
        dashboardService.getSalesTrend({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
        }),
      ])

      setMetrics(m)
      setRecentTransactions(r)
      setSalesTrend(t)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }, [dateRange.startDate, dateRange.endDate])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Chart calculation
  const maxTrendSales = Math.max(
    ...salesTrend.map((p) => Math.max(p.sales, p.paid)),
    1000000
  )

  const isGrowthPositive = !metrics.growthRate.startsWith("-")
  const isTransGrowthPositive = !metrics.transactionGrowth.startsWith("-")

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 cursor-pointer hover:bg-accent transition-colors" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/" className="cursor-pointer hover:text-foreground transition-colors">
                  Mecca Distribution
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={toggleTheme}
            title="Ubah tema gelap / terang"
            className="cursor-pointer hover:bg-accent active:scale-95 transition-all"
          >
            {theme === "dark" ? (
              <SunIcon className="size-4 text-amber-400" />
            ) : (
              <MoonIcon className="size-4 text-slate-700" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Top Greeting & Date Range Picker */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Dashboard Analitik & Penjualan</span>
              <SparklesIcon className="size-5 text-amber-500 animate-pulse hidden sm:inline" />
            </h1>
            <p className="text-xs text-muted-foreground">
              Pemantauan performa rantai distribusi, pendapatan, piutang komersial, dan arus kas riil.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2Icon className="size-4 animate-spin text-muted-foreground mr-1" />}
            <DateRangePicker
              value={dateRange}
              onChange={(range) => setDateRange(range)}
            />
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Penjualan
              </CardTitle>
              <DollarSignIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatRupiah(metrics.totalSales)}
              </div>
              <div
                className={`mt-2 flex items-center text-xs font-medium ${
                  isGrowthPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isGrowthPositive ? (
                  <TrendingUpIcon className="mr-1 size-3.5" />
                ) : (
                  <TrendingDownIcon className="mr-1 size-3.5" />
                )}
                {metrics.growthRate} vs periode sebelumnya
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Piutang Belum Terbayar
              </CardTitle>
              <AlertCircleIcon className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">
                {formatRupiah(metrics.unpaidSales)}
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <ClockIcon className="mr-1 size-3.5 text-amber-500" />
                {metrics.unpaidRatio} dari total tagihan
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Kas Piutang Tertagih
              </CardTitle>
              <CheckCircle2Icon className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">
                {formatRupiah(metrics.paidSales)}
              </div>
              <div className="mt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                <ArrowUpRightIcon className="mr-1 size-3.5" />
                {metrics.paidRatio} tingkat pelunasan kas
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Transaksi
              </CardTitle>
              <ShoppingCartIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.transactions}
              </div>
              <div
                className={`mt-2 flex items-center text-xs font-medium ${
                  isTransGrowthPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isTransGrowthPositive ? (
                  <TrendingUpIcon className="mr-1 size-3.5" />
                ) : (
                  <TrendingDownIcon className="mr-1 size-3.5" />
                )}
                {metrics.transactionGrowth} pertumbuhan
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Section: Visual Sales & Cash Trend */}
          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Tren Penjualan & Arus Kas Masuk
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Perbandingan tagihan penjualan terbit vs realisasi penerimaan pembayaran kas ({dateRange.label})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                    <span className="text-muted-foreground font-medium">Tagihan Penjualan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground font-medium">Kas Masuk</span>
                  </div>
                </div>
              </div>

              {/* Bar Trend Chart */}
              <div className="pt-6 pb-2">
                {salesTrend.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                    Tidak ada aktivitas data penjualan pada periode tanggal ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 border-b border-border/60 pb-2">
                      {salesTrend.map((pt, idx) => {
                        const salesHeight = Math.max(
                          4,
                          Math.round((pt.sales / maxTrendSales) * 100)
                        )
                        const paidHeight = Math.max(
                          4,
                          Math.round((pt.paid / maxTrendSales) * 100)
                        )

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end"
                            title={`${pt.date}\nPenjualan: ${formatRupiah(pt.sales)}\nKas Masuk: ${formatRupiah(pt.paid)}`}
                          >
                            <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36">
                              {/* Sales bar */}
                              <div
                                style={{ height: `${salesHeight}%` }}
                                className={`w-1/2 max-w-[12px] rounded-t-sm transition-all duration-300 ${
                                  pt.sales > 0
                                    ? "bg-indigo-600 dark:bg-indigo-500 hover:brightness-110"
                                    : "bg-muted/40"
                                }`}
                              />
                              {/* Paid bar */}
                              <div
                                style={{ height: `${paidHeight}%` }}
                                className={`w-1/2 max-w-[12px] rounded-t-sm transition-all duration-300 ${
                                  pt.paid > 0
                                    ? "bg-emerald-500 hover:brightness-110"
                                    : "bg-muted/30"
                                }`}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[28px] text-center">
                              {pt.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Progress Metrics */}
            <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                <span className="text-muted-foreground text-[11px]">Rasio Penagihan Terbayar</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{metrics.paidRatio}</span>
                  <span className="text-emerald-600 font-mono font-medium">{formatRupiah(metrics.paidSales)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, parseFloat(metrics.paidRatio) || 0)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                <span className="text-muted-foreground text-[11px]">Rasio Piutang Terbuka</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{metrics.unpaidRatio}</span>
                  <span className="text-amber-600 font-mono font-medium">{formatRupiah(metrics.unpaidSales)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, parseFloat(metrics.unpaidRatio) || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Side Card: Real Recent Activities */}
          <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs lg:col-span-3 flex flex-col justify-between">
            <div>
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Aktivitas Transaksi Terbaru
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    5 riwayat pembaruan transaksi riil terkini
                  </CardDescription>
                </div>
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClockIcon className="size-4" />
                </div>
              </div>

              <div className="divide-y divide-border/40 mt-3">
                {recentTransactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Belum ada riwayat transaksi tercatat di database.
                  </div>
                ) : (
                  recentTransactions.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs hover:bg-muted/20 px-1 rounded transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 flex size-7 items-center justify-center rounded-lg ${
                            item.type === "payment"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : item.type === "invoice"
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {item.type === "payment" ? (
                            <CreditCardIcon className="size-3.5" />
                          ) : item.type === "invoice" ? (
                            <ReceiptIcon className="size-3.5" />
                          ) : (
                            <PackageIcon className="size-3.5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{item.customer}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">({item.code})</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">{item.action}</p>
                        </div>
                      </div>

                      <div className="text-right pl-2">
                        <p
                          className={`font-mono font-bold text-xs ${
                            item.type === "payment"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {item.type === "payment" ? "+" : ""}
                          {formatRupiah(item.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {timeAgo(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-primary hover:bg-primary/10 cursor-pointer"
                onClick={() => (window.location.href = "/invoices")}
              >
                Lihat Seluruh Transaksi Penjualan →
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}
