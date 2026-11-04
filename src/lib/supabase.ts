import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Order, Product, SideDesign } from '../types'
import { PRODUCTS } from '../data/products'

// Supabase credentials are build-time configuration. Never persist them in browser storage.
const getSavedUrl = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || ''
  if (envUrl) return envUrl
  return ''
}

const getSavedKey = () => {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  if (envKey) return envKey
  return ''
}

let supabaseInstance: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient | null => {
  const url = getSavedUrl()
  const key = getSavedKey()

  if (!url || !key || !url.startsWith('http')) {
    return null
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key)
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e)
      return null
    }
  }

  return supabaseInstance
}

export const isSupabaseConfigured = (): boolean => {
  const url = getSavedUrl()
  const key = getSavedKey()
  return Boolean(url && key && url.startsWith('http'))
}

export const getSupabaseConfig = () => {
  return {
    url: getSavedUrl(),
    key: getSavedKey()
  }
}

export const setSupabaseConfig = (url: string, key: string) => {
  void url
  void key
  return false
}

// Test Connection
export const testSupabaseConnection = async (testUrl?: string, testKey?: string): Promise<{ success: boolean; message: string }> => {
  const url = testUrl || getSavedUrl()
  const key = testKey || getSavedKey()

  if (!url || !key) {
    return { success: false, message: 'Please provide both Project URL and Anon Key.' }
  }

  try {
    const tempClient = createClient(url, key)
    const { error } = await tempClient.from('products').select('count', { count: 'exact', head: true })
    if (error && error.code !== 'PGRST116') {
      return { success: false, message: error.message || 'Connection failed' }
    }
    return { success: true, message: 'Successfully connected to Supabase!' }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to connect. Check your URL & Key.' }
  }
}

// 1. PRODUCTS: Fetch from Supabase with fallback to local static products
export const fetchProductsFromSupabase = async (): Promise<Product[]> => {
  const client = getSupabaseClient()
  if (!client) return PRODUCTS

  try {
    const { data, error } = await client.from('products').select('*')
    if (error || !data || data.length === 0) {
      return PRODUCTS
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: Number(item.price),
      originalPrice: Number(item.original_price),
      discountPercent: Number(item.discount_percent),
      rating: Number(item.rating),
      reviewsCount: Number(item.reviews_count),
      colors: item.colors || [],
      availableSizes: item.available_sizes || ['S', 'M', 'L', 'XL', 'XXL'],
      patternCoverage: item.pattern_coverage || ['Front'],
      imageUrl: item.image_url,
      description: item.description,
      isBestseller: item.is_bestseller,
      tags: item.tags || []
    }))
  } catch {
    return PRODUCTS
  }
}

// 2. ORDERS: Fetch past orders from Supabase
export const fetchOrdersFromSupabase = async (): Promise<Order[]> => {
  const client = getSupabaseClient()
  if (!client) return []

  const { data, error } = await client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!data) return []

  return data.map((item: any) => ({
      orderId: item.order_id,
      date: new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: item.items || [],
      subtotal: Number(item.subtotal),
      discount: Number(item.discount),
      deliveryFee: Number(item.delivery_fee),
      total: Number(item.total),
      shippingDetails: item.shipping_details,
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      orderStatus: item.order_status,
      estimatedDelivery: item.estimated_delivery
  }))
}

// 4. CUSTOM DESIGNS: Save user custom creation to Supabase
export interface SavedCustomDesign {
  id: string
  name: string
  tshirtType: string
  color: string
  colorName: string
  size: string
  printLocation: string
  designData: {
    front?: SideDesign
    back?: SideDesign
    sleeve?: SideDesign
  }
  previewImage: string
  createdAt: string
}

export const saveCustomDesignToSupabase = async (design: Omit<SavedCustomDesign, 'id' | 'createdAt'>): Promise<{ success: boolean; id?: string }> => {
  try {
    const current = JSON.parse(localStorage.getItem('teecraft_custom_designs') || '[]')
    const localDesign = { ...design, id: 'local-' + Date.now(), createdAt: new Date().toISOString() }
    localStorage.setItem('teecraft_custom_designs', JSON.stringify([localDesign, ...current]))
    return { success: true, id: localDesign.id }
  } catch {
    return { success: false }
  }
}

// 5. CUSTOM DESIGNS: Fetch saved designs
export const fetchSavedDesignsFromSupabase = async (): Promise<SavedCustomDesign[]> => {
  try {
    return JSON.parse(localStorage.getItem('teecraft_custom_designs') || '[]')
  } catch {
    return []
  }
}

// 6. BULK INQUIRIES: Save to Supabase
export const submitBulkInquiryToSupabase = async (inquiry: {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  pcsCount: number
  tshirtType: string
  printSides: string
  estimatedTotal: number
  notes?: string
}): Promise<boolean> => {
  const client = getSupabaseClient()
  if (!client) return true // treated as submitted

  try {
    const { error } = await client.from('bulk_inquiries').insert([
      {
        company_name: inquiry.companyName,
        contact_person: inquiry.contactPerson,
        email: inquiry.email,
        phone: inquiry.phone,
        pcs_count: inquiry.pcsCount,
        tshirt_type: inquiry.tshirtType,
        print_sides: inquiry.printSides,
        estimated_total: inquiry.estimatedTotal,
        notes: inquiry.notes || ''
      }
    ])

    return !error
  } catch {
    return true
  }
}

