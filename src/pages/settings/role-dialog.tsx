import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { roleService } from "@/services/role.service"
import type { Role, Permission, RoleFormData } from "@/types/settings.types"
import { Loader2Icon, ShieldIcon, CheckSquareIcon, SquareIcon } from "lucide-react"

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
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldIcon className="size-5 text-primary" />
            <DialogTitle>{role ? `Edit Role: ${role.name}` : "Tambah Role Baru"}</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 py-2 overflow-y-auto pr-1">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role-name">Nama Role <span className="text-destructive">*</span></Label>
              <Input
                id="role-name"
                placeholder="Contoh: sales_manager, warehouse_staff"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSuperadmin}
                required
              />
              {isSuperadmin && (
                <p className="text-[11px] text-muted-foreground">Nama role superadmin sistem tidak dapat diubah.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc">Deskripsi Role</Label>
              <Input
                id="role-desc"
                placeholder="Contoh: Mengelola pesanan penjualan dan penawaran"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <Label className="text-sm font-semibold">Daftar Hak Akses Fitur (Permissions)</Label>
                  <p className="text-xs text-muted-foreground">
                    Pilih fitur dan modul yang diizinkan untuk diakses oleh role ini ({selectedPermissionIds.length} dari {allPermissions.length} terpilih).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7"
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
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([mod, perms]) => {
                    const isAllModSelected = perms.every((p) => selectedPermissionIds.includes(p.id))
                    return (
                      <div key={mod} className="rounded-lg border bg-card p-3 space-y-2.5">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Modul {mod}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModuleAll(perms)}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            {isAllModSelected ? "Lepas Semua" : "Pilih Semua"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {perms.map((perm) => {
                            const isChecked = selectedPermissionIds.includes(perm.id)
                            return (
                              <div
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                className={`flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-primary/10 border-primary/40 text-foreground"
                                    : "bg-muted/20 border-border/60 hover:bg-muted/40 text-muted-foreground"
                                }`}
                              >
                                <div className="mt-0.5 text-primary">
                                  {isChecked ? (
                                    <CheckSquareIcon className="size-4 text-primary" />
                                  ) : (
                                    <SquareIcon className="size-4 text-muted-foreground/60" />
                                  )}
                                </div>
                                <div className="space-y-0.5 flex-1">
                                  <div className="font-semibold text-foreground font-mono text-[11px]">
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

          <DialogFooter className="pt-4 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {role ? "Simpan Perubahan" : "Buat Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
