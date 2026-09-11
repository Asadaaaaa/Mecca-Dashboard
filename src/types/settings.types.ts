// Settings & Management Types

export interface Warehouse {
  id: number
  code: string
  name: string
  address?: string | null
  pic_name?: string | null
  phone?: string | null
  status: "active" | "inactive"
  created_at?: string
  updated_at?: string
}

export interface WarehouseMetrics {
  total_warehouses: number
  active_warehouses: number
  inactive_warehouses: number
  total_pics: number
}

export interface WarehouseQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface WarehouseFormData {
  code?: string
  name: string
  address?: string | null
  pic_name?: string | null
  phone?: string | null
  status: "active" | "inactive"
}

export interface Permission {
  id: number
  name: string
  description?: string | null
  module?: string
  created_at?: string
  updated_at?: string
}

export interface Role {
  id: number
  name: string
  description?: string | null
  user_count?: number
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

export interface RoleMetrics {
  total_roles: number
  total_permissions: number
  total_assigned_users: number
  superadmins: number
}

export interface RoleFormData {
  name: string
  description?: string | null
  permission_ids?: number[]
}

export interface User {
  id: number
  uuid: string
  name: string
  email: string
  username: string
  status: "active" | "inactive" | "suspended"
  roles?: Role[]
  created_at?: string
  updated_at?: string
}

export interface UserMetrics {
  total_users: number
  active_users: number
  inactive_users: number
  superadmin_count: number
}

export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  sort?: string
  order?: "ASC" | "DESC"
}

export interface UserFormData {
  name: string
  email: string
  username: string
  password?: string
  status: "active" | "inactive" | "suspended"
  role_ids?: number[]
}
