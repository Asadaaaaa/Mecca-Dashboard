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
import { Loader2Icon } from "lucide-react"

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
    payment_terms: 30,
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        pic_name: customer.pic_name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        payment_terms: customer.payment_terms ?? 30,
      })
    } else {
      setFormData({
        name: "",
        pic_name: "",
        phone: "",
        email: "",
        address: "",
        payment_terms: 30,
      })
    }
    setError(null)
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Nama customer wajib diisi.")
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyimpan data customer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Data Customer" : "Tambah Customer Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Perbarui informasi kontak dan ketentuan transaksi untuk ${customer?.name}.`
              : "Masukkan informasi profil dan ketentuan kredit customer baru ke dalam sistem."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">
                Nama Customer / Perusahaan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cust-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: PT Sinar Abadi / Asep Tiwul"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-pic">Nama PIC</Label>
                <Input
                  id="cust-pic"
                  value={formData.pic_name || ""}
                  onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                  placeholder="Nama Penanggung Jawab"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-terms">Payment Terms (Hari)</Label>
                <Input
                  id="cust-terms"
                  type="number"
                  min="0"
                  value={formData.payment_terms ?? 30}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_terms: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Nomor Telepon</Label>
                <Input
                  id="cust-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+628123456789"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-address">Alamat Lengkap</Label>
              <textarea
                id="cust-address"
                rows={3}
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat kantor / gudang pengiriman customer"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer hover:bg-muted/80 active:scale-98 transition-all"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="cursor-pointer active:scale-98 transition-all"
            >
              {loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
