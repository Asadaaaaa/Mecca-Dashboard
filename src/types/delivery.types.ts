export interface DeliveryItemDetail {
  id?: number
  delivery_id?: number
  sales_order_item_id?: number
  product_id: number
  productCode?: string
  productName?: string
  product?: {
    id: number
    code: string
    name: string
    selling_price?: number | string
  }
  quantity: number
  so_quantity?: number
  so_delivered_quantity?: number
}

export interface Delivery {
  id: number
  deliveryNo: string
  delivery_number?: string
  refOrder: string
  sales_order_id: number
  date: string
  customer_id: number
  customerName: string
  warehouse_id?: number
  warehouse?: string
  courierFleet?: string
  trackingNumber?: string
  totalItems: number
  status: "Siap Muat" | "Dalam Perjalanan" | "Diterima" | "Kendala Pengiriman"
  notes?: string
  creator?: string
  items?: DeliveryItemDetail[]
  created_at?: string
  updated_at?: string
}

export interface DeliveryMetrics {
  totalDeliveries: number
  deliveredCount: number
  inTransitCount: number
  readyCount: number
  onTimeRate: number
}

export interface DeliveryQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface DeliveryListResponse {
  items: Delivery[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface DeliveryFormData {
  sales_order_id: number
  warehouse_id?: number
  delivery_date?: string
  courier_fleet?: string
  tracking_number?: string
  notes?: string
  items: {
    sales_order_item_id?: number
    product_id?: number
    quantity: number
  }[]
}
