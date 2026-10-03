import { Route, Routes } from 'react-router'

import AddressesSection from './components/account/AddressesSection.jsx'
import OrderDetailsSection from './components/account/OrderDetailsSection.jsx'
import OrdersSection from './components/account/OrdersSection.jsx'
import ProfileSection from './components/account/ProfileSection.jsx'
import SecuritySection from './components/account/SecuritySection.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import { APP_ROUTES } from './constants/appRoutepoints.js'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import AboutPage from './pages/AboutPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import HomePage from './pages/HomePage.jsx'
import IdentifyPage from './pages/IdentifyPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProductDetailsPage from './pages/ProductDetailsPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import VerifyOtpPage from './pages/VerifyOtpPage.jsx'

function App() {
  return (
    <Routes>
      {/* Storefront: navbar and footer on every page. */}
      <Route element={<MainLayout />}>
        <Route path={APP_ROUTES.HOME} element={<HomePage />} />
        <Route path={APP_ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={APP_ROUTES.CONTACT} element={<ContactPage />} />
        <Route path={APP_ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path={APP_ROUTES.PRODUCT_DETAILS} element={<ProductDetailsPage />} />
        <Route path={APP_ROUTES.CART} element={<CartPage />} />

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

      {/* Sign-in flow: no navbar or footer. */}
      <Route element={<AuthLayout />}>
        <Route path={APP_ROUTES.IDENTIFY} element={<IdentifyPage />} />
        <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={APP_ROUTES.VERIFY_OTP} element={<VerifyOtpPage />} />
      </Route>
    </Routes>
  )
}

export default App