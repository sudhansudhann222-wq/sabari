import { getSupabaseClient, getSupabaseConfig } from './supabase'

export type RazorpayPaymentResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name: string; email: string; contact: string }
  notes: Record<string, string>
  theme: { color: string }
  handler: (response: RazorpayPaymentResponse) => void
  modal: { ondismiss: () => void }
}

export type CheckoutOrderResult = {
  orderId: string
  razorpayOrderId?: string
  keyId?: string
  amount: number
  currency: string
  subtotal: number
  discount: number
  deliveryFee: number
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void }
  }
}

const scriptUrl = 'https://checkout.razorpay.com/v1/checkout.js'

const getAuthenticatedHeaders = async () => {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase sign-in is required before paying.')
  const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('Verify your email or mobile OTP before making an online payment.')
  return {
    'Content-Type': 'application/json',
    apikey: getSupabaseConfig().key,
    Authorization: `Bearer ${session.access_token}`
  }
}

export const loadRazorpay = async (): Promise<boolean> => {
  if (window.Razorpay) return true

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`)
  if (existing) {
    await new Promise<void>(resolve => {
      const timeout = window.setTimeout(resolve, 15000)
      const finish = () => {
        window.clearTimeout(timeout)
        resolve()
      }
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener('error', finish, { once: true })
    })
    return Boolean(window.Razorpay)
  }

  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    const timeout = window.setTimeout(() => resolve(false), 15000)
    script.onload = () => {
      window.clearTimeout(timeout)
      resolve(Boolean(window.Razorpay))
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

export const createCheckoutOrder = async (payload: {
  paymentMethod: 'razorpay' | 'cod'
  items: unknown[]
  couponCode?: string
  expectedTotal: number
  shippingDetails: Record<string, string>
}): Promise<CheckoutOrderResult> => {
  const endpoint = import.meta.env.VITE_RAZORPAY_ORDER_ENDPOINT
  if (!endpoint) throw new Error('Razorpay order endpoint is not configured.')

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: await getAuthenticatedHeaders(),
      body: JSON.stringify(payload)
    })
  } catch {
    throw new Error('Could not reach the checkout service. Refresh the page and try again. If it continues, check that the Supabase checkout-order function is deployed and the order endpoint in .env points to this project.')
  }

  let data: Partial<CheckoutOrderResult> & { error?: string }
  try {
    data = await response.json() as Partial<CheckoutOrderResult> & { error?: string }
  } catch {
    throw new Error('The checkout service returned an unreadable response. Please try again or contact support.')
  }
  if (!response.ok) throw new Error(data.error || 'Unable to create the checkout order.')
  if (!data.orderId || typeof data.amount !== 'number' || typeof data.subtotal !== 'number' || typeof data.discount !== 'number' || typeof data.deliveryFee !== 'number') {
    throw new Error('The checkout server returned incomplete order details.')
  }
  return data as CheckoutOrderResult
}

export const verifyRazorpayPayment = async (payment: RazorpayPaymentResponse): Promise<{ orderId: string }> => {
  const endpoint = import.meta.env.VITE_RAZORPAY_VERIFY_ENDPOINT
  if (!endpoint) throw new Error('Razorpay verification endpoint is not configured.')

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: await getAuthenticatedHeaders(),
      body: JSON.stringify(payment)
    })
  } catch {
    throw new Error('Could not reach the payment verification service. Do not retry the payment yet; check the order status or contact support with your Razorpay payment ID.')
  }
  let data: { verified?: boolean; orderId?: string; error?: string }
  try {
    data = await response.json() as { verified?: boolean; orderId?: string; error?: string }
  } catch {
    throw new Error('The payment verification service returned an unreadable response. Check your Razorpay order status before retrying.')
  }
  if (!response.ok) throw new Error(data.error || 'Payment verification failed.')
  if (!data.verified || !data.orderId) throw new Error('The payment server could not confirm this order.')
  return { orderId: data.orderId }
}

