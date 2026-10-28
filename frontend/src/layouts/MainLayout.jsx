import { Outlet } from 'react-router'

import CouponBanner from '../components/layout/CouponBanner.jsx'
import FloatingContactActions from '../components/layout/FloatingContactActions.jsx'
import Footer from '../components/layout/Footer.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import { useCouponShareLink } from '../hooks/useCouponShareLink.js'

// Shared shell: every page renders between the navbar and the footer. A coupon share link works on any of them.
function MainLayout() {
  useCouponShareLink()

  return (
    <>
      <CouponBanner />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <FloatingContactActions />
      <Footer />
    </>
  )
}

export default MainLayout