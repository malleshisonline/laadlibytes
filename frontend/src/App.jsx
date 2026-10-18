import { lazy, Suspense, useLayoutEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'

import RequireAdmin from './components/auth/RequireAdmin.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import { APP_ROUTES } from './constants/appRoutepoints.js'
import AdminLayout from './layouts/AdminLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'

const AddressesSection = lazy(() => import('./components/account/AddressesSection.jsx'))
const OrderDetailsSection = lazy(() => import('./components/account/OrderDetailsSection.jsx'))
const OrdersSection = lazy(() => import('./components/account/OrdersSection.jsx'))
const ProfileSection = lazy(() => import('./components/account/ProfileSection.jsx'))
const SecuritySection = lazy(() => import('./components/account/SecuritySection.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'))
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'))
const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const GiftStorePage = lazy(() => import('./pages/GiftStorePage.jsx'))
const IdentifyPage = lazy(() => import('./pages/IdentifyPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage.jsx'))
const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'))
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage.jsx'))
const BestSellers = lazy(() => import('./pages/BestSellers.jsx'))

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
      <Suspense fallback={<div role="status" className="py-16 text-center text-body">Loading page…</div>}>
        <Routes>
          {/* Storefront: navbar and footer on every page. */}
          <Route element={<MainLayout />}>
            <Route path={APP_ROUTES.HOME} element={<HomePage />} />
            <Route path={APP_ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={APP_ROUTES.CONTACT} element={<ContactPage />} />
            <Route path={APP_ROUTES.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
            <Route path={APP_ROUTES.TERMS} element={<TermsPage />} />
            <Route path={APP_ROUTES.FAQ} element={<FaqPage />} />
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
      </Suspense>
    </>
  )
}

export default App