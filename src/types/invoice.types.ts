export interface InvoiceItemDetail {
  id?: number
  invoice_id?: number
  delivery_id?: number | null
  product_id: number
  productCode?: string
  productName?: string
  product?: {
    id: number
    code: string
    name: string
    selling_price: number | string
  }
  quantity: number
  unit_price: number
  discount_amount?: number
  tax_amount?: number
  subtotal?: number
  total?: number
}

export interface Invoice {
  id: number
  invoiceNo: string
  invoice_number?: string
  refDelivery: string
  delivery_id?: number | null
  refOrder: string
  sales_order_id?: number | null
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
    payment_terms?: number
  }
  issueDate: string
  dueDate: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: "Lunas" | "Belum Dibayar" | "Sebagian" | "Jatuh Tempo" | "Draf" | "Dibatalkan"
  notes?: string
  creator?: string
  items?: InvoiceItemDetail[]
  created_at?: string
  updated_at?: string
}

export interface InvoiceMetrics {
  totalInvoices: number
  totalReceivables: number
  paidTotal: number
  unpaidCount: number
  partiallyPaidCount: number
  paidCount: number
  overdueCount: number
}

export interface InvoiceQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  customer_id?: number
  sort?: string
  order?: "ASC" | "DESC"
}

export interface InvoiceListResponse {
  items: Invoice[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface InvoiceFormData {
  invoice_number?: string
  customer_id?: number
  delivery_id?: number | null
  sales_order_id?: number | null
  invoice_date?: string
  due_date?: string
  discount_amount?: number
  tax_amount?: number
  status?: string
  notes?: string
  items?: {
    product_id: number
    delivery_id?: number | null
    quantity: number
    unit_price?: number
    discount_amount?: number
    tax_amount?: number
  }[]
}
