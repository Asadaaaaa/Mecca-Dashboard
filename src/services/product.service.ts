import { apiClient } from "@/services/api-client"
import type {
  Product,
  ProductMetrics,
  ProductQueryParams,
  ProductFormData,
  ProductCategory,
  ProductCategoryMetrics,
  ProductCategoryQueryParams,
  ProductCategoryFormData,
  Unit,
  Tax,
} from "@/types/product.types"

export const productService = {
  // Products
  async getProducts(params: ProductQueryParams = {}): Promise<{ items: Product[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await apiClient.get("/products", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getProductMetrics(): Promise<ProductMetrics> {
    const res = await apiClient.get("/products/metrics")
    return res.data?.data || {
      total_products: 0,
      active_products: 0,
      total_categories: 0,
      average_price: 0,
    }
  },

  async getProductById(id: number): Promise<Product> {
    const res = await apiClient.get(`/products/${id}`)
    return res.data?.data
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const res = await apiClient.post("/products", data)
    return res.data?.data
  },

  async updateProduct(id: number, data: Partial<ProductFormData>): Promise<Product> {
    const res = await apiClient.put(`/products/${id}`, data)
    return res.data?.data
  },

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`)
  },

  async batchDeleteProducts(ids: number[]): Promise<{ count: number }> {
    const res = await apiClient.post("/products/batch-delete", { ids })
    return res.data?.data
  },

  // Product Categories
  async getCategories(params: ProductCategoryQueryParams = {}): Promise<{ items: ProductCategory[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await apiClient.get("/product-categories", { params })
    return res.data?.data || { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }
  },

  async getCategoryMetrics(): Promise<ProductCategoryMetrics> {
    const res = await apiClient.get("/product-categories/metrics")
    return res.data?.data || {
      total_categories: 0,
      active_categories: 0,
      inactive_categories: 0,
      total_products: 0,
    }
  },

  async getCategoryById(id: number): Promise<ProductCategory> {
    const res = await apiClient.get(`/product-categories/${id}`)
    return res.data?.data
  },

  async createCategory(data: ProductCategoryFormData): Promise<ProductCategory> {
    const res = await apiClient.post("/product-categories", data)
    return res.data?.data
  },

  async updateCategory(id: number, data: Partial<ProductCategoryFormData>): Promise<ProductCategory> {
    const res = await apiClient.put(`/product-categories/${id}`, data)
    return res.data?.data
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/product-categories/${id}`)
  },

  // Units
  async getUnits(): Promise<Unit[]> {
    const res = await apiClient.get("/units")
    return res.data?.data || []
  },

  // Taxes
  async getTaxes(): Promise<Tax[]> {
    const res = await apiClient.get("/taxes")
    return res.data?.data || []
  },
}
