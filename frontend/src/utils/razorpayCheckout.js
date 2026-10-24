const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

// Razorpay closes its payment window after this long, so an abandoned checkout cannot be paid hours later.
// The backend gives an unpaid checkout's stock back after 30 minutes, well after this.
const CHECKOUT_TIMEOUT_SECONDS = 15 * 60

// How often the backend is asked whether Razorpay has taken the money while the window is open.
const PAYMENT_STATUS_POLL_MS = 5000

let scriptPromise

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      scriptPromise = null
      reject(new Error('Secure payment checkout could not be loaded. Please try again.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Opens Razorpay Checkout and resolves to the paid order, or to null when the shopper closes the window
 * without paying.
 *
 * `onPaymentSuccess(response)` verifies the payment Razorpay reports. `checkPaymentStatus({ abandon })`
 * (optional) asks the backend, which asks Razorpay, and resolves to `{ paymentStatus, order }`. With it,
 * a payment Razorpay never reported to this page (a QR paid from another phone, a slow UPI app) still
 * closes the window and places the order, and closing the window unpaid tells the backend to give the
 * stock back.
 *
 * A failed attempt does not end checkout: Razorpay keeps its window open so the shopper can try again.
 */
export async function openRazorpayCheckout(checkout, onPaymentSuccess, checkPaymentStatus) {
  await loadRazorpay()

  return new Promise((resolve, reject) => {
    let settled = false
    let pollTimer
    let isPolling = false

    const finish = (callback, value) => {
      if (settled) return
      settled = true
      clearInterval(pollTimer)
      callback(value)
    }

    /** The paid order according to the backend, or null. */
    const paidOrderFromStatus = async ({ abandon = false } = {}) => {
      if (!checkPaymentStatus) return null
      const result = await checkPaymentStatus({ abandon })
      return result?.paymentStatus === 'paid' ? result.order : null
    }

    const razorpay = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      order_id: checkout.orderId,
      prefill: checkout.prefill,
      timeout: CHECKOUT_TIMEOUT_SECONDS,
      handler: async (response) => {
        clearInterval(pollTimer)
        try {
          finish(resolve, await onPaymentSuccess(response))
        } catch (error) {
          // Razorpay took the payment but verifying it failed (e.g. not captured yet): ask once more before giving up.
          try {
            const order = await paidOrderFromStatus()
            if (order) return finish(resolve, order)
          } catch {
            // Fall through to the verification error.
          }
          finish(reject, error)
        }
      },
      modal: {
        ondismiss: async () => {
          if (settled) return
          clearInterval(pollTimer)
          try {
            finish(resolve, await paidOrderFromStatus({ abandon: true }))
          } catch {
            finish(resolve, null)
          }
        },
      },
    })

    razorpay.open()

    if (checkPaymentStatus) {
      pollTimer = setInterval(async () => {
        if (settled || isPolling) return
        isPolling = true
        try {
          const order = await paidOrderFromStatus()
          if (order && !settled) {
            finish(resolve, order)
            razorpay.close()
          }
        } catch {
          // A failed check is retried on the next tick.
        } finally {
          isPolling = false
        }
      }, PAYMENT_STATUS_POLL_MS)
    }
  })
}

export default openRazorpayCheckout