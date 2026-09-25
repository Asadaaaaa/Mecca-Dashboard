import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { settingService } from "@/services/setting.service"
import type { SystemSettings } from "@/types/settings.types"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  KeyRoundIcon,
  ShoppingCartIcon,
  TruckIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  LockIcon,
  UnlockIcon,
  RefreshCwIcon,
  CheckIcon,
} from "lucide-react"

export default function SystemSettingsPage() {
  const { resolvedTheme, toggleTheme } = useTheme()

  const [settings, setSettings] = useState<SystemSettings>({
    security_pin_enabled: false,
    has_pin_configured: false,
    force_sales_order_enabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null)

  // PIN Setup / Change Dialog State
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [savingPin, setSavingPin] = useState(false)

  // PIN Authorize Dialog State (e.g. for Force SO toggle)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authPin, setAuthPin] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [pendingForceState, setPendingForceState] = useState<boolean | null>(null)
  const [verifyingAuth, setVerifyingAuth] = useState(false)

  const showSuccess = (msg: string) => {
    setFeedback(msg)
    setErrorFeedback(null)
    setTimeout(() => setFeedback(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorFeedback(msg)
    setTimeout(() => setErrorFeedback(null), 5000)
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await settingService.getSystemSettings()
      setSettings(data)
    } catch {
      showError("Gagal memuat pengaturan sistem.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Handle Toggle PIN Security
  const handleTogglePinSecurity = async () => {
    if (!settings.has_pin_configured && !settings.security_pin_enabled) {
      // Must setup PIN first
      setPinDialogOpen(true)
      return
    }

    try {
      const nextState = !settings.security_pin_enabled
      if (!nextState && settings.has_pin_configured) {
        // Turning off requires PIN if it's currently active
        // Open Auth dialog to confirm turn off
        setPendingForceState(null) // indicates PIN toggle
        setAuthPin("")
        setAuthError(null)
        setAuthDialogOpen(true)
        return
      }

      const res = await settingService.updatePin({ enabled: nextState })
      setSettings(res)
      showSuccess(nextState ? "Keamanan PIN berhasil diaktifkan." : "Keamanan PIN dinonaktifkan.")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showError(e.response?.data?.message || "Gagal mengubah status PIN.")
    }
  }

  // Handle Save New PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setDialogError(null)

    if (settings.has_pin_configured && settings.security_pin_enabled && !currentPin) {
      setDialogError("PIN saat ini wajib diisi.")
      return
    }

    if (!/^\d{6}$/.test(newPin)) {
      setDialogError("PIN baru harus berupa tepat 6 digit angka numerik (0-9).")
      return
    }

    if (newPin !== confirmPin) {
      setDialogError("Konfirmasi PIN baru tidak sesuai.")
      return
    }

    try {
      setSavingPin(true)
      const res = await settingService.updatePin({
        enabled: true,
        pin: newPin,
        current_pin: settings.has_pin_configured && settings.security_pin_enabled ? currentPin : undefined,
      })
      setSettings(res)
      setPinDialogOpen(false)
      setCurrentPin("")
      setNewPin("")
      setConfirmPin("")
      showSuccess("PIN 6 digit berhasil disimpan dan diaktifkan!")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setDialogError(e.response?.data?.message || "Gagal menyimpan PIN.")
    } finally {
      setSavingPin(false)
    }
  }

  // Handle Toggle Force Sales Order
  const handleToggleForceSalesOrder = async () => {
    const nextState = !settings.force_sales_order_enabled

    if (settings.security_pin_enabled && settings.has_pin_configured) {
      // Require PIN authorization dialog
      setPendingForceState(nextState)
      setAuthPin("")
      setAuthError(null)
      setAuthDialogOpen(true)
    } else {
      // Direct update if PIN security is disabled
      try {
        const res = await settingService.updateForceSalesOrder({ enabled: nextState })
        setSettings(res)
        showSuccess(
          nextState
            ? "Fitur Paksa Buat Pesanan (Force SO) berhasil diaktifkan."
            : "Fitur Paksa Buat Pesanan (Force SO) dinonaktifkan."
        )
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } }
        showError(e.response?.data?.message || "Gagal mengubah pengaturan Force Sales Order.")
      }
    }
  }

  // Handle Auth PIN Submission (for Force SO or turning off PIN)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)

    if (!/^\d{6}$/.test(authPin)) {
      setAuthError("Masukkan 6 digit angka PIN.")
      return
    }

    try {
      setVerifyingAuth(true)
      if (pendingForceState !== null) {
        // Toggle Force SO
        const res = await settingService.updateForceSalesOrder({
          enabled: pendingForceState,
          pin: authPin,
        })
        setSettings(res)
        setAuthDialogOpen(false)
        showSuccess(
          pendingForceState
            ? "Fitur Paksa Buat Pesanan (Force SO) berhasil diaktifkan."
            : "Fitur Paksa Buat Pesanan (Force SO) dinonaktifkan."
        )
      } else {
        // Turning off PIN security
        const res = await settingService.updatePin({
          enabled: false,
          current_pin: authPin,
        })
        setSettings(res)
        setAuthDialogOpen(false)
        showSuccess("Keamanan PIN berhasil dinonaktifkan.")
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setAuthError(e.response?.data?.message || "PIN tidak valid.")
    } finally {
      setVerifyingAuth(false)
    }
  }

  return (
    <SidebarInset>
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/settings/users">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Pengaturan Sistem</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full cursor-pointer hover:bg-accent active:scale-95 transition-all"
        >
          {resolvedTheme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4 text-slate-700" />}
        </Button>
      </header>

      {/* Floating Alerts */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <CheckIcon className="size-4" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}
      {errorFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <AlertCircleIcon className="size-4" />
          <span className="text-sm font-medium">{errorFeedback}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 p-6">
        {/* Title Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem & Keamanan</h1>
            <p className="text-sm text-muted-foreground">
              Konfigurasi PIN otorisasi supervisor, kebijakan pembuatan pesanan stok kurang (Force SO), dan kepatuhan pengiriman fisik.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center gap-2 cursor-pointer"
          >
            <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>
        </div>

        {/* Status KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: PIN Security */}
          <div className="rounded-xl border bg-card p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Keamanan PIN Otorisasi</span>
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  settings.security_pin_enabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-500/10 text-slate-500"
                }`}
              >
                {settings.security_pin_enabled ? <ShieldCheckIcon className="size-5" /> : <ShieldAlertIcon className="size-5" />}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {settings.security_pin_enabled ? "Aktif" : "Nonaktif"}
              </span>
              <span className="text-xs text-muted-foreground">
                ({settings.has_pin_configured ? "PIN 6 Digit Terkonfigurasi" : "Belum Ada PIN"})
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {settings.security_pin_enabled
                ? "Aksi sensitif & bypass memerlukan verifikasi 6 digit PIN."
                : "Keamanan otorisasi PIN saat ini tidak diaktifkan."}
            </p>
          </div>

          {/* Card 2: Force Sales Order */}
          <div className="rounded-xl border bg-card p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Force Create Sales Order</span>
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  settings.force_sales_order_enabled
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                <ShoppingCartIcon className="size-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {settings.force_sales_order_enabled ? "Diizinkan" : "Dibatasi"}
              </span>
              <span className="text-xs text-muted-foreground">
                {settings.force_sales_order_enabled ? "(Dengan PIN)" : "(Strict Stock)"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {settings.force_sales_order_enabled
                ? "Pesanan boleh dibuat saat stok kurang via otorisasi PIN."
                : "Pesanan ditolak otomatis jika stok gudang tidak cukup."}
            </p>
          </div>

          {/* Card 3: Strict Delivery Restrict */}
          <div className="rounded-xl border bg-card p-5 shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Integritas Pengiriman (Delivery)</span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <TruckIcon className="size-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                Anti-Minus
              </span>
              <span className="text-xs text-muted-foreground">(Restriksi Mutlak)</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pengiriman dibatasi $\le$ stok fisik. Saldo inventaris dijamin bebas nilai negatif.
            </p>
          </div>
        </div>

        {/* Detailed Configuration Section */}
        <div className="space-y-6">
          {/* Card Feature 1: PIN Configuration */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                  <KeyRoundIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">1. Keamanan & Pengaturan PIN 6 Digit</h3>
                  <p className="text-sm text-muted-foreground">
                    Gunakan kode keamanan 6 digit angka untuk mengesahkan tindakan administratif dan bypass pesanan komersial.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPin("")
                    setNewPin("")
                    setConfirmPin("")
                    setDialogError(null)
                    setPinDialogOpen(true)
                  }}
                  className="cursor-pointer"
                >
                  <KeyRoundIcon className="mr-1.5 size-4 text-primary" />
                  {settings.has_pin_configured ? "Ubah PIN" : "Atur PIN Baru"}
                </Button>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={handleTogglePinSecurity}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.security_pin_enabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  role="switch"
                  aria-checked={settings.security_pin_enabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.security_pin_enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-emerald-500" />
                <span>Format PIN wajib terdiri dari tepat 6 digit angka numerik (0-9).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-emerald-500" />
                <span>Disimpan terenkripsi dengan algoritma satu arah SHA-256 dan salt rahasia.</span>
              </div>
            </div>
          </div>

          {/* Card Feature 2: Force Sales Order Configuration */}
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                  <ShoppingCartIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">2. Kebijakan Force Create Sales Order (Backorder)</h3>
                  <p className="text-sm text-muted-foreground">
                    Izinkan pembuat pesanan untuk tetap menerbitkan Sales Order meskipun stok fisik di gudang kurang atau kosong.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {settings.force_sales_order_enabled ? "Aktif (Diizinkan)" : "Nonaktif (Dilarang)"}
                </span>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleForceSalesOrder}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.force_sales_order_enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  role="switch"
                  aria-checked={settings.force_sales_order_enabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.force_sales_order_enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Cara Kerja di Modul Penjualan:</strong> Saat staf penjualan membuat Sales Order dengan kuantitas yang melebihi stok tersedia:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Jika opsi ini <strong>AKTIF</strong>: Sistem memunculkan modal dialog otorisasi PIN 6 digit. Setelah PIN diverifikasi benar, Sales Order berhasil dibuat dengan penanda audit backorder.
                </li>
                <li>
                  Jika opsi ini <strong>NONAKTIF</strong>: Pembuatan Sales Order otomatis ditolak dengan pesan error validasi bahwa stok tidak mencukupi.
                </li>
              </ul>
            </div>
          </div>

          {/* Card Feature 3: Strict Delivery Restriction Guardrail */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-600 text-white mt-0.5">
                <TruckIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-indigo-950 dark:text-indigo-200">
                  3. Restriksi Mutlak Pengiriman Barang (Anti-Minus Stock Guardrail)
                </h3>
                <p className="text-sm text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                  Sales Order hanyalah perikatan komersial yang <strong>tidak memotong stok fisik</strong>. Namun, pada proses Pengiriman (Surat Jalan / Delivery), sistem memotong stok gudang secara riil. Untuk mencegah timbulnya saldo stok negatif (mines), sistem menerapkan restriksi mutlak:
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 pt-2">
                  <div className="rounded-lg bg-white/80 p-3 shadow-2xs dark:bg-slate-900/80">
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <LockIcon className="size-3.5" /> Dilarang Kirim Melebihi Stok Fisik
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kuantitas pengiriman surat jalan dibatasi maksimal sebesar stok fisik yang ada di gudang (<code className="text-2xs bg-muted px-1 py-0.5 rounded">qty &le; physicalStock</code>).
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-2xs dark:bg-slate-900/80">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <UnlockIcon className="size-3.5" /> Solusi Pemenuhan Bertahap
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gunakan <strong>Partial Delivery</strong> untuk barang yang tersedia, dan lakukan <strong>Penerimaan Stok (Stock In)</strong> sebelum menerbitkan surat jalan berikutnya.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG 1: Setup / Ubah PIN 6 Digit */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRoundIcon className="size-5 text-primary" />
              {settings.has_pin_configured ? "Ubah PIN Keamanan" : "Buat PIN Keamanan 6 Digit"}
            </DialogTitle>
            <DialogDescription>
              PIN digunakan untuk otorisasi tindakan sensitif, seperti memaksa buat pesanan saat stok gudang kurang.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePin} className="space-y-4 py-2">
            {dialogError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                <AlertCircleIcon className="size-4 shrink-0" />
                <span>{dialogError}</span>
              </div>
            )}

            {settings.has_pin_configured && settings.security_pin_enabled && (
              <div className="space-y-1.5">
                <Label htmlFor="currentPin">PIN Saat Ini</Label>
                <Input
                  id="currentPin"
                  type="password"
                  maxLength={6}
                  placeholder="6 digit PIN lama"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                  className="tracking-widest text-center text-lg font-mono"
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="newPin">PIN Baru (6 Digit Angka)</Label>
              <Input
                id="newPin"
                type="password"
                maxLength={6}
                placeholder="Contoh: 123456"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="tracking-widest text-center text-lg font-mono"
                autoFocus={!settings.has_pin_configured}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPin">Konfirmasi PIN Baru</Label>
              <Input
                id="confirmPin"
                type="password"
                maxLength={6}
                placeholder="Ulangi 6 digit PIN baru"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="tracking-widest text-center text-lg font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPinDialogOpen(false)}
                disabled={savingPin}
              >
                Batal
              </Button>
              <Button type="submit" disabled={savingPin} className="gap-2">
                {savingPin && <RefreshCwIcon className="size-4 animate-spin" />}
                Simpan & Aktifkan PIN
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Verifikasi PIN Otorisasi */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlertIcon className="size-5 text-amber-500" />
              Otorisasi PIN Diperlukan
            </DialogTitle>
            <DialogDescription>
              {pendingForceState !== null
                ? `Masukkan PIN 6 digit untuk ${
                    pendingForceState ? "mengaktifkan" : "menonaktifkan"
                  } izin Force Create Sales Order.`
                : "Masukkan PIN 6 digit untuk menonaktifkan fitur keamanan PIN."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAuthSubmit} className="space-y-4 py-2">
            {authError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                <AlertCircleIcon className="size-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="authPin">PIN Otorisasi 6 Digit</Label>
              <Input
                id="authPin"
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ""))}
                className="tracking-widest text-center text-2xl font-mono py-6"
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAuthDialogOpen(false)}
                disabled={verifyingAuth}
              >
                Batal
              </Button>
              <Button type="submit" disabled={verifyingAuth} className="gap-2 bg-primary">
                {verifyingAuth && <RefreshCwIcon className="size-4 animate-spin" />}
                Konfirmasi Otorisasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
