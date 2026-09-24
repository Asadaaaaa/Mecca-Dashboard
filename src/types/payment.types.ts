export interface PaymentAllocationDetail {
  id?: number
  payment_id?: number
  invoice_id: number
  invoiceNo?: string
  invoiceDate?: string
  dueDate?: string
  grandTotal?: number
  paidAmount?: number
  allocatedAmount: number
  status?: string
}

export interface Payment {
  id: number
  paymentNo: string
  payment_number?: string
  refInvoice: string
  date: string
  payment_date?: string
  customer_id: number
  customerName: string
  customerPhone?: string
  customerAddress?: string
  customer?: {
    id: number
    code?: string
    name: string
    phone?: string
    email?: string
    address?: string
  }
  amount: number
  paymentMethod: string
  payment_method?: string
  bankAccount: string
  bank_account?: string
  referenceNumber: string
  reference_number?: string
  status: "Terverifikasi" | "Pending Kliring" | "Dibatalkan"
  notes?: string
  creator?: string
  allocations?: PaymentAllocationDetail[]
  created_at?: string
  updated_at?: string
}

export interface PaymentMetrics {
  totalSettled: number
  verifiedCount: number
  pendingAmount: number
  pendingCount: number
  topChannel: string
}

export interface PaymentQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  payment_method?: string
  customer_id?: number
  sort?: string
  order?: "ASC" | "DESC"
}

export interface PaymentListResponse {
  items: Payment[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PaymentFormData {
  payment_number?: string
  customer_id: number
  payment_date?: string
  amount: number
  payment_method?: string
  bank_account?: string | null
  reference_number?: string | null
  status?: string
  notes?: string
  allocations?: {
    invoice_id: number
    allocated_amount: number
  }[]
}
