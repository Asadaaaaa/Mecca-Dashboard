// Product & Category Module Types

export interface ProductCategory {
  id: number
  code: string
  name: string
  description?: string | null
  status: "active" | "inactive"
  product_count?: number
  created_at?: string
  updated_at?: string
}

export interface ProductCategoryMetrics {
  total_categories: number
  active_categories: number
  inactive_categories: number
  total_products: number
}

export interface ProductCategoryQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface ProductCategoryFormData {
  code?: string
  name: string
  description?: string | null
  status: "active" | "inactive"
}

export interface Unit {
  id: number
  code: string
  name: string
  description?: string | null
  status: "active" | "inactive"
  created_at?: string
  updated_at?: string
}

export interface UnitFormData {
  code: string
  name: string
  description?: string | null
  status: "active" | "inactive"
}

export interface Tax {
  id: number
  code: string
  name: string
  rate: number
  status: "active" | "inactive"
  created_at?: string
  updated_at?: string
}

export interface TaxFormData {
  code: string
  name: string
  rate: number
  status: "active" | "inactive"
}

export interface Product {
  id: number
  code: string
  name: string
  category_id?: number | null
  unit_id: number
  selling_price: number
  tax_id?: number | null
  description?: string | null
  status: "active" | "inactive"
  category?: ProductCategory | null
  unit?: Unit | null
  tax?: Tax | null
  total_stock?: number
  min_stock?: number
  created_at?: string
  updated_at?: string
}

export interface ProductMetrics {
  total_products: number
  active_products: number
  total_categories: number
  average_price: number
}

export interface ProductQueryParams {
  page?: number
  limit?: number
  search?: string
  category_id?: string | number
  unit_id?: string | number
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface ProductFormData {
  code?: string
  name: string
  category_id?: number | null
  unit_id: number
  selling_price: number
  tax_id?: number | null
  description?: string | null
  status: "active" | "inactive"
}
