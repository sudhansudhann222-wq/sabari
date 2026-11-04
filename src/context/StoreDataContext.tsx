import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Product, Coupon, Order, BulkInquiry } from '../types'
import { PRODUCTS } from '../data/products'
import { getSupabaseClient } from '../lib/supabase'

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    code: 'TEECRAFT100',
    discountType: 'flat',
    discountAmount: 100,
    minSpend: 499,
    description: '₹100 flat discount on orders above ₹499',
    isActive: true,
    usageCount: 142,
    createdAt: new Date().toISOString()
  },
  {
    id: 'coupon-2',
    code: 'FIRST50',
    discountType: 'percentage',
    discountPercent: 20,
    minSpend: 399,
    description: '20% off for first-time streetwear shoppers',
    isActive: true,
    usageCount: 89,
    createdAt: new Date().toISOString()
  },
  {
    id: 'coupon-3',
    code: 'FREESHIP',
    discountType: 'flat',
    discountAmount: 0,
    minSpend: 299,
    description: 'Free Express Shipping all across India',
    isActive: true,
    usageCount: 215,
    createdAt: new Date().toISOString()
  },
  {
    id: 'coupon-4',
    code: 'VIP50',
    discountType: 'percentage',
    discountPercent: 50,
    minSpend: 999,
    description: 'Exclusive 50% discount for VIP members',
    isActive: true,
    usageCount: 34,
    createdAt: new Date().toISOString()
  }
]

const INITIAL_INQUIRIES: BulkInquiry[] = [
  {
    id: 'inq-1',
    companyName: 'Apex Gaming Tech',
    contactPerson: 'Vikram Mehta',
    email: 'vikram@apextech.io',
    phone: '+91 98765 43210',
    pcsCount: 120,
    tshirtType: 'Oversized 240 GSM',
    printSides: 'both',
    estimatedTotal: 35880,
    notes: 'Need company logo on front chest and game illustration on full back for upcoming esports expo.',
    status: 'Quoted',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'inq-2',
    companyName: 'Horizon Creative Studio',
    contactPerson: 'Ananya Sharma',
    email: 'ananya@horizoncreatives.in',
    phone: '+91 99887 76655',
    pcsCount: 65,
    tshirtType: 'Regular Cotton',
    printSides: 'single',
    estimatedTotal: 19435,
    notes: 'Monochrome minimalist print for annual team retreat.',
    status: 'New',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
]

interface StoreDataContextType {
  // Products
  products: Product[]
  addProduct: (product: Omit<Product, 'id'>) => Product
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  toggleProductStock: (id: string) => void
  resetProductsToDefault: () => void

  // Coupons
  coupons: Coupon[]
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => Coupon
  updateCoupon: (code: string, updates: Partial<Coupon>) => void
  deleteCoupon: (code: string) => void
  toggleCouponActive: (code: string) => void
  resetCouponsToDefault: () => void

  // Orders
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: string) => void

  // Bulk Inquiries
  bulkInquiries: BulkInquiry[]
  addBulkInquiry: (inquiry: Omit<BulkInquiry, 'id' | 'createdAt'>) => BulkInquiry
  updateInquiryStatus: (id: string, status: string) => void
  deleteInquiry: (id: string) => void
}

const StoreDataContext = createContext<StoreDataContextType | undefined>(undefined)

const STORAGE_KEYS = {
  PRODUCTS: 'teecraft_custom_products_v2',
  COUPONS: 'teecraft_coupons_v2',
  ORDERS: 'teecraft_orders_local_v2',
  INQUIRIES: 'teecraft_bulk_inquiries_v2'
}

export const StoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Products state
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // fallback
    }
    return PRODUCTS.map(p => ({ ...p, inStock: p.inStock ?? true }))
  })

  // 2. Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUPONS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // fallback
    }
    return INITIAL_COUPONS
  })

  // 3. Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // fallback
    }
    return []
  })

  // 4. Bulk inquiries state
  const [bulkInquiries, setBulkInquiries] = useState<BulkInquiry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INQUIRIES)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // fallback
    }
    return INITIAL_INQUIRIES
  })

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
    } catch (e) {
      console.warn('Failed saving products to localStorage', e)
    }
  }, [products])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons))
    } catch (e) {
      console.warn('Failed saving coupons to localStorage', e)
    }
  }, [coupons])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
    } catch (e) {
      console.warn('Failed saving orders to localStorage', e)
    }
  }, [orders])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(bulkInquiries))
    } catch (e) {
      console.warn('Failed saving inquiries to localStorage', e)
    }
  }, [bulkInquiries])

  // Sync with Supabase in background if client configured
  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) return

    // Fetch live orders from Supabase and merge
    client.from('orders').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length > 0) {
          const supabaseOrders: Order[] = data.map((o: any) => ({
            orderId: o.order_id || o.id,
            date: o.created_at || new Date().toISOString(),
            items: o.items || [],
            subtotal: o.subtotal || 0,
            discount: o.discount || 0,
            deliveryFee: o.delivery_fee || 0,
            total: o.total || 0,
            shippingDetails: o.shipping_details || {},
            paymentMethod: o.payment_method || 'Online',
            paymentStatus: o.payment_status || 'Paid',
            orderStatus: o.order_status || 'New',
            estimatedDelivery: o.estimated_delivery || '4-5 Days'
          }))

          setOrders(prev => {
            const map = new Map<string, Order>()
            supabaseOrders.forEach(so => map.set(so.orderId, so))
            prev.forEach(po => {
              if (!map.has(po.orderId)) map.set(po.orderId, po)
            })
            return Array.from(map.values())
          })
        }
      }, () => {})

    // Fetch live bulk inquiries
    client.from('bulk_inquiries').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length > 0) {
          const supaInquiries: BulkInquiry[] = data.map((inq: any) => ({
            id: inq.id,
            companyName: inq.company_name,
            contactPerson: inq.contact_person,
            email: inq.email,
            phone: inq.phone,
            pcsCount: inq.pcs_count,
            tshirtType: inq.tshirt_type,
            printSides: inq.print_sides,
            estimatedTotal: inq.estimated_total,
            notes: inq.notes,
            status: inq.status || 'New',
            createdAt: inq.created_at || new Date().toISOString()
          }))

          setBulkInquiries(prev => {
            const map = new Map<string, BulkInquiry>()
            supaInquiries.forEach(si => map.set(si.id, si))
            prev.forEach(pi => {
              if (!map.has(pi.id)) map.set(pi.id, pi)
            })
            return Array.from(map.values())
          })
        }
      }, () => {})
  }, [])

  // Product Actions
  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    const newId = `tee-prod-${Date.now()}`
    const newProduct: Product = {
      ...productData,
      id: newId,
      inStock: productData.inStock ?? true,
      rating: productData.rating || 4.8,
      reviewsCount: productData.reviewsCount || 1,
      patternCoverage: productData.patternCoverage?.length ? productData.patternCoverage : ['Front']
    }
    setProducts(prev => [newProduct, ...prev])
    return newProduct
  }, [])

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const toggleProductStock = useCallback((id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p))
  }, [])

  const resetProductsToDefault = useCallback(() => {
    const defaults = PRODUCTS.map(p => ({ ...p, inStock: true }))
    setProducts(defaults)
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaults))
  }, [])

  // Coupon Actions
  const addCoupon = useCallback((couponData: Omit<Coupon, 'id' | 'createdAt'>) => {
    const cleanCode = couponData.code.trim().toUpperCase()
    const newCoupon: Coupon = {
      ...couponData,
      id: `coupon-${Date.now()}`,
      code: cleanCode,
      isActive: couponData.isActive ?? true,
      usageCount: couponData.usageCount || 0,
      createdAt: new Date().toISOString()
    }
    setCoupons(prev => [newCoupon, ...prev.filter(c => c.code !== cleanCode)])
    return newCoupon
  }, [])

  const updateCoupon = useCallback((code: string, updates: Partial<Coupon>) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, ...updates } : c))
  }, [])

  const deleteCoupon = useCallback((code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code))
  }, [])

  const toggleCouponActive = useCallback((code: string) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c))
  }, [])

  const resetCouponsToDefault = useCallback(() => {
    setCoupons(INITIAL_COUPONS)
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS))
  }, [])

  // Order Actions
  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev.filter(o => o.orderId !== order.orderId)])
  }, [])

  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, orderStatus: status } : o))
    
    // Also update Supabase if client active
    const client = getSupabaseClient()
    if (client) {
      client.from('orders').update({ order_status: status }).eq('order_id', orderId).then(() => {}, () => {})
    }
  }, [])

  // Bulk Inquiry Actions
  const addBulkInquiry = useCallback((inquiryData: Omit<BulkInquiry, 'id' | 'createdAt'>) => {
    const newInquiry: BulkInquiry = {
      ...inquiryData,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: inquiryData.status || 'New'
    }
    setBulkInquiries(prev => [newInquiry, ...prev])
    return newInquiry
  }, [])

  const updateInquiryStatus = useCallback((id: string, status: string) => {
    setBulkInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    const client = getSupabaseClient()
    if (client) {
      client.from('bulk_inquiries').update({ status }).eq('id', id).then(() => {}, () => {})
    }
  }, [])

  const deleteInquiry = useCallback((id: string) => {
    setBulkInquiries(prev => prev.filter(i => i.id !== id))
  }, [])

  return (
    <StoreDataContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        resetProductsToDefault,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        resetCouponsToDefault,
        orders,
        addOrder,
        updateOrderStatus,
        bulkInquiries,
        addBulkInquiry,
        updateInquiryStatus,
        deleteInquiry
      }}
    >
      {children}
    </StoreDataContext.Provider>
  )
}

export const useStoreData = () => {
  const context = useContext(StoreDataContext)
  if (!context) {
    throw new Error('useStoreData must be used within a StoreDataProvider')
  }
  return context
}
