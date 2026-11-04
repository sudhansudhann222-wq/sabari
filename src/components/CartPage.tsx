import React, { useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { ArrowLeft, Trash2, Tag, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { TShirtCanvas } from './TShirtCanvas'
import { LottieFeedback } from './animations/LottieFeedback'

interface CartPageProps {
  onBackToShop: () => void
  onProceedToCheckout: () => void
}

export const CartPage: React.FC<CartPageProps> = ({
  onBackToShop,
  onProceedToCheckout
}) => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    subtotal,
    discount,
    deliveryFee,
    total,
    totalCount
  } = useCart()

  const [cartListRef] = useAutoAnimate<HTMLDivElement>()
  const [couponInput, setCouponInput] = useState('')
  const [couponFeedback, setCouponFeedback] = useState<{ text: string; error?: boolean } | null>(null)

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return

    const res = applyCoupon(couponInput)
    setCouponFeedback({
      text: res.message,
      error: !res.success
    })
    if (res.success) {
      setCouponInput('')
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-16 text-center shadow-xs animate-fade-in-up">
        <LottieFeedback type="empty-cart" className="w-28 h-28 mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Your Cart is Empty</h2>
        <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
          Explore our trending streetwear designs or design your very own custom graphic tee.
        </p>
        <button
          onClick={onBackToShop}
          className="shine-button mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-neutral-900 text-white font-bold text-sm shadow hover:bg-neutral-800 active:scale-95 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Collection</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Cart Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onBackToShop}
          className="p-2 -ml-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <h1 className="text-xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Your Cart <span className="font-semibold text-neutral-500 text-lg sm:text-xl">({totalCount} Items)</span>
        </h1>
      </div>

      {/* Main Cart Grid: Left Items + Right Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* LEFT COLUMN: Cart Items & Coupon */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Items List with Smooth AutoAnimate additions/removals */}
          <div ref={cartListRef} className="space-y-3">
            {cartItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs hover:border-neutral-300 transition"
              >
                {/* Product Thumbnail & Details Top (Mobile Friendly) */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-xl bg-neutral-100/70 p-1 flex items-center justify-center shrink-0 overflow-hidden border border-neutral-200/50">
                    <TShirtCanvas
                      color={item.color}
                      presetGraphicId={item.previewImage}
                      viewMode={item.printLocation?.includes('Back') ? 'back' : 'front'}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between sm:block">
                      <h3 className="font-extrabold text-neutral-900 text-sm sm:text-base leading-tight truncate">
                        {item.name}
                      </h3>
                      {/* Mobile delete button inside header */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="sm:hidden p-1 text-neutral-400 hover:text-red-500 rounded-lg transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.8]" />
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-500 mt-1 space-y-0.5">
                      <p>
                        Color: <span className="font-semibold text-neutral-800">{item.colorName}</span> | Size: <span className="font-semibold text-neutral-800">{item.size}</span>
                      </p>
                      <p>
                        Print: <span className="font-semibold text-neutral-800">{item.printLocation}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row on Mobile (Stepper + Price + Desktop Delete) */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 shrink-0">
                  {/* Quantity Stepper (- 1 +) */}
                  <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-0.5 shrink-0 shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-75 font-bold transition-all duration-150 text-xs sm:text-sm"
                    >
                      -
                    </button>
                    <span className="w-7 sm:w-8 text-center font-bold text-xs sm:text-sm text-neutral-900 select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-75 font-bold transition-all duration-150 text-xs sm:text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Price Item Total */}
                  <div className="text-right shrink-0">
                    <p className="text-base sm:text-lg font-extrabold text-neutral-900">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>

                  {/* Desktop Trash Delete Action */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="hidden sm:block p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 active:scale-75 rounded-lg transition-all duration-200 shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.8]" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Apply Coupon Box */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-neutral-700 stroke-[2]" />
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Apply Coupon
              </span>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-3 border border-neutral-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs bg-neutral-900 text-white px-2 py-0.5 rounded">
                      {appliedCoupon.code}
                    </span>
                    {subtotal >= appliedCoupon.minSpend ? (
                      <span className="text-xs font-bold text-emerald-600">Applied</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Add ₹{appliedCoupon.minSpend - subtotal} more to unlock
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{appliedCoupon.description}</p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Enter coupon code (try TEECRAFT100)"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition"
                >
                  Apply
                </button>
              </form>
            )}

            {couponFeedback && (
              <p className={`text-xs mt-2 font-medium ${couponFeedback.error ? 'text-red-500' : 'text-emerald-600'}`}>
                {couponFeedback.text}
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-7 shadow-xs space-y-6">
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            Order Summary
          </h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between text-neutral-600 font-medium">
              <span>Subtotal ({totalCount} items)</span>
              <span className="text-neutral-900 font-bold">₹{subtotal}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Discount</span>
                <span className="text-neutral-900 font-bold">-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-600 font-medium">
              <span>Delivery</span>
              <span className="text-neutral-900 font-bold">
                {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
              </span>
            </div>

            <div className="border-t border-neutral-200/80 pt-4 flex justify-between items-baseline">
              <span className="text-lg font-extrabold text-neutral-900">Total</span>
              <span className="text-2xl font-extrabold text-neutral-900">₹{total}</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onProceedToCheckout}
            className="shine-button w-full py-3.5 sm:py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-200 active:scale-95 group"
          >
            <span>Proceed to Payment</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          {/* Security & Payment methods trust info */}
          <div className="border-t border-neutral-100 pt-5 text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800">
              <ShieldCheck className="w-4 h-4 text-neutral-700" />
              <span>Secure & Encrypted Payment</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">
              UPI &nbsp;|&nbsp; Cards &nbsp;|&nbsp; NetBanking &nbsp;|&nbsp; Wallets
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
