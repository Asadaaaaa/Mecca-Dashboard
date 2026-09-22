export interface QuotationItemDetail {
  id?: number
  quotation_id?: number
  product_id: number
  productCode?: string
  productName?: string
  product?: {
    id: number
    code: string
    name: string
    selling_price: string
  }
  quantity: number
  unit_price: number
  discount_amount?: number
  tax_amount?: number
  subtotal?: number
  total?: number
}

export interface Quotation {
  id: number
  quotationNo: string
  quotation_number?: string
  customer_id: number
  customerName: string
  customerPhone?: string
  customerAddress?: string
  customer?: {
    id: number
    name: string
    phone?: string
    email?: string
    address?: string
  }
  date: string
  validUntil: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  totalAmount: number
  totalItems: number
  totalQty: number
  status: "Draf" | "Terkirim" | "Disetujui" | "Ditolak" | "Kedaluwarsa"
  notes?: string
  creator?: string
  items?: QuotationItemDetail[]
  created_at?: string
  updated_at?: string
}

export interface QuotationMetrics {
  totalQuotations: number
  approvedCount: number
  pendingCount: number
  pipelineValue: number
  winRate: number
}

export interface QuotationQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface QuotationListResponse {
  items: Quotation[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface QuotationFormData {
  customer_id: number
  quotation_date?: string
  valid_until?: string
  notes?: string
  discount_amount?: number
  tax_amount?: number
  items: {
    product_id: number
    quantity: number
    unit_price: number
    discount_amount?: number
    tax_amount?: number
  }[]
}
