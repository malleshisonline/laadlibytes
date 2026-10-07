import { lazy, useLayoutEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'

import AddressesSection from './components/account/AddressesSection.jsx'
import OrderDetailsSection from './components/account/OrderDetailsSection.jsx'
import OrdersSection from './components/account/OrdersSection.jsx'
import ProfileSection from './components/account/ProfileSection.jsx'
import SecuritySection from './components/account/SecuritySection.jsx'
import RequireAdmin from './components/auth/RequireAdmin.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import { APP_ROUTES } from './constants/appRoutepoints.js'
import AdminLayout from './layouts/AdminLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import AboutPage from './pages/AboutPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import HomePage from './pages/HomePage.jsx'
import GiftStorePage from './pages/GiftStorePage.jsx'
import IdentifyPage from './pages/IdentifyPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProductDetailsPage from './pages/ProductDetailsPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import VerifyOtpPage from './pages/VerifyOtpPage.jsx'
import BestSellers from './pages/BestSellers.jsx'

// The admin pages load only when an admin opens them, so shoppers never download them.
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage.jsx'))
const AdminCategoryFormPage = lazy(() => import('./pages/admin/AdminCategoryFormPage.jsx'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'))
const AdminEnquiriesPage = lazy(() => import('./pages/admin/AdminEnquiriesPage.jsx'))
const AdminOrderDetailsPage = lazy(() => import('./pages/admin/AdminOrderDetailsPage.jsx'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage.jsx'))
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage.jsx'))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage.jsx'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Storefront: navbar and footer on every page. */}
        <Route element={<MainLayout />}>
          <Route path={APP_ROUTES.HOME} element={<HomePage />} />
          <Route path={APP_ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={APP_ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={APP_ROUTES.PRODUCTS} element={<ProductsPage />} />
          <Route path={APP_ROUTES.PRODUCT_DETAILS} element={<ProductDetailsPage />} />
          <Route path={APP_ROUTES.CART} element={<CartPage />} />
          <Route path={APP_ROUTES.BEST_SELLERS} element={<BestSellers />} />
          <Route path={APP_ROUTES.GIFT_STORE} element={<GiftStorePage />} />


          {/* Signed-in only: a guest is sent to sign in and brought back. */}
          <Route element={<RequireAuth />}>
            <Route path={APP_ROUTES.CHECKOUT} element={<CheckoutPage />} />
            <Route path={APP_ROUTES.ACCOUNT} element={<AccountPage />}>
              <Route index element={<ProfileSection />} />
              <Route path={APP_ROUTES.ACCOUNT_ORDERS} element={<OrdersSection />} />
              <Route path={APP_ROUTES.ACCOUNT_ORDER_DETAILS} element={<OrderDetailsSection />} />
              <Route path={APP_ROUTES.ACCOUNT_ADDRESSES} element={<AddressesSection />} />
              <Route path={APP_ROUTES.ACCOUNT_SECURITY} element={<SecuritySection />} />
            </Route>
          </Route>
        </Route>

        {/* Admin panel: admins only, its own layout with no storefront navbar or footer. */}
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path={APP_ROUTES.ADMIN} element={<AdminDashboardPage />} />
            <Route path={APP_ROUTES.ADMIN_ORDERS} element={<AdminOrdersPage />} />
            <Route path={APP_ROUTES.ADMIN_ORDER_DETAILS} element={<AdminOrderDetailsPage />} />
            <Route path={APP_ROUTES.ADMIN_PRODUCTS} element={<AdminProductsPage />} />
            <Route path={APP_ROUTES.ADMIN_PRODUCT_NEW} element={<AdminProductFormPage />} />
            <Route path={APP_ROUTES.ADMIN_PRODUCT_EDIT} element={<AdminProductFormPage />} />
            <Route path={APP_ROUTES.ADMIN_CATEGORIES} element={<AdminCategoriesPage />} />
            <Route path={APP_ROUTES.ADMIN_CATEGORY_NEW} element={<AdminCategoryFormPage />} />
            <Route path={APP_ROUTES.ADMIN_CATEGORY_EDIT} element={<AdminCategoryFormPage />} />
            <Route path={APP_ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
            <Route path={APP_ROUTES.ADMIN_ENQUIRIES} element={<AdminEnquiriesPage />} />
          </Route>
        </Route>

        {/* Sign-in flow: no navbar or footer. */}
        <Route element={<AuthLayout />}>
          <Route path={APP_ROUTES.IDENTIFY} element={<IdentifyPage />} />
          <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={APP_ROUTES.VERIFY_OTP} element={<VerifyOtpPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App