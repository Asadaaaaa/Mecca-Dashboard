export interface Customer {
  id: number;
  code: string;
  name: string;
  pic_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_number?: string | null;
  payment_terms: number;
  affiliate?: string | null;
  date_of_birth?: string | null;
  first_visit?: string | null;
  recent_visit?: string | null;
  lifetime_spend: number | string;
  total_unpaid: number | string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newThisMonth: number;
  returningCustomers: number;
  retentionRate: number;
  biggestSpender: {
    name: string;
    spend: number;
    initials: string;
  };
  outstandingDebt: number;
  customersWithDebt: number;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  hasDebt?: boolean;
}

export interface CustomerListResponse {
  items: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerFormData {
  name: string;
  pic_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: number;
}
