import { corsHeaders, json } from '../_shared/cors.ts'

type CheckoutItem = {
  productId?: string
  id?: string
  quantity: number
  size?: string
  color?: string
  colorName?: string
  printLocation?: string
  previewImage?: string
  isCustom?: boolean
  customDesign?: unknown
}

type CheckoutRequest = {
  paymentMethod: 'razorpay' | 'cod'
  items: CheckoutItem[]
  couponCode?: string | null
  expectedTotal?: number
  shippingDetails: {
    fullName: string
    email?: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
}

const required = (value: unknown, max = 180) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const authHeader = request.headers.get('Authorization')
  if (!supabaseUrl || !serviceKey || !anonKey) return json({ error: 'Checkout service is not configured.' }, 500)
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Please sign in before checkout.' }, 401)

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: authHeader }
    })
    if (!userResponse.ok) return json({ error: 'Your session expired. Please sign in again.' }, 401)
    const user = await userResponse.json()
    const body = await request.json() as CheckoutRequest
    if (!['razorpay', 'cod'].includes(body.paymentMethod) || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
      return json({ error: 'Invalid checkout details.' }, 400)
    }
    if (body.items.some(item => item.customDesign !== undefined && JSON.stringify(item.customDesign).length > 500_000)) {
      return json({ error: 'A custom design is too large to place in an order.' }, 413)
    }
    const shipping = body.shippingDetails
    if (!shipping || !required(shipping.fullName, 100) || !/^\d{10}$/.test(shipping.phone) ||
      !required(shipping.address, 300) || !required(shipping.city, 100) || !required(shipping.state, 100) || !/^\d{6}$/.test(shipping.pincode) ||
      (shipping.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email))) {
      return json({ error: 'Please provide valid shipping details.' }, 400)
    }

    const productIds = [...new Set(body.items.map(item => item.productId || '').filter(id => id && id !== 'custom-design'))]
    if (productIds.some(id => !/^[a-z0-9-]{1,100}$/.test(id))) return json({ error: 'Invalid product in cart.' }, 400)
    const productsResponse = productIds.length
      ? await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,price,original_price,discount_percent,colors,available_sizes&id=in.(${productIds.join(',')})`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      })
      : new Response('[]')
    if (!productsResponse.ok) return json({ error: 'Could not validate the product catalog.' }, 503)
    const products = await productsResponse.json() as Array<Record<string, unknown>>
    const productById = new Map(products.map(product => [String(product.id), product]))

    let subtotal = 0
    const items = []
    for (const item of body.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) return json({ error: 'Each item quantity must be between 1 and 10.' }, 400)
      const isCustom = item.productId === 'custom-design'
      const product = isCustom ? null : productById.get(item.productId || '')
      if (!isCustom && !product) return json({ error: 'A product in your cart is no longer available. Refresh the store and try again.' }, 409)
      const price = isCustom ? 499 : Number(product?.price)
      if (!Number.isFinite(price) || price <= 0) return json({ error: 'A product has an invalid price.' }, 400)
      const sizes = isCustom ? ['S', 'M', 'L', 'XL', 'XXL'] : product?.available_sizes as string[] | undefined
      const colors = isCustom ? undefined : product?.colors as string[] | undefined
      if (item.size && sizes?.length && !sizes.includes(item.size)) return json({ error: 'A selected size is unavailable. Refresh the store and try again.' }, 409)
      if (item.color && colors?.length && !colors.includes(item.color)) return json({ error: 'A selected color is unavailable. Refresh the store and try again.' }, 409)
      subtotal += price * item.quantity
      items.push({
        id: item.id || crypto.randomUUID(),
        productId: item.productId,
        name: isCustom ? 'Custom T-Shirt' : String(product?.name),
        tshirtType: isCustom ? 'Custom T-Shirt' : 'T-Shirt',
        color: item.color || '',
        colorName: item.colorName || '',
        size: item.size || 'L',
        quantity: item.quantity,
        price,
        originalPrice: isCustom ? 499 : Number(product?.original_price || price),
        discountPercent: isCustom ? 0 : Number(product?.discount_percent || 0),
        printLocation: item.printLocation || 'Front',
        previewImage: item.previewImage || '',
        isCustom,
        ...(isCustom && item.customDesign !== undefined ? { customDesign: item.customDesign } : {})
      })
    }

    const deliveryFee = subtotal > 499 ? 0 : 49
    const coupon = (body.couponCode || '').trim().toUpperCase()
    let discount = 0
    if (coupon === 'TEECRAFT100' && subtotal >= 499) discount = 100
    if (coupon === 'FIRST50' && subtotal >= 399) discount = Math.round(subtotal * 0.2)
    const payableDeliveryFee = coupon === 'FREESHIP' && subtotal >= 299 ? 0 : deliveryFee
    const total = Math.max(0, subtotal - discount + payableDeliveryFee)
    if (!Number.isSafeInteger(total * 100) || total <= 0) return json({ error: 'Invalid checkout total.' }, 400)
    if (typeof body.expectedTotal === 'number' && Math.round(body.expectedTotal * 100) !== Math.round(total * 100)) {
      return json({ error: 'A product price or discount changed. Refresh your cart and try again.' }, 409)
    }

    let razorpayOrderId: string | undefined
    let keyId: string | undefined
    if (body.paymentMethod === 'razorpay') {
      keyId = Deno.env.get('RAZORPAY_KEY_ID')
      const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
      if (!keyId || !keySecret) return json({ error: 'Razorpay is not configured on the server.' }, 503)

      const credentials = btoa(`${keyId}:${keySecret}`)
      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total * 100, currency: 'INR', receipt: `TC-${crypto.randomUUID().slice(0, 30)}` })
      })
      const razorpay = await razorpayResponse.json()
      if (!razorpayResponse.ok || !razorpay.id) {
        return json({ error: razorpay.error?.description || 'Razorpay order creation failed.' }, 502)
      }
      razorpayOrderId = razorpay.id
    }

    const appOrderId = `TC-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
    const estimated = new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    const orderRow = {
      user_id: user.id,
      order_id: appOrderId,
      ...(razorpayOrderId ? { razorpay_order_id: razorpayOrderId } : {}),
      items,
      subtotal,
      discount,
      delivery_fee: payableDeliveryFee,
      total,
      shipping_details: { ...shipping, fullName: shipping.fullName.trim(), address: shipping.address.trim() },
      payment_method: body.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay',
      payment_status: body.paymentMethod === 'cod' ? 'Pending (COD)' : 'Pending',
      order_status: 'New',
      estimated_delivery: estimated
    }
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(orderRow)
    })
    if (!insertResponse.ok) {
      const databaseError = await insertResponse.text()
      console.error('Could not save checkout order:', databaseError)
      if (razorpayOrderId && /razorpay_order_id|razorpay_payment_id|schema cache/i.test(databaseError)) {
        return json({ error: 'Payment tracking columns are missing from public.orders. Apply supabase/razorpay_payment_schema.sql in the Supabase SQL Editor, then retry.' }, 503)
      }
      return json({ error: 'Could not save the order. Please try again.' }, 503)
    }

    if (body.paymentMethod === 'cod') return json({ orderId: appOrderId, amount: total, currency: 'INR', subtotal, discount, deliveryFee: payableDeliveryFee })

    return json({ orderId: appOrderId, razorpayOrderId, amount: total, currency: 'INR', subtotal, discount, deliveryFee: payableDeliveryFee, keyId })
  } catch (error) {
    console.error('Checkout order error:', error)
    return json({ error: 'Checkout could not be started. Please try again.' }, 400)
  }
})
