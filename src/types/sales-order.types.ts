export interface SalesOrderItemDetail {
  id?: number
  sales_order_id?: number
  product_id: number
  productCode?: string
  productName?: string
  product?: {
    id: number
    code: string
    name: string
  }
  quantity: number
  delivered_quantity?: number
  remaining_quantity?: number
  unit_price: number
  discount_amount?: number
  tax_amount?: number
  subtotal?: number
  total?: number
}

export interface SalesOrder {
  id: number
  orderNo: string
  sales_order_number?: string
  refQuotation?: string
  quotation_id?: number | null
  customer_id: number
  customerName: string
  customer?: {
    id: number
    name: string
    phone?: string
    address?: string
  }
  warehouse_id?: number | null
  warehouse?: string
  date: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  totalAmount: number
  itemsCount: number
  totalQty: number
  totalDeliveredQty?: number
  status: "Draf" | "Dikonfirmasi" | "Siap Kirim" | "Proses Kirim" | "Selesai Dikirim" | "Dibatalkan"
  notes?: string
  creator?: string
  items?: SalesOrderItemDetail[]
  created_at?: string
  updated_at?: string
}

export interface SalesOrderMetrics {
  totalOrders: number
  completedDeliveries: number
  inDeliveryProcess: number
  readyToShip: number
  totalAmount: number
}

export interface SalesOrderQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface SalesOrderListResponse {
  items: SalesOrder[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SalesOrderFormData {
  customer_id: number
  warehouse_id?: number
  quotation_id?: number
  order_date?: string
  notes?: string
  discount_amount?: number
  tax_amount?: number
  force_override?: boolean
  pin?: string
  items: {
    product_id: number
    quantity: number
    unit_price: number
    discount_amount?: number
    tax_amount?: number
  }[]
}

export interface AvailableStockInfo {
  warehouse_id: number
  product_id: number
  physicalStock: number
  reservedStock: number
  availableStock: number
}
