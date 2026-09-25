import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DashboardPage from "@/pages/dashboard-page"
import CustomersPage from "@/pages/customers/customers-page"
import ProductsPage from "@/pages/products/products-page"
import CategoriesPage from "@/pages/products/categories-page"
import InventoryPage from "@/pages/inventory/inventory-page"
import StockOpnamePage from "@/pages/inventory/opname-page"
import WastePage from "@/pages/inventory/waste-page"
import QuotationsPage from "@/pages/sales/quotations-page"
import SalesOrdersPage from "@/pages/sales/sales-orders-page"
import DeliveriesPage from "@/pages/sales/deliveries-page"
import InvoicesPage from "@/pages/sales/invoices-page"
import PaymentsPage from "@/pages/sales/payments-page"
import UsersPage from "@/pages/settings/users-page"
import RolesPage from "@/pages/settings/roles-page"
import WarehousesPage from "@/pages/settings/warehouses-page"
import SystemSettingsPage from "@/pages/settings/system-page"
import LoginPage from "@/pages/login-page"
import { authService } from "@/services/auth.service"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth / Login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Authenticated Dashboard Pages inside Persistent Layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/categories" element={<CategoriesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/opname" element={<StockOpnamePage />} />
          <Route path="/inventory/waste" element={<WastePage />} />
          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/sales-orders" element={<SalesOrdersPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/settings/users" element={<UsersPage />} />
          <Route path="/settings/roles" element={<RolesPage />} />
          <Route path="/settings/warehouses" element={<WarehousesPage />} />
          <Route path="/settings/system" element={<SystemSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
