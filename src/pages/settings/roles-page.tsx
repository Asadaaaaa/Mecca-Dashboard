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
import { roleService } from "@/services/role.service"
import { RoleDialog } from "@/pages/settings/role-dialog"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import type { Role, RoleMetrics, RoleFormData } from "@/types/settings.types"
import {
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  KeyRoundIcon,
  UsersIcon,
  CrownIcon,
  SearchIcon,
  PlusIcon,
  Trash2Icon,
  Edit2Icon,
  Loader2Icon,
  CheckIcon,
  ShieldIcon,
} from "lucide-react"

export default function RolesPage() {
  const { resolvedTheme, toggleTheme } = useTheme()

  const [metrics, setMetrics] = useState<RoleMetrics>({
    total_roles: 0,
    total_permissions: 0,
    total_assigned_users: 0,
    superadmins: 0,
  })

  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modals
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
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
      const data = await roleService.getRoleMetrics()
      setMetrics(data)
    } catch (err) {
      console.error("Failed to load role metrics:", err)
    }
  }, [])

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await roleService.getRoles({ search: search.trim() || undefined })
      setRoles(data)
    } catch (err) {
      console.error("Failed to load roles:", err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleSaveRole = async (data: RoleFormData) => {
    if (selectedRole) {
      await roleService.updateRole(selectedRole.id, data)
      showToast("Role & hak akses berhasil diperbarui")
    } else {
      await roleService.createRole(data)
      showToast("Role baru berhasil ditambahkan")
    }
    fetchMetrics()
    fetchRoles()
  }

  const handleDelete = (role: Role) => {
    if (role.name === "superadmin") {
      showToast("Role superadmin sistem tidak dapat dihapus")
      return
    }

    setConfirmModal({
      open: true,
      title: "Hapus Role & Hak Akses",
      description: `Apakah Anda yakin ingin menghapus role "${role.name}"? Pengguna dengan role ini akan kehilangan hak akses terkait.`,
      variant: "destructive",
      confirmText: "Hapus Role",
      onConfirm: async () => {
        try {
          await roleService.deleteRole(role.id)
          showToast(`Role "${role.name}" berhasil dihapus`)
          fetchMetrics()
          fetchRoles()
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string }
          showToast(e.response?.data?.message || "Gagal menghapus role")
        }
      },
    })
  }

  return (
    <SidebarInset>
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
                <BreadcrumbPage className="font-semibold">Role & Hak Akses (Permissions)</BreadcrumbPage>
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
          {resolvedTheme === "dark" ? <SunIcon className="size-4 text-amber-400" /> : <MoonIcon className="size-4" />}
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
            <h1 className="text-2xl font-bold tracking-tight">Role & Manajemen Hak Akses</h1>
            <p className="text-sm text-muted-foreground">
              Konfigurasi tingkatan wewenang pengguna dan pemetaan daftar fitur/permissions yang dapat diakses.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedRole(null)
              setDialogOpen(true)
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground shadow"
          >
            <PlusIcon className="size-4" />
            Tambah Role Baru
          </Button>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Roles</p>
                <h3 className="text-2xl font-bold mt-1">{metrics.total_roles}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Tingkat wewenang</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <ShieldCheckIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Fitur (Permissions)</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {metrics.total_permissions}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Izin akses sistem</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <KeyRoundIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">User Ter-assign</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {metrics.total_assigned_users}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pengguna aktif</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
                <UsersIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Super Administrator</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {metrics.superadmins}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Akses penuh sistem</p>
              </div>
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <CrownIcon className="size-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Table Container */}
        <Card className="border">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between border-b">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama role atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3">Nama Role</th>
                  <th className="px-6 py-3">Deskripsi</th>
                  <th className="px-6 py-3">Pengguna Ter-assign</th>
                  <th className="px-6 py-3">Hak Akses Fitur Terpilih</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2Icon className="size-6 animate-spin text-primary" />
                        <span>Memuat data role...</span>
                      </div>
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldIcon className="size-8 text-muted-foreground/50" />
                        <span>Tidak ada role ditemukan</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  roles.map((r) => {
                    const isSuperadmin = r.name === "superadmin"
                    const perms = r.permissions || []

                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground capitalize font-mono text-sm">
                              {r.name}
                            </span>
                            {isSuperadmin && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                <CrownIcon className="size-3" />
                                Root Superadmin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">ID #{r.id}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs text-muted-foreground">
                          {r.description || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                            <UsersIcon className="size-3 text-muted-foreground" />
                            {r.user_count || 0} Pengguna
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          {perms.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">Belum ada permission</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {perms.slice(0, 4).map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary"
                                >
                                  {p.name}
                                </span>
                              ))}
                              {perms.length > 4 && (
                                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  +{perms.length - 4} lainnya
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setSelectedRole(r)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit2Icon className="size-4" />
                            </Button>
                            {!isSuperadmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(r)}
                              >
                                <Trash2Icon className="size-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Role Modal Dialog */}
      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={selectedRole}
        onSave={handleSaveRole}
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
