// Inventory Module Types

export interface StockItem {
  id: number
  warehouse_id: number
  product_id: number
  sku: string
  name: string
  warehouse: string
  category: string
  unit: string
  minStock: number
  actualStock: number
  unitPrice: number
  status: "Aman" | "Menipis" | "Habis"
  created_at?: string
  updated_at?: string
}

export interface StockMetrics {
  total_items: number
  total_physical_units: number
  critical_stock_count: number
  total_valuation: number
}

export interface StockQueryParams {
  page?: number
  limit?: number
  search?: string
  warehouse_id?: string
  warehouse_name?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface StockAdjustmentFormData {
  warehouse_id: number
  product_id: number
  type: "STOCK_IN" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"
  quantity: number
  min_stock?: number
  notes?: string
}

export interface StockMovement {
  id: number
  warehouse_id: number
  product_id: number
  type: string
  quantity: number
  stock_before: number
  stock_after: number
  reference_type?: string | null
  reference_id?: number | null
  notes?: string | null
  created_at: string
  warehouse?: { id: number; code: string; name: string }
  product?: { id: number; code: string; name: string }
  creator?: { id: number; name: string; username: string }
}

export interface OpnameItem {
  id: number
  documentNo: string
  date: string
  warehouse: string
  warehouse_id: number
  inspector: string
  itemsCount: number
  discrepancyUnits: number
  discrepancyValue: number
  status: "Disetujui" | "Menunggu Review" | "Draft" | "Ditolak"
  notes?: string | null
  created_at?: string
}

export interface OpnameMetrics {
  total_opname: number
  approved_count: number
  pending_count: number
  accuracy_rate: number
}

export interface OpnameQueryParams {
  page?: number
  limit?: number
  search?: string
  warehouse_id?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface OpnameFormData {
  date: string
  warehouse_id: number
  inspector_name: string
  notes?: string
  items: Array<{
    product_id: number
    physical_stock: number
    notes?: string
  }>
}

export interface WasteItem {
  id: number
  documentNo: string
  date: string
  sku: string
  productName: string
  warehouse: string
  warehouse_id: number
  product_id: number
  qty: number
  unit: string
  reason: "Kemasan Bocor / Rusak" | "Kadaluarsa (Expired)" | "Kualitas Turun / Lembap" | "Diserang Hama" | string
  lossAmount: number
  status: "Dimusnahkan" | "Retur Supplier" | "Menunggu Approval"
  notes?: string | null
  created_at?: string
}

export interface WasteMetrics {
  total_incidents: number
  total_units_wasted: number
  total_loss: number
  waste_rate: number
}

export interface WasteQueryParams {
  page?: number
  limit?: number
  search?: string
  warehouse_id?: string
  reason?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface WasteFormData {
  date: string
  warehouse_id: number
  product_id: number
  quantity: number
  reason: string
  status?: "Dimusnahkan" | "Retur Supplier" | "Menunggu Approval"
  notes?: string
}
