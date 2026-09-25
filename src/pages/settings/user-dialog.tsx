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
import type { User, Role, UserFormData } from "@/types/settings.types"
import { Loader2Icon, UserIcon, ShieldIcon, CheckIcon, AlertCircleIcon } from "lucide-react"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSave: (data: UserFormData) => Promise<void>
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: UserDialogProps) {
  const isEdit = Boolean(user)
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    username: "",
    password: "",
    status: "active",
    role_ids: [],
  })
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadRoles()
    }
  }, [open])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        password: "",
        status: user.status || "active",
        role_ids: (user.roles || []).map((r) => r.id),
      })
    } else {
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        status: "active",
        role_ids: [],
      })
    }
    setError(null)
  }, [user, open])

  const loadRoles = async () => {
    try {
      const roles = await roleService.getRoles()
      setAvailableRoles(roles)
    } catch (err) {
      console.error("Failed to load roles:", err)
    }
  }

  const toggleRole = (roleId: number) => {
    setFormData((prev) => {
      const current = prev.role_ids || []
      const exists = current.includes(roleId)
      return {
        ...prev,
        role_ids: exists ? current.filter((id) => id !== roleId) : [...current, roleId],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.username.trim()) {
      setError("Nama, email, dan username wajib diisi")
      return
    }

    if (!user && (!formData.password || formData.password.length < 6)) {
      setError("Password baru wajib diisi minimal 6 karakter")
      return
    }

    if (user && formData.password && formData.password.length < 6) {
      setError("Password minimal 6 karakter jika ingin diubah")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal menyimpan data pengguna")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Akun Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Perbarui profil akun dan hak akses wewenang role untuk ${user?.name}.`
                  : "Buat akun pengguna baru dan tetapkan role hak akses ke sistem."}
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Contoh: Ahmad Syarif"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold">
                  Status Akun
                </Label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "suspended" })}
                >
                  <option value="active" className="bg-popover text-popover-foreground">Aktif</option>
                  <option value="inactive" className="bg-popover text-popover-foreground">Nonaktif</option>
                  <option value="suspended" className="bg-popover text-popover-foreground">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold">
                  Username Login <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="syarif.sales"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-9 text-sm font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Alamat Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="syarif@mecca.co.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">
                Kata Sandi {isEdit ? <span className="text-muted-foreground font-normal">(Kosongkan jika tidak diubah)</span> : <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEdit ? "••••••••" : "Minimal 6 karakter"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-9 text-sm"
                required={!isEdit}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Tugaskan Role / Hak Akses</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Pilih role wewenang untuk pengguna ini.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {availableRoles.map((role) => {
                  const isSelected = (formData.role_ids || []).includes(role.id)
                  return (
                    <div
                      key={role.id}
                      onClick={() => toggleRole(role.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/30"
                          : "bg-muted/30 border-border/60 hover:bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-transparent"
                        }`}
                      >
                        {isSelected && <CheckIcon className="size-3" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground capitalize flex items-center gap-1.5">
                          <ShieldIcon className="size-3 text-primary" />
                          {role.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {role.description || "Akses wewenang pengguna"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
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
              {isEdit ? "Simpan Perubahan" : "Buat Pengguna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
