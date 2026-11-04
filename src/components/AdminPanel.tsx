import React, { useState, useMemo, FormEvent, useEffect } from 'react'
import {
  ArrowLeft,
  Box,
  BriefcaseBusiness,
  ClipboardList,
  Edit3,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Shirt,
  Tag,
  Trash2,
  Copy,
  CheckCircle2,
  RotateCcw,
  LogOut
} from 'lucide-react'
import { useStoreData } from '../context/StoreDataContext'
import { Product, Coupon, Order, TShirtSize } from '../types'
import { TShirtCanvas } from './TShirtCanvas'
import { useAuth } from '../context/AuthContext'
import { getSupabaseClient } from '../lib/supabase'
import { LoginModal } from './LoginModal'

interface AdminPanelProps {
  onBackToStore?: () => void
}

type AdminTab = 'overview' | 'products' | 'coupons' | 'orders' | 'inquiries' | 'settings'

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)

const PRESET_SAMPLE_IMAGES = [
  { label: 'Astronaut Graphic', url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Boyfriend Fit Female', url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Abstract Topography', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
  { label: 'Japanese Wave', url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
  { label: 'Urban Minimalist', url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80' }
]

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore }) => {
  const { isAuthenticated, isLoading: isAuthLoading, userId, email: signedInEmail, signOut } = useAuth()
  const [isAccessChecking, setIsAccessChecking] = useState(true)
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null)
  const [accessError, setAccessError] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isEmailCodeOpen, setIsEmailCodeOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const {
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
    updateOrderStatus,
    bulkInquiries,
    updateInquiryStatus,
    deleteInquiry
  } = useStoreData()

  useEffect(() => {
    let active = true
    const checkAdminAccess = async () => {
      if (isAuthLoading) return
      if (!isAuthenticated || !userId) {
        if (active) {
          setAuthorizedUserId(null)
          setAccessError('Sign in with your owner email and password.')
          setIsAccessChecking(false)
        }
        return
      }

      const client = getSupabaseClient()
      if (!client) {
        if (active) {
          setAuthorizedUserId(null)
          setAccessError('Admin access requires Supabase authentication to be configured.')
          setIsAccessChecking(false)
        }
        return
      }

      try {
        const { data, error } = await client
          .from('admin_users')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle()

        if (!active) return
        setAuthorizedUserId(data && !error ? userId : null)
        setAccessError(error ? 'Could not verify admin access. Check the admin_users table and RLS policy.' : data ? '' : 'This account is not authorized for the admin panel. Sign in with the owner account.')
      } catch {
        if (!active) return
        setAuthorizedUserId(null)
        setAccessError('Could not verify admin access. Please try again.')
      } finally {
        if (active) setIsAccessChecking(false)
      }
    }

    void checkAdminAccess()
    return () => { active = false }
  }, [isAuthenticated, isAuthLoading, userId])

  const signInOwner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const client = getSupabaseClient()
    if (!client) {
      setLoginError('Supabase is not configured for this site.')
      return
    }

    setIsSigningIn(true)
    setLoginError('')
    try {
      const { data: signInData, error } = await client.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      })
      if (error) {
        setLoginError(error.message === 'Invalid login credentials'
          ? 'Email or password was rejected. If this owner account uses email codes, choose “Sign in with email code” below.'
          : error.message)
        return
      }

      setLoginPassword('')
      if (!signInData.user) {
        setLoginError('Supabase did not return a signed-in account. Please try again.')
        return
      }

      const { data: adminRow, error: roleError } = await client
        .from('admin_users')
        .select('user_id')
        .eq('user_id', signInData.user.id)
        .maybeSingle()
      if (roleError) setLoginError('Password accepted, but admin access could not be verified. Check the admin_users policy.')
      else if (!adminRow) setLoginError('Password accepted, but this account is not the authorized owner in admin_users.')
    } catch {
      setLoginError('Could not sign in. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      setAuthorizedUserId(null)
      setLoginError('')
    } catch {
      showToast('Could not sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  // --- Product Management State ---
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('All')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  const [productForm, setProductForm] = useState<{
    name: string
    category: Product['category']
    price: number
    originalPrice: number
    imageUrl: string
    backImageUrl: string
    description: string
    colors: string[]
    availableSizes: TShirtSize[]
    patternCoverage: ('Front' | 'Back' | 'All Over')[]
    modelType: 'flat' | 'male-model' | 'female-model'
    fitBadge: Product['fitBadge']
    isBestseller: boolean
    isNewArrival: boolean
    isCustomizableBase: boolean
    tags: string
    inStock: boolean
  }>({
    name: '',
    category: 'Oversized',
    price: 499,
    originalPrice: 1199,
    imageUrl: PRESET_SAMPLE_IMAGES[0].url,
    backImageUrl: '',
    description: '',
    colors: ['#121212', '#FFFFFF', '#374151'],
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    patternCoverage: ['Front'],
    modelType: 'flat',
    fitBadge: 'Oversized',
    isBestseller: false,
    isNewArrival: true,
    isCustomizableBase: false,
    tags: 'streetwear, graphic, oversized',
    inStock: true
  })

  // --- Coupon Management State ---
  const [couponSearch, setCouponSearch] = useState('')
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null)

  const [couponForm, setCouponForm] = useState<{
    code: string
    discountType: 'flat' | 'percentage'
    discountValue: number
    minSpend: number
    description: string
    isActive: boolean
  }>({
    code: '',
    discountType: 'flat',
    discountValue: 100,
    minSpend: 499,
    description: '₹100 flat discount on orders above ₹499',
    isActive: true
  })

  // --- Orders Filter State ---
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('All')
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)

  // --- Computed Analytics ---
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.paymentStatus === 'Paid' || o.orderStatus === 'Delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  }, [orders])

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus || '')).length
  }, [orders])

  const activeCouponsCount = useMemo(() => {
    return coupons.filter(c => c.isActive !== false).length
  }, [coupons])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(productSearch.toLowerCase())) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
      const matchesCategory = productCategoryFilter === 'All' || p.category === productCategoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, productSearch, productCategoryFilter])

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      return (
        c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(couponSearch.toLowerCase())
      )
    })
  }, [coupons, couponSearch])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = orderSearch.toLowerCase()
      const matchesSearch =
        o.orderId.toLowerCase().includes(q) ||
        (o.shippingDetails?.fullName || '').toLowerCase().includes(q) ||
        (o.shippingDetails?.email || '').toLowerCase().includes(q)
      const matchesStatus = orderStatusFilter === 'All' || o.orderStatus === orderStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, orderSearch, orderStatusFilter])

  // --- Handlers: Product ---
  const openNewProductModal = () => {
    setEditingProductId(null)
    setProductForm({
      name: '',
      category: 'Oversized',
      price: 499,
      originalPrice: 1199,
      imageUrl: PRESET_SAMPLE_IMAGES[0].url,
      backImageUrl: '',
      description: 'Heavyweight premium streetwear tee crafted with organic combed cotton.',
      colors: ['#121212', '#FFFFFF', '#374151'],
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      patternCoverage: ['Front'],
      modelType: 'flat',
      fitBadge: 'Oversized',
      isBestseller: false,
      isNewArrival: true,
      isCustomizableBase: false,
      tags: 'streetwear, graphic, oversized',
      inStock: true
    })
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (p: Product) => {
    setEditingProductId(p.id)
    setProductForm({
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.imageUrl,
      backImageUrl: p.backImageUrl || '',
      description: p.description,
      colors: p.colors,
      availableSizes: p.availableSizes,
      patternCoverage: p.patternCoverage,
      modelType: p.modelType || 'flat',
      fitBadge: p.fitBadge || 'Oversized',
      isBestseller: Boolean(p.isBestseller),
      isNewArrival: Boolean(p.isNewArrival),
      isCustomizableBase: Boolean(p.isCustomizableBase),
      tags: p.tags.join(', '),
      inStock: p.inStock ?? true
    })
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault()
    if (!productForm.name.trim()) return

    const discountPercent = Math.max(
      0,
      Math.round(((productForm.originalPrice - productForm.price) / productForm.originalPrice) * 100)
    )

    const parsedTags = productForm.tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean)

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice),
        discountPercent,
        imageUrl: productForm.imageUrl,
        backImageUrl: productForm.backImageUrl || undefined,
        description: productForm.description,
        colors: productForm.colors,
        availableSizes: productForm.availableSizes,
        patternCoverage: productForm.patternCoverage,
        modelType: productForm.modelType,
        fitBadge: productForm.fitBadge,
        isBestseller: productForm.isBestseller,
        isNewArrival: productForm.isNewArrival,
        isCustomizableBase: productForm.isCustomizableBase,
        tags: parsedTags,
        inStock: productForm.inStock
      })
      showToast(`Updated product "${productForm.name}"`)
    } else {
      addProduct({
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice),
        discountPercent,
        rating: 4.8,
        reviewsCount: 12,
        imageUrl: productForm.imageUrl,
        backImageUrl: productForm.backImageUrl || undefined,
        description: productForm.description,
        colors: productForm.colors,
        availableSizes: productForm.availableSizes,
        patternCoverage: productForm.patternCoverage,
        modelType: productForm.modelType,
        fitBadge: productForm.fitBadge,
        isBestseller: productForm.isBestseller,
        isNewArrival: productForm.isNewArrival,
        isCustomizableBase: productForm.isCustomizableBase,
        tags: parsedTags,
        inStock: productForm.inStock
      })
      showToast(`Added new product "${productForm.name}"`)
    }
    setIsProductModalOpen(false)
  }

  // --- Handlers: Coupon ---
  const openNewCouponModal = () => {
    setEditingCouponCode(null)
    setCouponForm({
      code: '',
      discountType: 'flat',
      discountValue: 100,
      minSpend: 499,
      description: '₹100 flat discount on orders above ₹499',
      isActive: true
    })
    setIsCouponModalOpen(true)
  }

  const openEditCouponModal = (c: Coupon) => {
    setEditingCouponCode(c.code)
    const isPerc = c.discountType === 'percentage' || Boolean(c.discountPercent)
    setCouponForm({
      code: c.code,
      discountType: isPerc ? 'percentage' : 'flat',
      discountValue: isPerc ? (c.discountPercent || 20) : (c.discountAmount || 100),
      minSpend: c.minSpend,
      description: c.description,
      isActive: c.isActive !== false
    })
    setIsCouponModalOpen(true)
  }

  const handleSaveCoupon = (e: FormEvent) => {
    e.preventDefault()
    if (!couponForm.code.trim()) return

    const cleanCode = couponForm.code.trim().toUpperCase()
    const isPerc = couponForm.discountType === 'percentage'

    if (editingCouponCode) {
      updateCoupon(editingCouponCode, {
        code: cleanCode,
        discountType: couponForm.discountType,
        discountAmount: !isPerc ? Number(couponForm.discountValue) : undefined,
        discountPercent: isPerc ? Number(couponForm.discountValue) : undefined,
        minSpend: Number(couponForm.minSpend),
        description: couponForm.description,
        isActive: couponForm.isActive
      })
      showToast(`Updated coupon code ${cleanCode}`)
    } else {
      addCoupon({
        code: cleanCode,
        discountType: couponForm.discountType,
        discountAmount: !isPerc ? Number(couponForm.discountValue) : undefined,
        discountPercent: isPerc ? Number(couponForm.discountValue) : undefined,
        minSpend: Number(couponForm.minSpend),
        description: couponForm.description,
        isActive: couponForm.isActive,
        usageCount: 0
      })
      showToast(`Created new coupon ${cleanCode}`)
    }
    setIsCouponModalOpen(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast(`Copied "${text}" to clipboard!`)
  }

  const handleBack = () => {
    if (onBackToStore) {
      onBackToStore()
    } else {
      window.location.href = '/'
    }
  }

  if (isAuthLoading || (isAccessChecking && userId)) {
    return <div className="min-h-screen bg-neutral-950 text-white grid place-items-center">Checking admin access…</div>
  }

  if (!userId || authorizedUserId !== userId) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-5">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
          <ShieldCheck className="text-emerald-300 mb-5" size={40} />
          <h1 className="text-2xl font-black">Owner sign in</h1>
          <p className="mt-3 text-sm text-neutral-400">{accessError}</p>
          {signedInEmail && <p className="mt-2 text-xs text-neutral-500">Currently signed in as {signedInEmail}. You can switch accounts below.</p>}
          <form onSubmit={signInOwner} className="mt-6 space-y-4">
            <label className="block text-sm text-neutral-300">Email
              <input type="email" autoComplete="username" required value={loginEmail} onChange={event => setLoginEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            </label>
            <label className="block text-sm text-neutral-300">Password
              <input type="password" autoComplete="current-password" required value={loginPassword} onChange={event => setLoginPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            </label>
            {loginError && <p role="alert" className="text-sm text-red-400">{loginError}</p>}
            <button type="submit" disabled={isSigningIn} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-900 disabled:opacity-50">{isSigningIn ? 'Signing in…' : 'Sign in to admin'}</button>
          </form>
          <button type="button" onClick={() => { setLoginError(''); setIsEmailCodeOpen(true) }} className="mt-4 text-sm text-emerald-300 hover:text-emerald-200">Sign in with email code instead</button>
          <button onClick={onBackToStore || (() => { window.location.href = '/' })} className="mt-5 text-sm text-neutral-400 hover:text-white">Back to store</button>
        </div>
        <LoginModal isOpen={isEmailCodeOpen} onClose={() => setIsEmailCodeOpen(false)} />
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#181a1f] text-white flex flex-col md:flex-row antialiased selection:bg-white selection:text-black">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-neutral-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-spring-pop border border-neutral-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 md:sticky md:top-0 md:h-screen bg-[#20242b] border-b md:border-b-0 md:border-r border-white/10 p-5 md:p-6 shrink-0 flex flex-col justify-between">
        <div>
          {/* Back button */}
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Storefront</span>
          </button>

          {/* Logo & Badge */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-white">TeeCraft</h2>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Admin Console</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="mt-6 flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'overview' as AdminTab, label: 'Overview', icon: Box, count: null },
              { id: 'products' as AdminTab, label: 'Products', icon: Shirt, count: products.length },
              { id: 'coupons' as AdminTab, label: 'Coupons & Offers', icon: Tag, count: activeCouponsCount },
              { id: 'orders' as AdminTab, label: 'Customer Orders', icon: ClipboardList, count: orders.length },
              { id: 'inquiries' as AdminTab, label: 'Bulk Inquiries', icon: BriefcaseBusiness, count: bulkInquiries.length },
              { id: 'settings' as AdminTab, label: 'Store Defaults', icon: RefreshCw, count: null }
            ].map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-black text-white' : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Owner account and sign out */}
        <div className="mt-5 pt-5 border-t border-white/10 text-xs text-neutral-500">
          {signedInEmail && <p className="truncate text-neutral-400" title={signedInEmail}>{signedInEmail}</p>}
          <button type="button" onClick={() => void handleSignOut()} disabled={isSigningOut} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 font-bold text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
            <LogOut className="h-4 w-4" />
            <span>{isSigningOut ? 'Signing out…' : 'Log out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-7 md:p-9 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 sticky top-0 z-20 bg-[#181a1f]/95 backdrop-blur-md">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
              Management Suite
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 capitalize">
              {activeTab === 'overview' && 'Store Dashboard'}
              {activeTab === 'products' && 'Product Catalog'}
              {activeTab === 'coupons' && 'Coupons & Promo Codes'}
              {activeTab === 'orders' && 'Orders Manager'}
              {activeTab === 'inquiries' && 'Corporate & Bulk Inquiries'}
              {activeTab === 'settings' && 'Store Tools & Defaults'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {activeTab === 'products' && (
              <button
                onClick={openNewProductModal}
                className="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-neutral-200 active:scale-95 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}

            {activeTab === 'coupons' && (
              <button
                onClick={openNewCouponModal}
                className="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-neutral-200 active:scale-95 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            )}

            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 bg-white/10 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-white/20 active:scale-95 transition-all border border-white/10"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Store</span>
            </button>
          </div>
        </div>

        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 mt-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#22262d] border border-white/10 rounded-2xl p-4 sm:p-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Total Revenue
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2">
                  {currency(totalRevenue)}
                </p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">Paid / Completed</p>
              </div>

              <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Orders
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2">{orders.length}</p>
                <p className="text-xs text-neutral-400 font-semibold mt-1">
                  {pendingOrdersCount} in progress
                </p>
              </div>

              <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Catalog Products
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2">{products.length}</p>
                <p className="text-xs text-neutral-400 font-semibold mt-1">
                  {products.filter(p => p.inStock !== false).length} in stock
                </p>
              </div>

              <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Active Coupons
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2">{activeCouponsCount}</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">Live in checkout</p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-[#252a32] border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-white">Quick Management Actions</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Update your catalog, create promotional codes or review recent orders.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveTab('products')
                    openNewProductModal()
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-neutral-200 transition"
                >
                  + Add New T-Shirt
                </button>
                <button
                  onClick={() => {
                    setActiveTab('coupons')
                    openNewCouponModal()
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-extrabold hover:bg-white/20 transition border border-white/10"
                >
                  + New Coupon Code
                </button>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-[#22262d] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-white">Recent Orders</h3>
                  <p className="text-xs text-neutral-400">Latest customer purchases across India</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-neutral-300 hover:text-white hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-neutral-400 text-sm">
                  No orders placed yet. Add items to cart on the store and checkout to see them here!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-neutral-400 font-bold uppercase text-[11px] tracking-wider">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.orderId} className="hover:bg-white/5">
                          <td className="py-3 font-mono font-bold text-white">{order.orderId}</td>
                          <td className="py-3">
                            <p className="font-semibold text-white">
                              {order.shippingDetails?.fullName || 'Guest Customer'}
                            </p>
                            <p className="text-[11px] text-neutral-400">
                              {order.shippingDetails?.city || 'India'}
                            </p>
                          </td>
                          <td className="py-3 text-neutral-300">
                            {order.items?.length || 0} items
                          </td>
                          <td className="py-3 font-bold text-white">{currency(order.total)}</td>
                          <td className="py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                order.orderStatus === 'Delivered'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : order.orderStatus === 'Shipped'
                                  ? 'bg-sky-500/20 text-sky-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {order.orderStatus || 'Processing'}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => {
                                setSelectedOrderDetails(order)
                                setActiveTab('orders')
                              }}
                              className="text-xs text-neutral-300 hover:text-white underline font-semibold"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Bulk Inquiries */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-white">Corporate & Bulk Requests</h3>
                  <p className="text-xs text-neutral-400">Wholesale quotes submitted through the Bulk Order page</p>
                </div>
                <button
                  onClick={() => setActiveTab('inquiries')}
                  className="text-xs font-bold text-neutral-300 hover:text-white hover:underline"
                >
                  Manage Inquiries →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bulkInquiries.slice(0, 4).map(inq => (
                  <div key={inq.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white">{inq.companyName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-bold uppercase">
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        {inq.contactPerson} · {inq.phone}
                      </p>
                      <p className="text-xs text-neutral-300 mt-2 font-medium">
                        {inq.pcsCount} pcs · {inq.tshirtType}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">{currency(inq.estimatedTotal)}</span>
                      <span className="text-neutral-500">{new Date(inq.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: PRODUCTS MANAGER ===================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 mt-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by title, tag, or category..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'T-Shirts', 'Oversized', 'Polo', 'Crop', 'Full Sleeve'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      productCategoryFilter === cat
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#22262d] border border-white/10 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-neutral-400 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">T-Shirt</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Discount</th>
                      <th className="py-3.5 px-4">Stock Status</th>
                      <th className="py-3.5 px-4">Tags & Flags</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.map(product => {
                      const isInStock = product.inStock !== false
                      return (
                        <tr key={product.id} className="hover:bg-white/5 transition-colors">
                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                {(product.imageUrl.startsWith('http') || product.imageUrl.startsWith('data:image/')) ? (
                                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <TShirtCanvas
                                    color={product.colors[0] || '#121212'}
                                    presetGraphicId={product.isCustomizableBase ? undefined : product.imageUrl}
                                    modelType={product.modelType || 'flat'}
                                    isCustomizableBase={product.isCustomizableBase}
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white text-sm truncate max-w-xs">{product.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {product.colors.map(col => (
                                    <span
                                      key={col}
                                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                                      style={{ backgroundColor: col }}
                                    />
                                  ))}
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    {product.availableSizes.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 font-semibold text-neutral-300">
                            {product.category}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 font-bold text-white">
                            ₹{product.price}
                            <span className="block text-[11px] text-neutral-500 line-through">
                              ₹{product.originalPrice}
                            </span>
                          </td>

                          {/* Discount */}
                          <td className="py-3 px-4">
                            <span className="text-xs font-black text-emerald-400">
                              {product.discountPercent}% OFF
                            </span>
                          </td>

                          {/* Stock Toggle */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                toggleProductStock(product.id)
                                showToast(
                                  `"${product.name}" marked as ${isInStock ? 'Out of Stock' : 'In Stock'}`
                                )
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all ${
                                isInStock
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isInStock ? 'bg-emerald-400' : 'bg-red-400'
                                }`}
                              />
                              <span>{isInStock ? 'In Stock' : 'Out of Stock'}</span>
                            </button>
                          </td>

                          {/* Tags & Flags */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {product.isBestseller && (
                                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Bestseller
                                </span>
                              )}
                              {product.isNewArrival && (
                                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  New
                                </span>
                              )}
                              {product.isCustomizableBase && (
                                <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  Custom Base
                                </span>
                              )}
                              {product.tags.slice(0, 2).map(tag => (
                                <span
                                  key={tag}
                                  className="bg-white/10 text-neutral-400 text-[10px] px-1.5 py-0.5 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openEditProductModal(product)}
                                className="p-2 rounded-lg bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20 transition"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                    deleteProduct(product.id)
                                    showToast(`Deleted product "${product.name}"`)
                                  }
                                }}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:text-red-200 hover:bg-red-500/20 transition"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: COUPONS & OFFERS ===================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 mt-6">
            {/* Coupon Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Total Coupons
                </span>
                <p className="text-3xl font-black text-white mt-1">{coupons.length}</p>
                <p className="text-xs text-neutral-400 mt-1">Configured in store engine</p>
              </div>

              <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Active in Checkout
                </span>
                <p className="text-3xl font-black text-emerald-400 mt-1">{activeCouponsCount}</p>
                <p className="text-xs text-neutral-400 mt-1">Customers can apply right now</p>
              </div>

              <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Total Redemptions
                </span>
                <p className="text-3xl font-black text-white mt-1">
                  {coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
                </p>
                <p className="text-xs text-neutral-400 mt-1">Orders with coupon savings</p>
              </div>
            </div>

            {/* Coupons List Header & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search coupons by code or description..."
                  value={couponSearch}
                  onChange={e => setCouponSearch(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              <button
                onClick={openNewCouponModal}
                className="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-neutral-200 transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Coupon</span>
              </button>
            </div>

            {/* Coupons Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCoupons.map(coupon => {
                const isActive = coupon.isActive !== false
                const isPerc = coupon.discountType === 'percentage' || Boolean(coupon.discountPercent)
                const discountDisplay = isPerc
                  ? `${coupon.discountPercent || 20}% OFF`
                  : coupon.discountAmount === 0
                  ? 'FREE SHIPPING'
                  : `₹${coupon.discountAmount} FLAT OFF`

                return (
                  <div
                    key={coupon.code}
                    className={`bg-[#141414] border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                      isActive ? 'border-white/10 hover:border-white/30' : 'border-white/5 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black px-3 py-1 bg-white text-black rounded-lg tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                            title="Copy Code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Active Toggle Switch */}
                        <button
                          onClick={() => {
                            toggleCouponActive(coupon.code)
                            showToast(
                              `Coupon ${coupon.code} is now ${isActive ? 'Inactive' : 'Active'}`
                            )
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      {/* Discount Meta */}
                      <div className="mt-4">
                        <p className="text-xl font-black text-white">{discountDisplay}</p>
                        <p className="text-xs text-neutral-400 mt-1 font-medium">
                          Min. spend: <span className="text-white font-bold">₹{coupon.minSpend}</span>
                        </p>
                        <p className="text-xs text-neutral-300 mt-2 bg-white/5 p-2 rounded-lg border border-white/5">
                          {coupon.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-semibold">
                        Used {coupon.usageCount || 0} times
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditCouponModal(coupon)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 text-neutral-300 hover:text-white text-xs font-bold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete coupon "${coupon.code}"?`)) {
                              deleteCoupon(coupon.code)
                              showToast(`Deleted coupon ${coupon.code}`)
                            }
                          }}
                          className="p-1 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-500/20 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: ORDERS MANAGER ===================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 mt-6">
            {/* Orders Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Order ID, customer name, email..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'New', 'Processing', 'In Production', 'Shipped', 'Delivered', 'Cancelled'].map(
                  st => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        orderStatusFilter === st
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 text-sm">
                  No orders found matching the filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-neutral-400 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3.5 px-4">Order ID & Date</th>
                        <th className="py-3.5 px-4">Customer Details</th>
                        <th className="py-3.5 px-4">Items Summary</th>
                        <th className="py-3.5 px-4">Total Amount</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4">Fulfillment Status</th>
                        <th className="py-3.5 px-4 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.map(order => (
                        <tr key={order.orderId} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-mono font-bold text-white text-sm">{order.orderId}</p>
                            <p className="text-[11px] text-neutral-400 mt-0.5">{order.date}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">
                              {order.shippingDetails?.fullName || 'Customer'}
                            </p>
                            <p className="text-[11px] text-neutral-400">
                              {order.shippingDetails?.email} · {order.shippingDetails?.phone}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate max-w-xs">
                              {order.shippingDetails?.city}, {order.shippingDetails?.state} - {order.shippingDetails?.pincode}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {order.items?.map((it, idx) => (
                                <p key={idx} className="text-xs text-neutral-300">
                                  {it.quantity}x {it.name} ({it.size}, {it.colorName})
                                </p>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-black text-white text-base">{currency(order.total)}</p>
                            {order.discount > 0 && (
                              <p className="text-[10px] text-emerald-400 font-semibold">
                                -{currency(order.discount)} coupon
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-neutral-300 text-xs">
                              {order.paymentMethod || 'Online'}
                            </span>
                            <span
                              className={`block text-[10px] font-bold ${
                                order.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {order.paymentStatus || 'Paid'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={order.orderStatus || 'Processing'}
                              onChange={e => {
                                updateOrderStatus(order.orderId, e.target.value)
                                showToast(`Order ${order.orderId} status changed to ${e.target.value}`)
                              }}
                              className="bg-[#1c1c1c] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-white"
                            >
                              <option value="New">New</option>
                              <option value="Processing">Processing</option>
                              <option value="In Production">In Production</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrderDetails(order)}
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: BULK INQUIRIES ===================== */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">Wholesale & Corporate Inquiries</h3>
                <p className="text-xs text-neutral-400">
                  Custom quote requests submitted from the Bulk Order page
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-neutral-300">
                {bulkInquiries.length} Inquiries
              </span>
            </div>

            <div className="space-y-4">
              {bulkInquiries.map(inq => (
                <div
                  key={inq.id}
                  className="bg-[#141414] border border-white/10 rounded-2xl p-5 sm:p-6 transition hover:border-white/20"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black text-white">{inq.companyName}</h4>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                            inq.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : inq.status === 'Quoted'
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300">
                        <span className="text-white font-bold">{inq.contactPerson}</span> · {inq.email} ·{' '}
                        {inq.phone}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                        <span>
                          Quantity: <strong className="text-white">{inq.pcsCount} Pieces</strong>
                        </span>
                        <span>
                          Type: <strong className="text-white">{inq.tshirtType}</strong>
                        </span>
                        <span>
                          Print: <strong className="text-white">{inq.printSides}</strong>
                        </span>
                      </div>

                      {inq.notes && (
                        <p className="text-xs text-neutral-400 bg-white/5 p-3 rounded-xl border border-white/5 mt-2">
                          "{inq.notes}"
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex flex-col md:items-end justify-between gap-3">
                      <div>
                        <p className="text-xl font-black text-emerald-400">
                          {currency(inq.estimatedTotal)}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Submitted {new Date(inq.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={inq.status}
                          onChange={e => {
                            updateInquiryStatus(inq.id, e.target.value)
                            showToast(`Updated status to ${e.target.value}`)
                          }}
                          className="bg-[#1c1c1c] border border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Quoted">Quoted</option>
                          <option value="Approved">Approved</option>
                          <option value="Closed">Closed</option>
                        </select>

                        <button
                          onClick={() => {
                            if (confirm('Delete this inquiry?')) {
                              deleteInquiry(inq.id)
                              showToast('Deleted inquiry')
                            }
                          }}
                          className="p-1.5 text-red-400 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 6: SETTINGS & TOOLS ===================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 mt-6 max-w-3xl">
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="font-black text-lg text-white">Store Database & State Management</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Manage the local reactive state and restore default sample catalog products or coupons at any time.
                </p>
              </div>

              <div className="border-t border-white/10 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Reset Product Catalog</h4>
                    <p className="text-xs text-neutral-400">
                      Restores all original 8+ streetwear t-shirt models and presets.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all products back to default factory seed?')) {
                        resetProductsToDefault()
                        showToast('Restored default product catalog!')
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-white transition border border-white/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Products</span>
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div>
                    <h4 className="font-bold text-sm text-white">Reset Coupons to Defaults</h4>
                    <p className="text-xs text-neutral-400">
                      Restores TEECRAFT100, FIRST50, FREESHIP, VIP50 discount codes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all coupons to default codes?')) {
                        resetCouponsToDefault()
                        showToast('Restored default coupons!')
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-white transition border border-white/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Coupons</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODAL: ADD / EDIT PRODUCT ===================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161616] border border-white/15 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">
                  {editingProductId ? 'Edit Product' : 'Add New T-Shirt'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Configure apparel details, pricing, colors, and mockups.
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Cyberpunk Astro Oversized Tee"
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={e =>
                      setProductForm({ ...productForm, category: e.target.value as Product['category'] })
                    }
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  >
                    <option value="Oversized">Oversized</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Polo">Polo</option>
                    <option value="Crop">Crop</option>
                    <option value="Full Sleeve">Full Sleeve</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Original Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.originalPrice}
                    onChange={e =>
                      setProductForm({ ...productForm, originalPrice: Number(e.target.value) })
                    }
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Discount
                  </label>
                  <div className="bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-400">
                    {Math.max(
                      0,
                      Math.round(
                        ((productForm.originalPrice - productForm.price) / productForm.originalPrice) * 100
                      )
                    )}
                    % OFF
                  </div>
                </div>
              </div>

              {/* Image URL & Preset Pickers */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Image URL / Graphic Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.imageUrl}
                  onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />

                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-neutral-200 hover:bg-white/10 cursor-pointer transition">
                    <span>Upload T-shirt image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={event => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = loadEvent => {
                          const imageUrl = loadEvent.target?.result
                          if (typeof imageUrl === 'string') {
                            setProductForm(current => ({ ...current, imageUrl }))
                          }
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-neutral-500">Use this to display the product photo in the storefront.</span>
                </div>

                {productForm.imageUrl.startsWith('data:image/') && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2">
                    <img src={productForm.imageUrl} alt="Uploaded T-shirt preview" className="h-16 w-16 rounded-lg object-cover" />
                    <span className="text-xs text-emerald-300 font-semibold">Uploaded image ready</span>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] text-neutral-400 font-semibold shrink-0">Sample Presets:</span>
                  {PRESET_SAMPLE_IMAGES.map(pre => (
                    <button
                      type="button"
                      key={pre.label}
                      onClick={() => setProductForm({ ...productForm, imageUrl: pre.url })}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-neutral-300 shrink-0"
                    >
                      {pre.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Fit Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Model Presentation
                  </label>
                  <select
                    value={productForm.modelType}
                    onChange={e =>
                      setProductForm({
                        ...productForm,
                        modelType: e.target.value as 'flat' | 'male-model' | 'female-model'
                      })
                    }
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  >
                    <option value="flat">Flat Silhouette Mockup</option>
                    <option value="male-model">Male Streetwear Model</option>
                    <option value="female-model">Female Boyfriend Model</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Fit Badge Label
                  </label>
                  <select
                    value={productForm.fitBadge || 'Oversized'}
                    onChange={e =>
                      setProductForm({
                        ...productForm,
                        fitBadge: e.target.value as Product['fitBadge']
                      })
                    }
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  >
                    <option value="Oversized">Oversized</option>
                    <option value="Boyfriend Fit">Boyfriend Fit</option>
                    <option value="Classic Fit">Classic Fit</option>
                    <option value="Boxy Heavyweight">Boxy Heavyweight</option>
                  </select>
                </div>
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['S', 'M', 'L', 'XL', 'XXL'] as TShirtSize[]).map(size => {
                    const isSelected = productForm.availableSizes.includes(size)
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => {
                          const updated = isSelected
                            ? productForm.availableSizes.filter(s => s !== size)
                            : [...productForm.availableSizes, size]
                          setProductForm({ ...productForm, availableSizes: updated })
                        }}
                        className={`w-10 h-10 rounded-xl text-xs font-extrabold transition ${
                          isSelected
                            ? 'bg-white text-black shadow'
                            : 'bg-[#202020] text-neutral-400 border border-white/10'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description & Tags */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={e => setProductForm({ ...productForm, tags: e.target.value })}
                  placeholder="oversized, streetwear, anime, graphic"
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={e => setProductForm({ ...productForm, inStock: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={productForm.isBestseller}
                    onChange={e => setProductForm({ ...productForm, isBestseller: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>Bestseller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={productForm.isNewArrival}
                    onChange={e => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>New Drop</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={productForm.isCustomizableBase}
                    onChange={e => setProductForm({ ...productForm, isCustomizableBase: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>Custom Base</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-white/10 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-neutral-300 text-xs font-bold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-neutral-200 transition shadow"
                >
                  {editingProductId ? 'Save Product Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD / EDIT COUPON ===================== */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">
                  {editingCouponCode ? 'Edit Coupon' : 'Create New Coupon'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Configure discount code rules and minimum spend.
                </p>
              </div>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FLASH30 or FLAT150"
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-white uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={e =>
                      setCouponForm({
                        ...couponForm,
                        discountType: e.target.value as 'flat' | 'percentage'
                      })
                    }
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  >
                    <option value="flat">Flat ₹ Off</option>
                    <option value="percentage">Percentage % Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Discount Value {couponForm.discountType === 'percentage' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={couponForm.discountValue}
                    onChange={e =>
                      setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })
                    }
                    className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Minimum Order Value (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={couponForm.minSpend}
                  onChange={e => setCouponForm({ ...couponForm, minSpend: Number(e.target.value) })}
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Coupon Description
                </label>
                <input
                  type="text"
                  required
                  value={couponForm.description}
                  onChange={e => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="e.g. ₹150 off on orders above ₹699"
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                  <input
                    type="checkbox"
                    checked={couponForm.isActive}
                    onChange={e => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span>Activate immediately for all customers</span>
                </label>
              </div>

              <div className="border-t border-white/10 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-neutral-300 text-xs font-bold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-neutral-200 transition shadow"
                >
                  {editingCouponCode ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ORDER DETAILS ===================== */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-white/15 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Order Details</h3>
                <p className="text-xs font-mono text-neutral-400">{selectedOrderDetails.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
              {/* Customer Info */}
              <div className="bg-[#202020] rounded-xl p-4 border border-white/5 space-y-1">
                <p className="font-bold text-white text-sm">
                  {selectedOrderDetails.shippingDetails?.fullName}
                </p>
                <p className="text-neutral-400">
                  {selectedOrderDetails.shippingDetails?.email} · {selectedOrderDetails.shippingDetails?.phone}
                </p>
                <p className="text-neutral-300">
                  {selectedOrderDetails.shippingDetails?.address}, {selectedOrderDetails.shippingDetails?.city},{' '}
                  {selectedOrderDetails.shippingDetails?.state} - {selectedOrderDetails.shippingDetails?.pincode}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="font-bold text-neutral-400 text-xs uppercase tracking-wider">Ordered Items</p>
                {selectedOrderDetails.items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#202020] border border-white/5"
                  >
                    <div>
                      <p className="font-bold text-white">{it.name}</p>
                      <p className="text-xs text-neutral-400">
                        Size: {it.size} · Color: {it.colorName} · Qty: {it.quantity}
                      </p>
                    </div>
                    <p className="font-black text-white">₹{it.price * it.quantity}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-white/10 pt-3 space-y-1.5 text-neutral-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{selectedOrderDetails.subtotal}</span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Discount</span>
                    <span>-₹{selectedOrderDetails.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{selectedOrderDetails.deliveryFee === 0 ? 'FREE' : `₹${selectedOrderDetails.deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                  <span>Total Amount</span>
                  <span>₹{selectedOrderDetails.total}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#121212] flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Payment: <strong className="text-white">{selectedOrderDetails.paymentStatus}</strong> via{' '}
                {selectedOrderDetails.paymentMethod}
              </span>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
