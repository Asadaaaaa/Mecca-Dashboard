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
import type { User, Role, UserFormData } from "@/types/settings.types"
import { Loader2Icon, UserIcon, ShieldIcon, CheckSquareIcon, SquareIcon } from "lucide-react"

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
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="size-5 text-primary" />
            <DialogTitle>{user ? "Edit Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Contoh: Ahmad Syarif"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status Akun</Label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "suspended" })}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username Login <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                placeholder="Contoh: syarif.sales"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="syarif@mecca.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Kata Sandi {user ? "(Kosongkan jika tidak ingin mengubah)" : <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={user ? "••••••••" : "Minimal 6 karakter"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <ShieldIcon className="size-4 text-primary" />
              <Label className="text-sm font-semibold">Pilih Role / Hak Akses Pengguna</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Pengguna akan mewarisi seluruh izin akses modul dari role yang dipilih.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {availableRoles.map((role) => {
                const isSelected = (formData.role_ids || []).includes(role.id)
                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-muted/20 border-border/60 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="mt-0.5 text-primary">
                      {isSelected ? (
                        <CheckSquareIcon className="size-4 text-primary" />
                      ) : (
                        <SquareIcon className="size-4 text-muted-foreground/60" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground capitalize">
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
              {user ? "Simpan Perubahan" : "Buat Pengguna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
