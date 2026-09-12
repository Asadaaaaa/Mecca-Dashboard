import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { roleService } from "@/services/role.service"
import type { Role, Permission, RoleFormData } from "@/types/settings.types"
import { Loader2Icon, ShieldIcon, CheckIcon, AlertCircleIcon, LayersIcon } from "lucide-react"

interface RoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role | null
  onSave: (data: RoleFormData) => Promise<void>
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
  onSave,
}: RoleDialogProps) {
  const isEdit = Boolean(role)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingPerms, setFetchingPerms] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  useEffect(() => {
    if (role) {
      setName(role.name || "")
      setDescription(role.description || "")
      setSelectedPermissionIds((role.permissions || []).map((p) => p.id))
    } else {
      setName("")
      setDescription("")
      setSelectedPermissionIds([])
    }
    setError(null)
  }, [role, open])

  const loadPermissions = async () => {
    setFetchingPerms(true)
    try {
      const perms = await roleService.getPermissions()
      setAllPermissions(perms)
    } catch (err) {
      console.error("Failed to load permissions:", err)
    } finally {
      setFetchingPerms(false)
    }
  }

  // Group permissions by module
  const groupedPermissions = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const mod = perm.module || "General"
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(perm)
    return acc
  }, {})

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleModuleAll = (modulePerms: Permission[]) => {
    const ids = modulePerms.map((p) => p.id)
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id))
    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...ids])))
    }
  }

  const handleSelectAll = () => {
    if (selectedPermissionIds.length === allPermissions.length) {
      setSelectedPermissionIds([])
    } else {
      setSelectedPermissionIds(allPermissions.map((p) => p.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama role wajib diisi")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onSave({
        name: name.trim().toLowerCase(),
        description: description.trim() || null,
        permission_ids: selectedPermissionIds,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal menyimpan data role")
    } finally {
      setLoading(false)
    }
  }

  const isSuperadmin = role?.name === "superadmin"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[88vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? `Edit Role: ${role?.name}` : "Tambah Role Baru"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Perbarui wewenang dan daftar modul izin fitur untuk role ${role?.name}.`
                  : "Buat tingkat wewenang baru dan tentukan daftar fitur yang dapat diakses."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium my-2">
            <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 py-2 overflow-y-auto pr-1">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="role-name" className="text-xs font-semibold">
                  Nama Role <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-name"
                  placeholder="Contoh: sales_manager, warehouse_staff"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSuperadmin}
                  className="h-9 text-sm font-mono"
                  required
                />
                {isSuperadmin && (
                  <p className="text-[11px] text-muted-foreground">Nama role superadmin sistem bersifat permanen.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-desc" className="text-xs font-semibold">
                  Deskripsi / Keterangan Wewenang
                </Label>
                <Input
                  id="role-desc"
                  placeholder="Contoh: Mengelola pesanan penjualan, penawaran, dan customer"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <LayersIcon className="size-4 text-primary" />
                    <Label className="text-xs font-semibold">Daftar Hak Akses Fitur</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedPermissionIds.length} dari {allPermissions.length} fitur aktif untuk role ini.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7.5 font-medium px-2.5"
                >
                  {selectedPermissionIds.length === allPermissions.length ? "Batal Semua" : "Pilih Semua"}
                </Button>
              </div>

              {fetchingPerms ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2Icon className="size-4 animate-spin text-primary" />
                  Memuat daftar permission...
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedPermissions).map(([mod, perms]) => {
                    const isAllModSelected = perms.every((p) => selectedPermissionIds.includes(p.id))
                    const selectedCount = perms.filter((p) => selectedPermissionIds.includes(p.id)).length

                    return (
                      <div key={mod} className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                              {mod}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {selectedCount}/{perms.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleModuleAll(perms)}
                            className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                          >
                            {isAllModSelected ? "Lepas Semua" : "Pilih Semua"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                          {perms.map((perm) => {
                            const isChecked = selectedPermissionIds.includes(perm.id)
                            return (
                              <div
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-primary/10 border-primary/40 text-foreground ring-1 ring-primary/20"
                                    : "bg-muted/20 border-border/50 hover:bg-muted/40 text-muted-foreground"
                                }`}
                              >
                                <div
                                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                    isChecked
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-muted-foreground/40 bg-transparent"
                                  }`}
                                >
                                  {isChecked && <CheckIcon className="size-3" />}
                                </div>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="font-semibold text-foreground font-mono text-[11px] truncate">
                                    {perm.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground line-clamp-2">
                                    {perm.description || "Akses fitur modul"}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs font-medium"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs font-medium bg-primary text-primary-foreground"
            >
              {loading && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Buat Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
