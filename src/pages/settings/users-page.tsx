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
import { userService } from "@/services/user.service"
import { roleService } from "@/services/role.service"
import { UserDialog } from "@/pages/settings/user-dialog"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import type { User, UserMetrics, UserFormData, Role } from "@/types/settings.types"
import {
  SunIcon,
  MoonIcon,
  UsersIcon,
  UserCheckIcon,
  UserXIcon,
  CrownIcon,
  SearchIcon,
  PlusIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  Loader2Icon,
  MailIcon,
  CheckIcon,
  ShieldIcon,
} from "lucide-react"

export default function UsersPage() {
  const { resolvedTheme, toggleTheme } = useTheme()

  const [metrics, setMetrics] = useState<UserMetrics>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    superadmin_count: 0,
  })

  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 10

  // Modals
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
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
      const data = await userService.getUserMetrics()
      setMetrics(data)
    } catch (err) {
      console.error("Failed to load user metrics:", err)
    }
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      const data = await roleService.getRoles()
      setRoles(data)
    } catch (err) {
      console.error("Failed to load roles:", err)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userService.getUsers({
        page,
        limit,
        search: search.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort: sortField,
        order: sortOrder,
      })
      setUsers(res.items || [])
      setTotalCount(res.pagination?.total || 0)
    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, roleFilter, statusFilter, sortField, sortOrder])

  useEffect(() => {
    fetchMetrics()
    fetchRoles()
  }, [fetchMetrics, fetchRoles])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
    } else {
      setSortField(field)
      setSortOrder("ASC")
    }
    setPage(1)
  }

  const handleSaveUser = async (data: UserFormData) => {
    if (selectedUser) {
      await userService.updateUser(selectedUser.id, data)
      showToast("Data pengguna berhasil diperbarui")
    } else {
      await userService.createUser(data)
      showToast("Pengguna baru berhasil ditambahkan")
    }
    fetchMetrics()
    fetchUsers()
  }

  const handleDelete = (u: User) => {
    if (u.id === 1 || u.username === "admin") {
      showToast("Superadmin utama sistem tidak dapat dihapus")
      return
    }

    setConfirmModal({
      open: true,
      title: "Hapus Pengguna",
      description: `Apakah Anda yakin ingin menghapus akun "${u.name}" (@${u.username})?`,
      variant: "destructive",
      confirmText: "Hapus Pengguna",
      onConfirm: async () => {
        try {
          await userService.deleteUser(u.id)
          showToast(`Pengguna "${u.name}" berhasil dihapus`)
          fetchMetrics()
          fetchUsers()
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } }; message?: string }
          showToast(e.response?.data?.message || "Gagal menghapus pengguna")
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
                <BreadcrumbLink href="/settings/users">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Daftar Users</BreadcrumbPage>
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
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna (Users)</h1>
            <p className="text-sm text-muted-foreground">
              Kelola akun staf, petugas gudang, sales, dan finance serta penugasan role hak akses.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedUser(null)
              setDialogOpen(true)
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground shadow"
          >
            <PlusIcon className="size-4" />
            Tambah User Baru
          </Button>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Pengguna</p>
                <h3 className="text-2xl font-bold mt-1">{metrics.total_users}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Akun terdaftar</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <UsersIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Pengguna Aktif</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {metrics.active_users}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Dapat login ke sistem</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <UserCheckIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Nonaktif / Suspended</p>
                <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                  {metrics.inactive_users}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Akses dinonaktifkan</p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                <UserXIcon className="size-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Superadmin</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {metrics.superadmin_count}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Hak akses root</p>
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
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-full max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, username, email..."
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
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">Semua Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
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
                  <option value="suspended">Suspended</option>
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
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Nama & Username
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      <ArrowUpDownIcon className="size-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3">Role Akses</th>
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
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2Icon className="size-6 animate-spin text-primary" />
                        <span>Memuat data pengguna...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UsersIcon className="size-8 text-muted-foreground/50" />
                        <span>Tidak ada pengguna ditemukan</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const userRoles = u.roles || []
                    const isRootSuperadmin = u.id === 1 || u.username === "admin"

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">@{u.username}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <MailIcon className="size-3.5 text-muted-foreground" />
                            {u.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {userRoles.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">Tanpa Role</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {userRoles.map((r) => (
                                <span
                                  key={r.id}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                                    r.name === "superadmin"
                                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  <ShieldIcon className="size-3" />
                                  {r.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              u.status === "active"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : u.status === "suspended"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                u.status === "active"
                                  ? "bg-emerald-500"
                                  : u.status === "suspended"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {u.status === "active"
                              ? "Aktif"
                              : u.status === "suspended"
                              ? "Suspended"
                              : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setSelectedUser(u)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit2Icon className="size-4" />
                            </Button>
                            {!isRootSuperadmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(u)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Menampilkan {users.length > 0 ? (page - 1) * limit + 1 : 0} hingga{" "}
              {Math.min(page * limit, totalCount)} dari {totalCount} pengguna
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

      {/* User Modal Dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        onSave={handleSaveUser}
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
