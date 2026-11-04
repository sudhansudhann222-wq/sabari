import { getCorsHeaders, json } from '../_shared/cors.ts'

type PaymentRequest = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(request) })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, request)

  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
  const keyId = Deno.env.get('RAZORPAY_KEY_ID')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const authHeader = request.headers.get('Authorization')
  if (!secret || !keyId || !supabaseUrl || !serviceKey || !anonKey) return json({ error: 'Payment verification is not configured on the server.' }, 500)
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Please sign in before verifying payment.' }, 401)

  try {
    const body = await request.json() as PaymentRequest
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return json({ error: 'Incomplete payment response.' }, 400)
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authHeader } })
    if (!userResponse.ok) return json({ error: 'Your session expired. Please sign in again.' }, 401)
    const user = await userResponse.json()

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const digest = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    )

    const expectedSignature = toHex(digest)
    if (!/^[0-9a-f]{64}$/i.test(body.razorpay_signature) || body.razorpay_signature.length !== expectedSignature.length) {
      return json({ error: 'Invalid payment signature.' }, 400)
    }
    let signatureDifference = 0
    for (let index = 0; index < expectedSignature.length; index += 1) {
      signatureDifference |= expectedSignature.charCodeAt(index) ^ body.razorpay_signature.toLowerCase().charCodeAt(index)
    }
    if (signatureDifference !== 0) return json({ error: 'Invalid payment signature.' }, 400)

    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=id,user_id,order_id,total,payment_status,razorpay_payment_id&razorpay_order_id=eq.${encodeURIComponent(body.razorpay_order_id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    })
    const [order] = await orderResponse.json()
    if (!orderResponse.ok || !order) return json({ error: 'This payment does not match an order on your account.' }, 404)
    if (order.payment_status === 'Paid' && order.razorpay_payment_id === body.razorpay_payment_id) {
      return json({ verified: true, orderId: order.order_id })
    }

    const credentials = btoa(`${keyId}:${secret}`)
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(body.razorpay_payment_id)}`, {
      headers: { Authorization: `Basic ${credentials}` }
    })
    const payment = await paymentResponse.json()
    if (!paymentResponse.ok || payment.order_id !== body.razorpay_order_id || payment.currency !== 'INR' || payment.amount !== Math.round(Number(order.total) * 100)) {
      return json({ error: 'The payment amount or order could not be confirmed with Razorpay.' }, 400)
    }
    if (payment.status === 'authorized') {
      const captureResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(body.razorpay_payment_id)}/capture`, {
        method: 'POST',
        headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payment.amount, currency: payment.currency })
      })
      if (captureResponse.ok) Object.assign(payment, await captureResponse.json())
    }
    if (payment.status !== 'captured') return json({ error: 'Razorpay has not captured this payment yet. Please wait a moment and try again.' }, 409)

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}&user_id=eq.${encodeURIComponent(user.id)}&payment_status=eq.Pending`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ payment_status: 'Paid', payment_method: `Razorpay (${body.razorpay_payment_id})`, razorpay_payment_id: body.razorpay_payment_id })
    })
    if (!updateResponse.ok) return json({ error: 'Payment was captured, but the order status could not be updated. Contact support with your payment ID.' }, 503)
    return json({ verified: true, orderId: order.order_id })
  } catch (error) {
    console.error('Razorpay verification error:', error)
    return json({ error: 'Invalid request.' }, 400)
  }
})
