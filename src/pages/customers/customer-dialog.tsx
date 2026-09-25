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
import { customerService } from "@/services/customer.service"
import type { Customer, CustomerFormData } from "@/types/customer.types"
import { Loader2Icon, UsersIcon, AlertCircleIcon } from "lucide-react"

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSuccess: () => void
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const isEdit = Boolean(customer)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    pic_name: "",
    phone: "",
    email: "",
    address: "",
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        pic_name: customer.pic_name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
      })
    } else {
      setFormData({
        name: "",
        pic_name: "",
        phone: "",
        email: "",
        address: "",
      })
    }
    setError(null)
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Nama customer / perusahaan wajib diisi.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isEdit && customer) {
        await customerService.updateCustomer(customer.id, formData)
      } else {
        await customerService.createCustomer(formData)
      }
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e.response?.data?.message || e.message || "Gagal menyimpan data customer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Data Customer" : "Tambah Customer Baru"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Perbarui informasi kontak dan ketentuan tempo bayar untuk ${customer?.name}.`
                  : "Daftarkan data pelanggan atau perusahaan rekanan baru ke dalam sistem."}
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
            <div className="space-y-1.5">
              <Label htmlFor="cust-name" className="text-xs font-semibold">
                Nama Customer / Perusahaan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cust-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: PT Sinar Abadi / Toko Makmur"
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-pic" className="text-xs font-semibold">
                Nama PIC (Kontak)
              </Label>
              <Input
                id="cust-pic"
                value={formData.pic_name || ""}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                placeholder="Nama Penanggung Jawab"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-xs font-semibold">
                  Nomor Telepon / WhatsApp
                </Label>
                <Input
                  id="cust-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08123456789"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-email" className="text-xs font-semibold">
                  Alamat Email
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="kontak@perusahaan.com"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-address" className="text-xs font-semibold">
                Alamat Lengkap Pengiriman / Kantor
              </Label>
              <textarea
                id="cust-address"
                rows={3}
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Raya Industri No. 12, Kel. Sukamaju, Kec. Cilincing..."
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              {isEdit ? "Simpan Perubahan" : "Tambah Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
