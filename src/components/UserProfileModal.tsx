import React, { useState, useEffect } from 'react'
import { X, User, Package, MapPin, CheckCircle2, Database, Palette, ArrowRight, LogOut } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { TShirtCanvas } from './TShirtCanvas'
import { isSupabaseConfigured, fetchSavedDesignsFromSupabase, fetchOrdersFromSupabase, SavedCustomDesign } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenLogin: () => void
  onOpenDatabaseSettings: () => void
  onLoadCustomDesign?: (design: SavedCustomDesign) => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenDatabaseSettings,
  onLoadCustomDesign
}) => {
  const { orders: localOrders } = useCart()
  const { isAuthenticated, email, phone, userId, isDemo, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'orders' | 'designs' | 'address'>('orders')
  const [savedDesigns, setSavedDesigns] = useState<SavedCustomDesign[]>([])
  const [loadedOrders, setLoadedOrders] = useState<{ userId: string; orders: typeof localOrders; error?: string } | null>(null)
  const isConnected = isSupabaseConfigured()
  const displayOrders = isAuthenticated && !isDemo && Boolean(userId) && loadedOrders && loadedOrders.userId === userId ? loadedOrders.orders : []
  const ordersLoading = isAuthenticated && !isDemo && loadedOrders?.userId !== userId
  const customer = displayOrders[0]?.shippingDetails

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    fetchSavedDesignsFromSupabase().then(designs => { if (mounted) setSavedDesigns(designs) })
    if (isAuthenticated && !isDemo && userId) {
      const ownerId = userId
      fetchOrdersFromSupabase().then(remoteOrders => {
        if (mounted) setLoadedOrders({ userId: ownerId, orders: remoteOrders })
      }).catch(error => {
        if (mounted) setLoadedOrders({ userId: ownerId, orders: [], error: error instanceof Error ? error.message : 'Could not load orders.' })
      })
    }
    return () => { mounted = false }
  }, [isOpen, isAuthenticated, isDemo, userId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8 flex flex-col max-h-[85vh] animate-spring-pop">
        
        {/* User Card Header */}
        <div className="p-6 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">{customer?.fullName || (isAuthenticated ? email || (phone ? `+91 ${phone}` : 'My Account') : 'Guest Profile')}</h2>
                {/* Supabase Status Chip */}
                <button
                  type="button"
                  onClick={onOpenDatabaseSettings}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
                  }`}
                  title="Configure Supabase Database"
                >
                  <Database className="w-3 h-3" />
                  <span>{isConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
                </button>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isAuthenticated ? `${email || (phone ? `+91 ${phone}` : 'Signed in')}${isDemo ? ' • Demo account' : ''}` : 'Guest account'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && <button onClick={() => void signOut()} title="Sign out" className="rounded-xl p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"><LogOut className="h-5 w-5" /></button>}
            <button onClick={onClose} className="rounded-xl p-1.5 text-neutral-400 transition hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 px-6 bg-neutral-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-6 whitespace-nowrap transition ${
              activeTab === 'orders'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            My Orders ({displayOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('designs')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-6 whitespace-nowrap transition ${
              activeTab === 'designs'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Saved Designs ({savedDesigns.length})
          </button>
          <button
            onClick={() => setActiveTab('address')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
              activeTab === 'address'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Saved Address
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Tab 1: Orders */}
          {activeTab === 'orders' && (
            !isAuthenticated ? (
              <div className="text-center py-14 space-y-3">
                <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="font-bold text-neutral-700">Sign in to see your orders</p>
                <p className="text-xs text-neutral-400">Your orders and address are private to your sign-in.</p>
                <button onClick={onOpenLogin} className="mt-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-800">Log in</button>
              </div>
            ) : isDemo ? (
              <div className="text-center py-14 space-y-2">
                <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="font-bold text-neutral-700">Demo sign-in has no saved order history</p>
                <p className="text-xs text-neutral-400">Use a verified email or mobile OTP to access saved orders.</p>
              </div>
            ) : ordersLoading ? (
              <div className="text-center py-14 text-sm text-neutral-500">Loading your orders…</div>
            ) : loadedOrders && loadedOrders.userId === userId && loadedOrders.error ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load orders: {loadedOrders.error}. Apply the updated Supabase admin setup SQL and try again.</div>
            ) : displayOrders.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="font-bold text-neutral-700">No orders yet</p>
                <p className="text-xs text-neutral-400">Orders placed while signed in will appear here.</p>
              </div>
            ) : (
              displayOrders.map(order => (
                <div
                  key={order.orderId}
                  className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 text-xs">
                    <div>
                      <span className="font-extrabold text-neutral-900 text-sm">{order.orderId}</span>
                      <span className="text-neutral-400 ml-2">• {order.date}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{order.orderStatus || 'In Production'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 p-1 shrink-0 overflow-hidden">
                          <TShirtCanvas
                            color={item.color}
                            presetGraphicId={item.previewImage}
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                          <p className="text-neutral-500">{item.colorName} • Size {item.size} • Qty {item.quantity}</p>
                        </div>
                        <span className="font-bold text-xs text-neutral-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Est. Delivery: <strong className="text-neutral-900">{order.estimatedDelivery}</strong></span>
                    <span className="text-sm font-extrabold text-neutral-900">Total: ₹{order.total}</span>
                  </div>
                </div>
              ))
            )
          )}

          {/* Tab 2: Saved Custom Designs (Supabase) */}
          {activeTab === 'designs' && (
            savedDesigns.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Palette className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="font-bold text-neutral-700">No saved custom designs yet</p>
                <p className="text-xs text-neutral-400">Design a T-shirt in the Studio and save it on this device.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedDesigns.map(design => (
                  <div
                    key={design.id}
                    className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="w-full aspect-square rounded-xl bg-white p-2 flex items-center justify-center border border-neutral-100">
                      <TShirtCanvas
                        color={design.color}
                        presetGraphicId={design.previewImage}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900">{design.name}</h4>
                      <p className="text-xs text-neutral-500">{design.tshirtType} • {design.colorName}</p>
                    </div>
                    {onLoadCustomDesign && (
                      <button
                        onClick={() => {
                          onLoadCustomDesign(design)
                          onClose()
                        }}
                        className="w-full py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition"
                      >
                        <span>Open in Studio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Tab 3: Saved Address */}
          {activeTab === 'address' && (customer ? (
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-700" />
                <span className="font-bold text-sm text-neutral-900">Primary Delivery Address</span>
              </div>
              <div className="text-xs text-neutral-600 space-y-1">
                <p className="font-bold text-neutral-900">{customer.fullName}</p>
                <p>{customer.address}</p>
                <p>{customer.city}, {customer.state} - {customer.pincode}</p>
                <p>Phone: +91 {customer.phone}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-2">
              <MapPin className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="font-bold text-neutral-700">No saved address</p>
              <p className="text-xs text-neutral-400">An address appears here after an order is placed on this device.</p>
            </div>
          ))}

        </div>

      </div>
    </div>
  )
}
