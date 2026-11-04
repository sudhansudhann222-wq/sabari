import { getCorsHeaders, json } from '../_shared/cors.ts'

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')

const signaturesMatch = (expected: string, received: string) => {
  if (!/^[0-9a-f]{64}$/i.test(received) || expected.length !== received.length) return false
  let difference = 0
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ received.toLowerCase().charCodeAt(index)
  }
  return difference === 0
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(request) })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, request)

  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!webhookSecret || !supabaseUrl || !serviceKey) return json({ error: 'Webhook is not configured.' }, 500)

  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature') || ''
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
    if (!signaturesMatch(toHex(digest), signature)) return json({ error: 'Invalid webhook signature.' }, 401)

    const event = JSON.parse(rawBody)
    if (event.event !== 'payment.captured') return json({ received: true })
    const payment = event.payload?.payment?.entity
    if (!payment?.id || !payment?.order_id || payment.status !== 'captured' || payment.currency !== 'INR') {
      return json({ error: 'Invalid captured payment event.' }, 400)
    }

    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=id,total,payment_status,razorpay_payment_id&razorpay_order_id=eq.${encodeURIComponent(payment.order_id)}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    })
    if (!orderResponse.ok) return json({ error: 'Could not look up the checkout order.' }, 503)
    const [order] = await orderResponse.json()
    if (!order) return json({ received: true })
    if (payment.amount !== Math.round(Number(order.total) * 100)) return json({ error: 'Captured amount does not match the order.' }, 400)
    if (order.payment_status === 'Paid' && order.razorpay_payment_id === payment.id) return json({ received: true })

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}&payment_status=eq.Pending`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ payment_status: 'Paid', payment_method: `Razorpay (${payment.id})`, razorpay_payment_id: payment.id })
    })
    if (!updateResponse.ok) return json({ error: 'Could not update the order payment status.' }, 503)
    return json({ received: true })
  } catch (error) {
    console.error('Razorpay webhook error:', error)
    return json({ error: 'Could not process webhook event.' }, 400)
  }
})
