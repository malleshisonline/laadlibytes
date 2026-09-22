import { Outlet } from 'react-router'

import Footer from '../components/layout/Footer.jsx'
import Navbar from '../components/layout/Navbar.jsx'

// Shared shell: every page renders between the navbar and the footer.
function MainLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default MainLayout