import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AttendancePage } from './pages/AttendancePage'
import { ProductsPage } from './pages/ProductsPage'
import { SalesPage } from './pages/SalesPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { ReportsPage } from './pages/ReportsPage'
import { AttendanceReportPage } from './pages/AttendanceReportPage'
import { AttendanceDetailPage } from './pages/AttendanceDetailPage'
import { Layout } from './components/Layout'
import { PrivateRoute } from './components/PrivateRoute'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/absensi" element={<AttendancePage />} />
                <Route path="/produk" element={<ProductsPage />} />
                <Route path="/penjualan" element={<SalesPage />} />
                <Route path="/pengeluaran" element={<ExpensesPage />} />
              </Route>
            </Route>

            <Route
              element={
                <PrivateRoute roles={['admin']}>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/laporan" element={<ReportsPage />} />
              <Route path="/laporan-absensi" element={<AttendanceReportPage />} />
              <Route path="/laporan-absensi/:id" element={<AttendanceDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
