import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { UserLayout } from './components/layout/UserLayout'
import { PageLoader } from './components/ui/Common'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import PreOrderPage from './pages/PreOrderPage'
import ProxyOrderPage from './pages/ProxyOrderPage'
import MyRequestsPage from './pages/MyRequestsPage'
import RequestDetailPage from './pages/RequestDetailPage'
import AccountPage from './pages/AccountPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPage from './pages/PrivacyPage'
import { GoogleCallbackPage, LoginPage, RegisterPage } from './pages/AuthPages'

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'))
const AdminSets = lazy(() => import('./pages/admin/AdminSets'))
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'))
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

/** Chặn trang cần đăng nhập (và trang admin) */
function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={`/dang-nhap?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="san-pham" element={<ProductsPage mode="list" />} />
          <Route path="san-pham/:slug" element={<ProductDetailPage />} />
          <Route path="tim-kiem" element={<ProductsPage mode="search" />} />
          <Route path="set/:slug" element={<ProductsPage mode="set" />} />
          <Route path="dat-truoc" element={<PreOrderPage />} />
          <Route path="dat-ho" element={<ProxyOrderPage />} />
          <Route path="dang-nhap" element={<LoginPage />} />
          <Route path="dang-nhap/google" element={<GoogleCallbackPage />} />
          <Route path="chinh-sach-bao-mat" element={<PrivacyPage />} />
          <Route path="dang-ky" element={<RegisterPage />} />
          <Route path="yeu-cau" element={<RequireAuth><MyRequestsPage /></RequireAuth>} />
          <Route path="yeu-cau/:id" element={<RequireAuth><RequestDetailPage /></RequireAuth>} />
          <Route path="tai-khoan" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="yeu-cau" element={<AdminRequests />} />
          <Route path="san-pham" element={<AdminProducts />} />
          <Route path="san-pham/:id" element={<AdminProductForm />} />
          <Route path="set" element={<AdminSets />} />
          <Route path="danh-muc" element={<AdminCatalog />} />
          <Route path="banner" element={<AdminBanners />} />
          <Route path="nguoi-dung" element={<AdminUsers />} />
          <Route path="cai-dat" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
