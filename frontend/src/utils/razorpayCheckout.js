const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

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

export async function openRazorpayCheckout(checkout, onPaymentSuccess) {
  await loadRazorpay()

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      callback(value)
    }

    const razorpay = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      order_id: checkout.orderId,
      prefill: checkout.prefill,
      handler: async (response) => {
        try {
          const order = await onPaymentSuccess(response)
          finish(resolve, order)
        } catch (error) {
          finish(reject, error)
        }
      },
      modal: {
        ondismiss: () => finish(resolve, null),
      },
    })

    razorpay.on('payment.failed', () => {
      finish(reject, new Error('Payment was not completed. Please try again.'))
    })
    razorpay.open()
  })
}

export default openRazorpayCheckout
