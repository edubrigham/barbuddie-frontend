import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell, POSLayout } from '@/components/layout'
import { OrderPanel } from '@/components/layout/order-panel'
import { useAuthStore } from '@/stores/auth.store'

// Pages
import { LoginPage } from '@/features/auth/pages/login-page'
import { POSPage } from '@/features/pos/pages/pos-page'
import { TablesPage } from '@/features/tables/pages/tables-page'
import { OrdersPage } from '@/features/orders/pages/orders-page'
import { HistoryPage } from '@/features/history/pages/history-page'
import { ReportsPage } from '@/features/reports/pages/reports-page'
import { SettingsPage } from '@/features/settings/pages/settings-page'
import { FloorPlansSettingsPage } from '@/features/settings/pages/floor-plans-settings-page'
import { FloorPlanEditorPage } from '@/features/floor-plan'

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Main App
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with standard layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/pos" replace />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/floor-plans" element={<FloorPlansSettingsPage />} />
          </Route>

          {/* POS route with order panel */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSLayout orderPanel={<OrderPanel />}>
                  <POSPage />
                </POSLayout>
              </ProtectedRoute>
            }
          />

          {/* Floor plan editor - full screen */}
          <Route
            path="/settings/floor-plans/edit/:areaName?"
            element={
              <ProtectedRoute>
                <FloorPlanEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
