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
  ShieldAlertIcon,
  KeyRoundIcon,
  ShoppingCartIcon,
  AlertCircleIcon,
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
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null)

  // PIN Setup / Change Dialog State
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [savingPin, setSavingPin] = useState(false)

  // PIN Authorize Dialog State (e.g. for turning ON Force SO)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authPin, setAuthPin] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
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
      const data = await settingService.getSystemSettings()
      setSettings(data)
    } catch {
      showError("Gagal memuat pengaturan sistem.")
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Handle Toggle PIN Security - Direct toggle without entering PIN
  const handleTogglePinSecurity = async () => {
    if (!settings.has_pin_configured && !settings.security_pin_enabled) {
      // Must setup PIN first if no PIN exists
      setPinDialogOpen(true)
      return
    }

    try {
      const nextState = !settings.security_pin_enabled
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

  // Handle Toggle Force Sales Order:
  // Turning OFF: directly disable without PIN!
  // Turning ON: require PIN if PIN security is enabled and configured
  const handleToggleForceSalesOrder = async () => {
    const nextState = !settings.force_sales_order_enabled

    // If turning OFF (mematikan), directly disable without PIN
    if (!nextState) {
      try {
        const res = await settingService.updateForceSalesOrder({ enabled: false })
        setSettings(res)
        showSuccess("Fitur Force Sales Order dinonaktifkan.")
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } }
        showError(e.response?.data?.message || "Gagal menonaktifkan Force Sales Order.")
      }
      return
    }

    // If turning ON: require PIN if security is active & configured
    if (settings.security_pin_enabled && settings.has_pin_configured) {
      setAuthPin("")
      setAuthError(null)
      setAuthDialogOpen(true)
    } else {
      // Direct update if PIN security is disabled
      try {
        const res = await settingService.updateForceSalesOrder({ enabled: true })
        setSettings(res)
        showSuccess("Fitur Force Sales Order berhasil diaktifkan.")
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } }
        showError(e.response?.data?.message || "Gagal mengaktifkan Force Sales Order.")
      }
    }
  }

  // Handle Auth PIN Submission (only for turning ON Force SO)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)

    if (!/^\d{6}$/.test(authPin)) {
      setAuthError("Masukkan 6 digit angka PIN.")
      return
    }

    try {
      setVerifyingAuth(true)
      const res = await settingService.updateForceSalesOrder({
        enabled: true,
        pin: authPin,
      })
      setSettings(res)
      setAuthDialogOpen(false)
      showSuccess("Fitur Force Sales Order berhasil diaktifkan.")
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
      <div className="flex-1 p-6">
        {/* Compact Cards: PIN & Force Create (Side by Side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Keamanan PIN */}
          <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <KeyRoundIcon className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Keamanan PIN Otorisasi</h3>
                    <p className="text-xs text-muted-foreground">
                      {settings.has_pin_configured ? "PIN 6 digit terkonfigurasi" : "Belum ada PIN"}
                    </p>
                  </div>
                </div>

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

              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Gunakan kode keamanan 6 digit angka untuk mengesahkan tindakan administratif dan bypass pesanan komersial saat stok kurang.
              </p>
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Status:{" "}
                <span className={settings.security_pin_enabled ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground font-semibold"}>
                  {settings.security_pin_enabled ? "Aktif" : "Nonaktif"}
                </span>
              </span>

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
                className="h-8 text-xs cursor-pointer"
              >
                <KeyRoundIcon className="mr-1.5 size-3.5 text-primary" />
                {settings.has_pin_configured ? "Ubah PIN" : "Atur PIN Baru"}
              </Button>
            </div>
          </div>

          {/* Card: Force Create Sales Order */}
          <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <ShoppingCartIcon className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Force Create Sales Order</h3>
                    <p className="text-xs text-muted-foreground">
                      Pemesanan saat stok kurang (Backorder)
                    </p>
                  </div>
                </div>

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

              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Izinkan staf penjualan menerbitkan Sales Order walaupun stok gudang tidak mencukupi, dengan otorisasi 6 digit PIN saat pesanan dibuat.
              </p>
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Status:{" "}
                <span className={settings.force_sales_order_enabled ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-muted-foreground font-semibold"}>
                  {settings.force_sales_order_enabled ? "Diizinkan (Otorisasi PIN)" : "Dibatasi (Strict Stock)"}
                </span>
              </span>
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
              Masukkan PIN 6 digit untuk mengesahkan pengaktifan fitur Force Create Sales Order.
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
