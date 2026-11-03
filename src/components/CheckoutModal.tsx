import React, { useEffect, useState } from 'react'
import { X, ShieldCheck, QrCode, CreditCard, Landmark, Banknote, ArrowLeft, Loader2, Mail, Smartphone } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Order } from '../types'
import confetti from 'canvas-confetti'
import { createCheckoutOrder, loadRazorpay, verifyRazorpayPayment } from '../lib/razorpay'
import { useAuth } from '../context/AuthContext'

const isPhoneOtpDemo = import.meta.env.DEV && import.meta.env.VITE_DEMO_PHONE_OTP === 'true'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCompleted: (order: Order) => void
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderCompleted
}) => {
  const { cartItems, appliedCoupon, subtotal, discount, deliveryFee, total, placeOrder } = useCart()
  const { isAuthenticated, isLoading: isAuthLoading, isDemo, sendOtp, verifyOtp } = useAuth()

  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping')
  const step = isAuthLoading || !isAuthenticated ? 'login' : checkoutStep
  const [isProcessing, setIsProcessing] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [authValue, setAuthValue] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)

  // Shipping Form
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi')
  const [upiId, setUpiId] = useState('')

  useEffect(() => {
    if (!otpSent || resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds(seconds => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [otpSent, resendSeconds])

  if (!isOpen) return null

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCheckoutStep('payment')
  }

  const handleClose = () => {
    setCheckoutStep('shipping')
    setOtpSent(false)
    setOtpCode('')
    setResendSeconds(0)
    onClose()
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (authMethod === 'phone' && !/^\d{10}$/.test(authValue)) {
      setAuthError('Enter a valid 10-digit mobile number.')
      return
    }
    setAuthBusy(true)
    try {
      await sendOtp(authMethod, authValue.trim())
      setOtpSent(true)
      setResendSeconds(60)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not send the OTP.')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || authBusy) return
    setAuthBusy(true)
    setAuthError('')
    try {
      await sendOtp(authMethod, authValue.trim())
      setOtpCode('')
      setResendSeconds(60)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not resend the OTP.')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const expectedLength = authMethod === 'email' ? 8 : 6
    if (!new RegExp(`^\\d{${expectedLength}}$`).test(otpCode)) {
      setAuthError(`Enter the ${expectedLength}-digit OTP.`)
      return
    }
    setAuthBusy(true)
    try {
      await verifyOtp(authMethod, authValue.trim(), otpCode)
      setShippingForm(current => ({
        ...current,
        email: authMethod === 'email' ? authValue.trim() : current.email,
        phone: authMethod === 'phone' ? authValue.trim() : current.phone
      }))
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'That OTP could not be verified.')
    } finally {
      setAuthBusy(false)
    }
  }

  const handlePayNow = async () => {
    setIsProcessing(true)
    try {
      if (paymentMethod === 'cod') {
        if (isDemo) {
          const demoOrder = placeOrder({ items: cartItems, subtotal, discount, deliveryFee, total, shippingDetails: shippingForm, paymentMethod: 'Cash on Delivery (Demo)', paymentStatus: 'Pending (COD)' })
          onOrderCompleted(demoOrder)
          return
        }
        const checkout = await createCheckoutOrder({ paymentMethod: 'cod', items: cartItems, couponCode: appliedCoupon?.code, expectedTotal: total, shippingDetails: shippingForm })
        const newOrder = placeOrder({ items: cartItems, subtotal: checkout.subtotal, discount: checkout.discount, deliveryFee: checkout.deliveryFee, total: checkout.amount, shippingDetails: shippingForm, paymentMethod: 'Cash on Delivery', paymentStatus: 'Pending (COD)' }, checkout.orderId)
        onOrderCompleted(newOrder)
        return
      }
      if (isDemo) throw new Error('The local demo sign-in cannot authorize online payment. Sign in with a verified email or mobile OTP.')

      const loaded = await loadRazorpay()
      if (!loaded || !window.Razorpay) throw new Error('Razorpay Checkout could not be loaded.')
      const checkout = await createCheckoutOrder({ paymentMethod: 'razorpay', items: cartItems, couponCode: appliedCoupon?.code, expectedTotal: total, shippingDetails: shippingForm })
      if (!checkout.razorpayOrderId || !checkout.keyId) throw new Error('The server did not return the Razorpay payment details.')

      new window.Razorpay({
        key: checkout.keyId,
        amount: Math.round(checkout.amount * 100),
        currency: checkout.currency,
        name: 'TeeCraft',
        description: 'TeeCraft order payment',
        order_id: checkout.razorpayOrderId,
        prefill: { name: shippingForm.fullName, email: shippingForm.email, contact: shippingForm.phone },
        notes: { address: shippingForm.address },
        theme: { color: '#171717' },
        modal: { ondismiss: () => setIsProcessing(false) },
        handler: async payment => {
          try {
            const verified = await verifyRazorpayPayment(payment)
            const newOrder = placeOrder({ items: cartItems, subtotal: checkout.subtotal, discount: checkout.discount, deliveryFee: checkout.deliveryFee, total: checkout.amount, shippingDetails: shippingForm, paymentMethod: `Razorpay (${payment.razorpay_payment_id})`, paymentStatus: 'Paid' }, verified.orderId)
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
            onOrderCompleted(newOrder)
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Payment verification failed.')
          } finally { setIsProcessing(false) }
        }
      }).open()
    } catch (error) {
      setIsProcessing(false)
      window.alert(error instanceof Error ? error.message : 'Unable to start payment.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-spring-pop">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
              {step === 'payment' && (
              <button
                onClick={() => setCheckoutStep('shipping')}
                className="p-1 -ml-1 text-neutral-500 hover:text-neutral-900 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-extrabold text-neutral-900">
              {step === 'login' ? 'Sign in to continue' : step === 'shipping' ? 'Shipping Information' : 'Choose Payment Method'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 'login' ? (
            <div className="space-y-5">
              {isAuthLoading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking your sign-in…</div> : <>
                <p className="text-sm text-neutral-600">You can browse the store without an account. Sign in to continue to checkout.</p>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
                  <button type="button" onClick={() => { setAuthMethod('email'); setOtpSent(false); setAuthError('') }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${authMethod === 'email' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><Mail size={16} /> Email OTP</button>
                  <button type="button" onClick={() => { setAuthMethod('phone'); setOtpSent(false); setAuthError('') }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${authMethod === 'phone' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><Smartphone size={16} /> Mobile OTP</button>
                </div>
                {!otpSent ? <form onSubmit={handleSendOtp} className="space-y-4">
                  {authMethod === 'email' ? <label className="block text-xs font-bold text-neutral-700">Email address<input type="email" autoComplete="email" required value={authValue} onChange={event => setAuthValue(event.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-neutral-900" /></label> : <label className="block text-xs font-bold text-neutral-700">10-digit mobile number<div className="mt-1.5 flex overflow-hidden rounded-xl border border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-900"><span className="border-r border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-500">+91</span><input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} required pattern="[0-9]{10}" value={authValue} onChange={event => setAuthValue(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className="min-w-0 flex-1 px-3 py-3 text-sm font-normal outline-none" /></div></label>}
                  {authMethod === 'phone' && isPhoneOtpDemo && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Local demo: any six-digit code will sign in. Turn off demo mode to test Twilio SMS.</p>}
                  {authError && <p role="alert" className="text-sm text-red-600">{authError}</p>}
                  <button disabled={authBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">{authBusy && <Loader2 className="h-4 w-4 animate-spin" />}{authMethod === 'phone' && isPhoneOtpDemo ? 'Continue with demo OTP' : 'Send one-time code'}</button>
                </form> : <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-sm text-neutral-600">Enter the {authMethod === 'email' ? 'eight-digit' : 'six-digit'} code sent to <strong className="text-neutral-900">{authMethod === 'phone' ? `+91 ${authValue}` : authValue}</strong>.</p>
                  {authMethod === 'phone' && isPhoneOtpDemo && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Demo mode accepts any six digits.</p>}
                  <label className="block text-xs font-bold text-neutral-700">One-time code<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={authMethod === 'email' ? 8 : 6} required value={otpCode} onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, authMethod === 'email' ? 8 : 6))} placeholder={authMethod === 'email' ? '••••••••' : '••••••'} className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-center text-lg tracking-[0.4em] outline-none focus:ring-2 focus:ring-neutral-900" /></label>
                  {authError && <p role="alert" className="text-sm text-red-600">{authError}</p>}
                  <button disabled={authBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">{authBusy && <Loader2 className="h-4 w-4 animate-spin" />}Verify and continue</button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setAuthError(''); setResendSeconds(0) }} className="w-full text-sm font-semibold text-neutral-500 hover:text-neutral-900">Change {authMethod === 'phone' ? 'mobile number' : 'email'}</button>
                  <button type="button" onClick={() => void handleResendOtp()} disabled={authBusy || resendSeconds > 0} className="w-full text-sm font-semibold text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-400">{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend code'}</button>
                </form>}
              </>}
            </div>
          ) : step === 'shipping' ? (
            /* Step 1: Shipping Address Form */
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.fullName}
                    onChange={e => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Phone (+91)</label>
                  <input
                    type="tel"
                    required
                    value={shippingForm.phone}
                    onChange={e => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={shippingForm.email}
                  onChange={e => setShippingForm({ ...shippingForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Delivery Street Address</label>
                <textarea
                  required
                  rows={2}
                  value={shippingForm.address}
                  onChange={e => setShippingForm({ ...shippingForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.city}
                    onChange={e => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.state}
                    onChange={e => setShippingForm({ ...shippingForm, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={shippingForm.pincode}
                    onChange={e => setShippingForm({ ...shippingForm, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-100">
                <div className="flex sm:block justify-between items-baseline">
                  <p className="text-xs text-neutral-500">Payable Amount</p>
                  <p className="text-xl font-extrabold text-neutral-900">₹{total}</p>
                </div>
                <button
                  type="submit"
                  className="shine-button w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white font-bold text-sm shadow hover:shadow-lg transition-all duration-200"
                >
                  Continue to Payment →
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Payment Selection */
            <div className="space-y-5">
              {isDemo && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">You are using the local demo sign-in. Cash on Delivery is available for testing; online payments require a verified OTP.</p>}
              <div className="space-y-2.5">
                
                {/* UPI Option */}
                <div
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    paymentMethod === 'upi'
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral-900">UPI Instant Payment</p>
                      <p className="text-xs text-neutral-500">Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-neutral-900"
                  />
                </div>

                {/* Cards Option */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral-900">Credit / Debit Card</p>
                      <p className="text-xs text-neutral-500">Visa, Mastercard, RuPay</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-neutral-900"
                  />
                </div>

                {/* NetBanking Option */}
                <div
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    paymentMethod === 'netbanking'
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral-900">Net Banking</p>
                      <p className="text-xs text-neutral-500">HDFC, SBI, ICICI, Axis & more</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'netbanking'}
                    onChange={() => setPaymentMethod('netbanking')}
                    className="accent-neutral-900"
                  />
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral-900">Cash on Delivery (COD)</p>
                      <p className="text-xs text-neutral-500">Pay when your tee arrives</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-neutral-900"
                  />
                </div>

              </div>

              {/* UPI ID input if UPI is selected */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-2">
                  <label className="font-bold text-neutral-700 block">Enter UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  />
                  <p className="text-neutral-500 text-[11px]">Instant UPI mandate approval requested on your app.</p>
                </div>
              )}

              {/* Pay Now Button */}
              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex sm:block justify-between items-baseline">
                  <p className="text-xs text-neutral-500">Total Bill</p>
                  <p className="text-2xl font-extrabold text-neutral-900">₹{total}</p>
                </div>
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  className="shine-button w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:bg-neutral-600 text-white font-bold text-sm shadow-md hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <span>Pay ₹{total} Now</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-Bit Bank Grade SSL Encryption</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

