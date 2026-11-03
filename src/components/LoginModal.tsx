import React, { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Mail, Smartphone, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const isPhoneOtpDemo = import.meta.env.DEV && import.meta.env.VITE_DEMO_PHONE_OTP === 'true'

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { sendOtp, verifyOtp } = useAuth()
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [value, setValue] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)

  useEffect(() => {
    if (!sent || resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds(seconds => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [sent, resendSeconds])

  const closeAndReset = () => {
    setSent(false)
    setCode('')
    setValue('')
    setError('')
    setResendSeconds(0)
    onClose()
  }

  if (!isOpen) return null

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (method === 'phone' && !/^\d{10}$/.test(value)) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    setBusy(true)
    try {
      await sendOtp(method, value.trim())
      setSent(true)
      setResendSeconds(60)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send the code.')
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const expectedLength = method === 'email' ? 8 : 6
    if (!new RegExp(`^\\d{${expectedLength}}$`).test(code)) {
      setError(`Enter the ${expectedLength}-digit OTP.`)
      return
    }
    setBusy(true)
    try {
      await verifyOtp(method, value.trim(), code)
      closeAndReset()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That code could not be verified.')
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (resendSeconds > 0 || busy) return
    setBusy(true)
    setError('')
    try {
      await sendOtp(method, value.trim())
      setCode('')
      setResendSeconds(60)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not resend the code.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) closeAndReset() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="login-title" className="my-6 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-2">
            {sent && <button onClick={() => { setSent(false); setCode(''); setError('') }} aria-label="Back" className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"><ArrowLeft size={19} /></button>}
            <div><p className="text-xs font-bold uppercase tracking-widest text-neutral-400">TeeCraft account</p><h2 id="login-title" className="mt-1 text-xl font-black">{sent ? 'Verify your code' : 'Log in or sign up'}</h2></div>
          </div>
          <button onClick={closeAndReset} aria-label="Close login" className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"><X size={20} /></button>
        </header>

        <div className="space-y-5 p-6">
          {!sent ? <>
            <p className="text-sm leading-6 text-neutral-600">Sign in to access your order history, saved address, and designs. You can browse the store without signing in.</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
              <button type="button" onClick={() => { setMethod('email'); setValue(''); setError('') }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${method === 'email' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}><Mail size={16} /> Email OTP</button>
              <button type="button" onClick={() => { setMethod('phone'); setValue(''); setError('') }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${method === 'phone' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}><Smartphone size={16} /> Mobile OTP</button>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              {method === 'email' ? <label className="block text-xs font-bold text-neutral-700">Email address<input type="email" autoComplete="email" required value={value} onChange={event => setValue(event.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-neutral-900" /></label> : <label className="block text-xs font-bold text-neutral-700">10-digit mobile number<div className="mt-1.5 flex overflow-hidden rounded-xl border border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-900"><span className="border-r border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-500">+91</span><input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} required pattern="[0-9]{10}" value={value} onChange={event => setValue(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className="min-w-0 flex-1 px-3 py-3 text-sm font-normal outline-none" /></div></label>}
              {method === 'phone' && isPhoneOtpDemo && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Local demo mode accepts any six-digit code.</p>}
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}{method === 'phone' && isPhoneOtpDemo ? 'Continue with demo code' : 'Send one-time code'}</button>
            </form>
          </> : <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-neutral-600">Enter the {method === 'email' ? 'eight-digit' : 'six-digit'} code sent to <strong className="text-neutral-900">{method === 'phone' ? `+91 ${value}` : value}</strong>. For email, also check your spam folder.</p>
            {method === 'phone' && isPhoneOtpDemo && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Any six digits work in local demo mode. Online payments still require real verification.</p>}
            <label className="block text-xs font-bold text-neutral-700">One-time code<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={method === 'email' ? 8 : 6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, method === 'email' ? 8 : 6))} placeholder={method === 'email' ? '00000000' : '000000'} className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-3 text-center text-lg tracking-[0.4em] outline-none focus:ring-2 focus:ring-neutral-900" /></label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}Verify and sign in</button>
            <button type="button" onClick={() => void handleResend()} disabled={busy || resendSeconds > 0} className="w-full text-sm font-semibold text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-400">{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend code'}</button>
          </form>}
        </div>
      </section>
    </div>
  )
}
