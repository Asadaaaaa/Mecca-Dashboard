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
import type { Warehouse, WarehouseFormData } from "@/types/settings.types"
import { Loader2Icon, Building2Icon, AlertCircleIcon, CreditCardIcon } from "lucide-react"

interface WarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouse?: Warehouse | null
  onSave: (data: WarehouseFormData) => Promise<void>
}

export function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSave,
}: WarehouseDialogProps) {
  const isEdit = Boolean(warehouse)
  const [formData, setFormData] = useState<WarehouseFormData>({
    code: "",
    name: "",
    pic_name: "",
    phone: "",
    email: "",
    npwp: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    address: "",
    status: "active",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (warehouse) {
      setFormData({
        code: warehouse.code || "",
        name: warehouse.name || "",
        pic_name: warehouse.pic_name || "",
        phone: warehouse.phone || "",
        email: warehouse.email || "",
        npwp: warehouse.npwp || "",
        bank_name: warehouse.bank_name || "",
        account_number: warehouse.account_number || "",
        account_name: warehouse.account_name || "",
        address: warehouse.address || "",
        status: warehouse.status || "active",
      })
    } else {
      setFormData({
        code: "",
        name: "",
        pic_name: "",
        phone: "",
        email: "",
        npwp: "",
        bank_name: "",
        account_number: "",
        account_name: "",
        address: "",
        status: "active",
      })
    }
    setError(null)
  }, [warehouse, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Nama gudang wajib diisi")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal menyimpan data gudang")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2Icon className="size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Data Gudang" : "Tambah Gudang Baru"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Perbarui informasi fasilitas penyimpanan dan identitas resmi untuk ${warehouse?.name}.`
                  : "Daftarkan fasilitas gudang fisik atau hub transit baru ke dalam sistem."}
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">
                  Kode Gudang
                </Label>
                <Input
                  id="code"
                  placeholder="Otomatis (misal WH-001)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold">
                  Status Operasional
                </Label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                >
                  <option value="active" className="bg-popover text-popover-foreground">Aktif</option>
                  <option value="inactive" className="bg-popover text-popover-foreground">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Gudang / Fasilitas <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Gudang Utama Jakarta"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>

            {/* Identitas Kontak Gudang */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  No. Telepon Gudang
                </Label>
                <Input
                  id="phone"
                  placeholder="Contoh: 087789910979 / 021-8901234"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Gudang
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Contoh: gudang.cakung@mecca.co.id"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pic_name" className="text-xs font-semibold">
                  Penanggung Jawab (PIC)
                </Label>
                <Input
                  id="pic_name"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.pic_name || ""}
                  onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="npwp" className="text-xs font-semibold">
                  NPWP
                </Label>
                <Input
                  id="npwp"
                  placeholder="Contoh: 1000000009998558"
                  value={formData.npwp || ""}
                  onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* Informasi Rekening Bank */}
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CreditCardIcon className="size-3.5 text-primary" />
                Informasi Rekening Bank Gudang
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="bank_name" className="text-[11px] font-medium text-muted-foreground">
                    Nama Bank
                  </Label>
                  <Input
                    id="bank_name"
                    placeholder="Contoh: Bank BCA / Mandiri"
                    value={formData.bank_name || ""}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="account_number" className="text-[11px] font-medium text-muted-foreground">
                    Nomor Rekening
                  </Label>
                  <Input
                    id="account_number"
                    placeholder="Contoh: 127-00-0806202-6"
                    value={formData.account_number || ""}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="account_name" className="text-[11px] font-medium text-muted-foreground">
                    Atas Nama Rekening (Pemilik)
                  </Label>
                  <Input
                    id="account_name"
                    placeholder="Contoh: PT Mecca Distribusi Solusindo"
                    value={formData.account_name || ""}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold">
                Alamat Lokasi Gudang
              </Label>
              <textarea
                id="address"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Kawasan Industri Pulogadung Blok A-12, Jakarta Timur..."
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
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
              {isEdit ? "Simpan Perubahan" : "Tambah Gudang"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
