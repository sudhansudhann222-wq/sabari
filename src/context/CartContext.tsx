import React, { createContext, useContext, useState, useEffect } from 'react'
import { CartItem, Coupon, Order } from '../types'
import { useStoreData } from './StoreDataContext'

export const DEFAULT_COUPONS: Coupon[] = [
  { code: 'TEECRAFT100', discountAmount: 100, minSpend: 499, description: '₹100 flat discount on orders above ₹499', isActive: true },
  { code: 'FIRST50', discountPercent: 20, minSpend: 399, description: '20% off for first-time shoppers', isActive: true },
  { code: 'FREESHIP', minSpend: 299, description: 'Free Express Shipping', isActive: true }
]

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  appliedCoupon: Coupon | null
  applyCoupon: (code: string) => { success: boolean; message: string }
  removeCoupon: () => void
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  totalCount: number
  orders: Order[]
  placeOrder: (orderDetails: Omit<Order, 'orderId' | 'date' | 'estimatedDelivery'>, orderId?: string) => Order
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CartItem>
  return typeof item.id === 'string' && typeof item.name === 'string' &&
    typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0 &&
    typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0
}

const isSameCartLine = (left: CartItem, right: CartItem) => {
  if (
    left.productId !== right.productId ||
    left.name !== right.name ||
    left.tshirtType !== right.tshirtType ||
    left.color !== right.color ||
    left.size !== right.size ||
    left.printLocation !== right.printLocation ||
    left.price !== right.price ||
    Boolean(left.isCustom) !== Boolean(right.isCustom)
  ) return false

  // Custom items should merge only when the actual saved artwork is identical.
  return !left.isCustom || JSON.stringify(left.customDesign ?? null) === JSON.stringify(right.customDesign ?? null)
}

const createCartLineId = () => `cart-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { coupons, addOrder: storeAddOrder } = useStoreData()

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('teecraft_cart')
      if (!saved) return []
      const parsed: unknown = JSON.parse(saved)
      if (!Array.isArray(parsed)) return []
      // Older versions seeded these two demo items into new carts. Drop only that exact seed.
      if (parsed.length === 2 && parsed[0]?.id === 'cart-1' && parsed[1]?.id === 'cart-2') return []
      return parsed.filter(isCartItem).map(item => item.isCustom && !item.productId ? { ...item, productId: 'custom-design' } : item)
    } catch {
      return []
    }
  })

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    return null
  })

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('teecraft_orders_local_v2')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('teecraft_cart', JSON.stringify(cartItems))
    } catch {
      // ignore
    }
  }, [cartItems])

  useEffect(() => {
    try {
      localStorage.setItem('teecraft_orders_local_v2', JSON.stringify(orders))
    } catch {
      // ignore
    }
  }, [orders])

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => isSameCartLine(item, newItem))
      if (existingIdx > -1) {
        return prev.map((item, index) => index === existingIdx
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item)
      }
      const uniqueItem = prev.some(item => item.id === newItem.id)
        ? { ...newItem, id: createCartLineId() }
        : newItem
      return [uniqueItem, ...prev]
    })
  }

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id)
      return
    }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item))
  }

  const clearCart = () => {
    setCartItems([])
    setAppliedCoupon(null)
  }

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase()
    const activeCoupons = coupons && coupons.length > 0 ? coupons : DEFAULT_COUPONS
    const found = activeCoupons.find(c => c.code === cleanCode && c.isActive !== false)
    if (!found) {
      const activeExamples = activeCoupons.filter(c => c.isActive !== false).map(c => c.code).slice(0, 2).join(' or ')
      return { success: false, message: `Invalid or inactive coupon. Try ${activeExamples || 'TEECRAFT100'}` }
    }
    const currentSubtotal = cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0)
    if (currentSubtotal < found.minSpend) {
      return { success: false, message: `Minimum order value of ₹${found.minSpend} required for this coupon.` }
    }
    setAppliedCoupon(found)
    return { success: true, message: `Coupon "${cleanCode}" applied successfully!` }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
  }

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  
  let calculatedDiscount = 0
  if (appliedCoupon && subtotal >= appliedCoupon.minSpend) {
    if (appliedCoupon.discountAmount) {
      calculatedDiscount = appliedCoupon.discountAmount
    } else if (appliedCoupon.discountPercent) {
      calculatedDiscount = Math.round((subtotal * appliedCoupon.discountPercent) / 100)
    }
  }

  const deliveryFee = subtotal > 499 || subtotal === 0 || (appliedCoupon?.code === 'FREESHIP' && subtotal >= appliedCoupon.minSpend) ? 0 : 49
  const total = Math.max(0, subtotal - calculatedDiscount + deliveryFee)
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const placeOrder = (orderDetails: Omit<Order, 'orderId' | 'date' | 'estimatedDelivery'>, orderId?: string): Order => {
    const randomId = orderId || `TC-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
    const today = new Date()
    const delivery = new Date(today)
    delivery.setDate(delivery.getDate() + 4) // 4 days delivery across India

    const fullOrder: Order = {
      ...orderDetails,
      orderId: randomId,
      date: today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      estimatedDelivery: delivery.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    }

    setOrders(prev => [fullOrder, ...prev])
    try {
      storeAddOrder(fullOrder)
    } catch {
      // fallback
    }
    clearCart()

    return fullOrder
  }

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      subtotal,
      discount: calculatedDiscount,
      deliveryFee,
      total,
      totalCount,
      orders,
      placeOrder
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}

