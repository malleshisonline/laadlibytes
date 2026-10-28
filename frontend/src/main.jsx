import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/merienda'
import '@fontsource-variable/nunito'
import './index.css'
import App from './App.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import CartProvider from './context/CartProvider.jsx'

// Every toast on the site comes from this one Toaster, so the brand look lives here. Inline styles, because
// react-hot-toast sets its own inline defaults that a class could not override. Colours are the theme tokens.
const toastOptions = {
  duration: 3500,
  style: {
    background: 'var(--color-cream-50)',
    color: 'var(--color-heading)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9375rem',
    fontWeight: 600,
    lineHeight: 1.4,
    padding: '0.75rem 1rem',
    maxWidth: '26rem',
    border: '1px solid var(--color-line)',
    borderLeft: '4px solid var(--color-navy-700)',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 30px -12px rgb(4 59 101 / 0.35)',
  },
  success: {
    style: { borderLeftColor: 'var(--color-success)' },
    iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-cream-50)' },
  },
  error: {
    duration: 5000,
    style: { borderLeftColor: 'var(--color-error)' },
    iconTheme: { primary: 'var(--color-error)', secondary: 'var(--color-cream-50)' },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
          <Toaster position="top-center" gutter={10} containerStyle={{ top: 20 }} toastOptions={toastOptions} />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)