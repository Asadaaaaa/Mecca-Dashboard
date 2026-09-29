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
import { Label } from "@/components/ui/label"
import { productService } from "@/services/product.service"
import { warehouseService } from "@/services/warehouse.service"
import type { Warehouse } from "@/types/settings.types"
import type { BulkImportResult } from "@/types/product.types"
import {
  FileSpreadsheetIcon,
  UploadCloudIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  DownloadIcon,
  FileCheckIcon,
} from "lucide-react"

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BulkImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkImportResult | null>(null)

  useEffect(() => {
    if (open) {
      loadWarehouses()
      setFile(null)
      setError(null)
      setResult(null)
    }
  }, [open])

  const loadWarehouses = async () => {
    try {
      const res = await warehouseService.getWarehouses({ limit: 100 })
      const items = res.items || []
      setWarehouses(items)
      if (items.length > 0) {
        setSelectedWarehouseId(items[0].id)
      }
    } catch (err) {
      console.error("Gagal memuat gudang:", err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
      setResult(null)
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent =
      "SKU,Nama Barang,Varian 1,Varian 1 Pilihan,Varian 2,Varian 2 Pilihan,Kategori,Satuan,Stok Akhir,HPP,Harga Jual\n" +
      'BAU-BJR,Baut Baja Ringan,Ukuran,10x19,-,-,Baut,BOX,50,45000,60000\n' +
      'PKU-KY3,Paku Kayu,Ukuran,3 Inch,-,-,Paku,BOX,20,35000,50000\n' +
      'SBN-001,Semen Tiga Roda 40kg,-,-,-,-,Semen,PCS,100,55000,65000\n'

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "template_import_produk_mecca.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Silakan pilih file spreadsheet terlebih dahulu")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string
          const importRes = await productService.bulkImport({
            file_base64: base64Data,
            warehouse_id: selectedWarehouseId,
          })
          setResult(importRes)
          onSuccess()
        } catch (uploadErr: unknown) {
          const errObj = uploadErr as { response?: { data?: { message?: string } }; message?: string }
          setError(errObj.response?.data?.message || errObj.message || "Gagal mengimpor produk")
        } finally {
          setLoading(false)
        }
      }
      reader.onerror = () => {
        setError("Gagal membaca file")
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setError(errObj.message || "Terjadi kesalahan saat memproses file")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheetIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>Bulk Import Produk</DialogTitle>
              <DialogDescription>
                Unggah file spreadsheet (Excel .xlsx atau .csv) untuk mendaftarkan banyak produk sekaligus beserta stok awal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
              <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2Icon className="size-5 text-emerald-600" />
                  <span>Proses Import Selesai Berhasil!</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    Total Baris Data: <span className="font-bold">{result.total_rows}</span>
                  </div>
                  <div>
                    Berhasil Diproses: <span className="font-bold">{result.success_count}</span>
                  </div>
                  <div>
                    Produk Baru Dibuat: <span className="font-bold">{result.created_products}</span>
                  </div>
                  <div>
                    Produk Diperbarui: <span className="font-bold">{result.updated_products}</span>
                  </div>
                </div>

                {result.created_units && result.created_units.length > 0 && (
                  <div className="mt-2 text-xs">
                    Satuan Baru Didaftarkan:{" "}
                    <span className="font-semibold text-primary">
                      {result.created_units.join(", ")}
                    </span>
                  </div>
                )}

                {result.created_categories && result.created_categories.length > 0 && (
                  <div className="mt-1 text-xs">
                    Kategori Baru:{" "}
                    <span className="font-semibold">
                      {result.created_categories.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-semibold mb-1">Catatan Peringatan / Error:</div>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-36 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Baris {e.row} ({e.sku || e.name}): {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-xs">
                <div>
                  <span className="font-semibold">Format Kolom Spreadsheet:</span>
                  <p className="text-muted-foreground mt-0.5">
                    Mendukung format daftar stok template resmi atau format standar. Satuan "boks" / "box" otomatis dinormalisasi menjadi BOX.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 gap-1 text-xs shrink-0 ml-3"
                >
                  <DownloadIcon className="size-3.5" />
                  Unduh Template
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target-warehouse" className="text-xs font-semibold">
                  Gudang Tujuan Alokasi Stok Awal
                </Label>
                <select
                  id="target-warehouse"
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id} className="bg-popover text-popover-foreground">
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pilih File Spreadsheet</Label>
                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-6 text-center hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <FileCheckIcon className="size-10 text-emerald-500" />
                      <span className="font-semibold text-sm text-foreground">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB — Klik untuk mengganti file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UploadCloudIcon className="size-10 text-muted-foreground/60" />
                      <span className="font-semibold text-sm text-foreground">
                        Klik atau seret file spreadsheet ke sini
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Mendukung file .xlsx, .xls, atau .csv (Maksimal 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium"
            >
              Tutup
            </Button>
          ) : (
            <>
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
                type="button"
                onClick={handleUpload}
                disabled={!file || loading}
                className="text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}
                Mulai Impor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
