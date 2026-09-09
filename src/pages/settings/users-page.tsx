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
  UsersIcon,
  UserCheckIcon,
  ShieldAlertIcon,
  KeyRoundIcon,
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  FilterIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  LockIcon,
  CheckIcon,
} from "lucide-react"

interface UserItem {
  id: number
  name: string
  username: string
  email: string
  role: "Superadmin" | "Kepala Gudang" | "Staf Logistik" | "Sales Executive" | "Finance & Accounting"
  warehouseAccess: string
  status: "Aktif" | "Nonaktif"
  lastLogin: string
}

const DUMMY_USERS: UserItem[] = [
  { id: 1, name: "Mikael Asada", username: "admin", email: "admin@mecca-erp.id", role: "Superadmin", warehouseAccess: "Seluruh Cabang & Gudang", status: "Aktif", lastLogin: "Hari ini, 21:45 WIB" },
  { id: 2, name: "Budi Santoso", username: "budi.gudang", email: "budi.santoso@mecca-erp.id", role: "Kepala Gudang", warehouseAccess: "Gudang Utama Cakung", status: "Aktif", lastLogin: "Hari ini, 17:12 WIB" },
  { id: 3, name: "Ahmad Dahlan", username: "ahmad.d", email: "ahmad.dahlan@mecca-erp.id", role: "Kepala Gudang", warehouseAccess: "Gudang Transit Surabaya", status: "Aktif", lastLogin: "Kemarin, 16:30 WIB" },
  { id: 4, name: "Siti Rahma", username: "siti.rahma", email: "siti.rahma@mecca-erp.id", role: "Staf Logistik", warehouseAccess: "Gudang Dingin Marunda", status: "Aktif", lastLogin: "Hari ini, 15:02 WIB" },
  { id: 5, name: "Ahmad Syarif", username: "syarif.sales", email: "syarif@mecca-erp.id", role: "Sales Executive", warehouseAccess: "Kantor Pusat Jakarta", status: "Aktif", lastLogin: "Hari ini, 18:20 WIB" },
  { id: 6, name: "Rian Pratama", username: "rian.sales", email: "rian@mecca-erp.id", role: "Sales Executive", warehouseAccess: "Kantor Cabang Surabaya", status: "Aktif", lastLogin: "3 hari yang lalu" },
  { id: 7, name: "Dewi Lestari", username: "dewi.finance", email: "dewi.finance@mecca-erp.id", role: "Finance & Accounting", warehouseAccess: "Kantor Pusat Jakarta", status: "Aktif", lastLogin: "Hari ini, 19:10 WIB" },
  { id: 8, name: "Rudi Hidayat", username: "rudi.h", email: "rudi.h@mecca-erp.id", role: "Staf Logistik", warehouseAccess: "Gudang Utama Cakung", status: "Nonaktif", lastLogin: "14 hari yang lalu" },
]

export default function UsersPage() {
  const { theme, setTheme } = useTheme()
  const [users, setUsers] = useState<UserItem[]>(DUMMY_USERS)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [roleFilter, setRoleFilter] = useState("Semua")
  const [statusFilter, setStatusFilter] = useState("Semua")
  const [sortField, setSortField] = useState<keyof UserItem>("name")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC")
  const [page, setPage] = useState(1)
  const limit = 5

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description?: string
    variant?: "default" | "destructive" | "warning" | "success"
    onConfirm?: () => void
    confirmText?: string
    type?: "confirm" | "alert"
  }>({ open: false, title: "" })

  const [feedback, setFeedback] = useState<string | null>(null)

  // Metrics
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === "Aktif").length
  const rolesCount = new Set(users.map((u) => u.role)).size
  const onlineToday = users.filter((u) => u.lastLogin.includes("Hari ini")).length

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.warehouseAccess.toLowerCase().includes(search.toLowerCase())
        const matchesRole = roleFilter === "Semua" || u.role === roleFilter
        const matchesStatus = statusFilter === "Semua" || u.status === statusFilter
        return matchesSearch && matchesRole && matchesStatus
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortOrder === "ASC" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [users, search, roleFilter, statusFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredUsers.length / limit) || 1
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit)

  const handleSort = (field: keyof UserItem) => {
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
      title: "Hapus Pengguna",
      description: `Apakah Anda yakin ingin mencabut hak akses dan menghapus pengguna "${name}"?`,
      variant: "destructive",
      onConfirm: () => {
        setUsers((prev) => prev.filter((u) => u.id !== id))
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        setFeedback(`Pengguna "${name}" berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    setConfirmModal({
      open: true,
      title: "Hapus Pengguna Terpilih",
      description: `Cabut akses ${selectedIds.length} pengguna yang dipilih?`,
      variant: "destructive",
      onConfirm: () => {
        setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)))
        setSelectedIds([])
        setFeedback(`${selectedIds.length} pengguna berhasil dihapus.`)
        setTimeout(() => setFeedback(null), 3000)
      },
    })
  }

  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.includes(u.id))
  const roles = ["Semua", ...Array.from(new Set(users.map((u) => u.role)))]

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
                  <BreadcrumbLink href="/settings/users" className="cursor-pointer hover:text-foreground transition-colors">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Daftar Users</BreadcrumbPage>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Manajemen Pengguna & Hak Akses (RBAC)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Kelola akun staf, hierarki peran jabatan, izin modul, dan penempatan cabang gudang.</p>
            </div>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Akun Terdaftar</span>
                <UsersIcon className="size-4 text-muted-foreground/70" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{totalUsers}</div>
              <div className="mt-2 text-xs text-muted-foreground">Akun karyawan aktif di sistem</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengguna Aktif</span>
                <UserCheckIcon className="size-4 text-emerald-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{activeUsers}</div>
              <div className="mt-2 text-xs text-muted-foreground">Status keanggotaan valid</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelompok Peran (Roles)</span>
                <KeyRoundIcon className="size-4 text-blue-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{rolesCount} Role</div>
              <div className="mt-2 text-xs text-muted-foreground">Hierarki otorisasi akses</div>
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktif Hari Ini</span>
                <ShieldAlertIcon className="size-4 text-purple-500" />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{onlineToday} Staf</div>
              <div className="mt-2 text-xs text-muted-foreground">Masuk ke portal kerja hari ini</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, username, email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9 text-xs h-9"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-md px-2 py-1">
                  <FilterIcon className="size-3.5 text-muted-foreground" />
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value)
                      setPage(1)
                    }}
                    className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r} className="bg-popover text-popover-foreground">
                        {r === "Semua" ? "Semua Role" : r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-md px-2 py-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="Semua" className="bg-popover text-popover-foreground">Semua Status</option>
                    <option value="Aktif" className="bg-popover text-popover-foreground">Aktif</option>
                    <option value="Nonaktif" className="bg-popover text-popover-foreground">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    className="cursor-pointer active:scale-95 transition-all text-xs font-medium"
                  >
                    <Trash2Icon className="size-3.5 mr-1" />
                    Hapus ({selectedIds.length})
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmModal({
                      open: true,
                      title: "Export Audit Log Pengguna",
                      description: "File rekap audit pengguna & role (.xlsx) siap diunduh.",
                      variant: "default",
                      confirmText: "Unduh Excel",
                      onConfirm: () => {
                        setFeedback("File data user berhasil diunduh.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer hover:bg-accent active:scale-95 transition-all text-xs font-medium"
                >
                  <DownloadIcon className="size-3.5 mr-1" />
                  Export
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setConfirmModal({
                      open: true,
                      title: "Tambah Pengguna Baru",
                      description: "Buka formulir pembuatan akun staf baru dengan alokasi hak akses dan modul.",
                      variant: "default",
                      confirmText: "Buat Pengguna",
                      onConfirm: () => {
                        setFeedback("Formulir pengguna baru siap diisi.")
                        setTimeout(() => setFeedback(null), 3000)
                      },
                    })
                  }}
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-xs font-medium"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Tambah User
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(paginatedUsers.map((u) => u.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nama & Identitas <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("username")}>
                      <div className="flex items-center gap-1">Username <ArrowUpDownIcon className="size-3" /></div>
                    </th>
                    <th className="p-3">Peran (Role)</th>
                    <th className="p-3">Akses Gudang / Lokasi</th>
                    <th className="p-3">Login Terakhir</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Tidak ada pengguna yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((item) => {
                      const isSelected = selectedIds.includes(item.id)
                      const initials = item.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-muted/40 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds((prev) => [...prev, item.id])
                                } else {
                                  setSelectedIds((prev) => prev.filter((i) => i !== item.id))
                                }
                              }}
                              className="rounded border-border/80 text-primary focus:ring-primary size-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{item.name}</div>
                                <div className="text-[11px] text-muted-foreground">{item.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-medium text-foreground">@{item.username}</td>
                          <td className="p-3 font-medium text-foreground">
                            <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px]">
                              {item.role}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.warehouseAccess}</td>
                          <td className="p-3 text-muted-foreground">{item.lastLogin}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.status === "Aktif"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setConfirmModal({
                                    open: true,
                                    title: "Reset Password Pengguna",
                                    description: `Kirimkan tautan reset password sementara ke email ${item.email}?`,
                                    variant: "warning",
                                    confirmText: "Kirim Reset Link",
                                    onConfirm: () => {
                                      setFeedback(`Tautan reset password berhasil dikirim ke ${item.email}.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <LockIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setConfirmModal({
                                    open: true,
                                    title: "Ubah Hak Akses & Role",
                                    description: `Ubah peran jabatan dan penempatan cabang gudang untuk ${item.name}.`,
                                    variant: "default",
                                    confirmText: "Simpan Role",
                                    onConfirm: () => {
                                      setFeedback(`Peran untuk ${item.name} berhasil diperbarui.`)
                                      setTimeout(() => setFeedback(null), 3000)
                                    },
                                  })
                                }}
                                className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                              >
                                <Edit2Icon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteSingle(item.id, item.name)}
                                className="cursor-pointer hover:bg-red-500/10 text-red-500 hover:text-red-600 active:scale-95 transition-all"
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

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredUsers.length)} dari {filteredUsers.length} data
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer active:scale-95 transition-all text-xs"
                >
                  <ChevronLeftIcon className="size-3.5 mr-1" />
                  Sebelumnya
                </Button>
                <span className="text-xs font-medium text-foreground px-2">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="cursor-pointer active:scale-95 transition-all text-xs"
                >
                  Selanjutnya
                  <ChevronRightIcon className="size-3.5 ml-1" />
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
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
        />
      </SidebarInset>
  )
}
