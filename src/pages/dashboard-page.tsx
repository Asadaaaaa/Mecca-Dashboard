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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { DateRangePicker, type DateRange } from "@/components/date-range-picker"
import { 
  SunIcon, 
  MoonIcon, 
  TrendingUpIcon, 
  DollarSignIcon, 
  ClockIcon,
  CheckCircle2Icon,
  ShoppingCartIcon,
  AlertCircleIcon,
  ArrowUpRightIcon
} from "lucide-react"

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const metrics = useMemo(() => {
    switch (dateRange.preset) {
      case "today":
        return {
          totalSales: 12450000,
          unpaidSales: 3200000,
          paidSales: 9250000,
          transactions: 14,
          growthRate: "+8.4%",
          unpaidRatio: "25.7%",
          paidRatio: "74.3%",
        }
      case "last7days":
        return {
          totalSales: 58900000,
          unpaidSales: 16400000,
          paidSales: 42500000,
          transactions: 58,
          growthRate: "+15.2%",
          unpaidRatio: "27.8%",
          paidRatio: "72.2%",
        }
      case "last30days":
        return {
          totalSales: 214600000,
          unpaidSales: 54200000,
          paidSales: 160400000,
          transactions: 212,
          growthRate: "+18.9%",
          unpaidRatio: "25.3%",
          paidRatio: "74.7%",
        }
      case "thisMonth":
      default:
        return {
          totalSales: 148850000,
          unpaidSales: 42600000,
          paidSales: 106250000,
          transactions: 148,
          growthRate: "+20.1%",
          unpaidRatio: "28.6%",
          paidRatio: "71.4%",
        }
    }
  }, [dateRange])

  return (
    <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="Toggle theme (or press 'd')"
              className="size-9 rounded-md"
            >
              {theme === "dark" ? (
                <SunIcon className="size-4" />
              ) : (
                <MoonIcon className="size-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Top Greeting & Date Range Picker */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
              <p className="text-sm text-muted-foreground">
                Selamat datang di Mecca Dashboard. Berikut ringkasan aktivitas sistem Anda.
              </p>
            </div>
            <DateRangePicker
              value={dateRange}
              onChange={(range) => setDateRange(range)}
            />
          </div>

          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                <DollarSignIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatRupiah(metrics.totalSales)}</div>
                <div className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUpIcon className="mr-1 size-3.5" />
                  {metrics.growthRate} dari bulan lalu
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Penjualan Belum Dibayar</CardTitle>
                <AlertCircleIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatRupiah(metrics.unpaidSales)}
                </div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <ClockIcon className="mr-1 size-3.5" />
                  {metrics.unpaidRatio} dari total penjualan
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Penjualan Terbayar</CardTitle>
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(metrics.paidSales)}
                </div>
                <div className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRightIcon className="mr-1 size-3.5" />
                  {metrics.paidRatio} tingkat pelunasan
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
                <ShoppingCartIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.transactions}</div>
                <div className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUpIcon className="mr-1 size-3.5" />
                  +12.4% peningkatan
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Main Section */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Aktivitas & Performa</CardTitle>
                <CardDescription>
                  Grafik analitik dan metrik kunjungan sistem terbaru.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed bg-muted/40 p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <TrendingUpIcon className="size-6" />
                    </div>
                    <span className="text-sm font-medium">Visualisasi Metrik Realtime</span>
                    <span className="text-xs text-muted-foreground max-w-xs">
                      Area integrasi visual chart untuk tren data dan metrik mingguan.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Side Card: Recent Activities */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>
                  5 transaksi dan pembaruan terakhir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { user: "Ahmad Fauzi", action: "Pemesanan baru #TRX-9482", time: "2 menit lalu", amount: "+Rp 450.000" },
                    { user: "Siti Rahma", action: "Pembaruan profil anggota", time: "15 menit lalu", amount: "Update" },
                    { user: "Budi Santoso", action: "Pemesanan paket Pro", time: "1 jam lalu", amount: "+Rp 1.200.000" },
                    { user: "Diana Putri", action: "Verifikasi email berhasil", time: "3 jam lalu", amount: "Verified" },
                    { user: "Rian Hidayat", action: "Pemesanan baru #TRX-9479", time: "5 jam lalu", amount: "+Rp 750.000" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="space-y-0.5">
                        <p className="font-medium leading-none">{item.user}</p>
                        <p className="text-xs text-muted-foreground">{item.action}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-xs">{item.amount}</p>
                        <p className="text-[10px] text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
  )
}
