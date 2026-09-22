import { Route, Routes } from 'react-router'

import { APP_ROUTES } from './constants/appRoutepoints.js'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import IdentifyPage from './pages/IdentifyPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import VerifyOtpPage from './pages/VerifyOtpPage.jsx'

function App() {
  return (
    <Routes>
      {/* Storefront: navbar and footer on every page. */}
      <Route element={<MainLayout />}>
        <Route path={APP_ROUTES.HOME} element={<HomePage />} />
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