import { Route, Routes } from 'react-router'

import { APP_ROUTES } from './constants/appRoutepoints.js'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import AboutPage from './pages/AboutPage.jsx'
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