import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'

type AuthMethod = 'email' | 'phone'
type DemoUser = { method: 'phone'; phone: string }
const isPhoneOtpDemo = import.meta.env.DEV && import.meta.env.VITE_DEMO_PHONE_OTP === 'true'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  isDemo: boolean
  userId?: string
  email?: string
  phone?: string
  sendOtp: (method: AuthMethod, value: string) => Promise<void>
  verifyOtp: (method: AuthMethod, value: string, code: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const explainAuthError = (error: { message: string; code?: string; status?: number }) => {
  const message = error.message || ''
  if (/error sending (magic link|confirmation) email/i.test(message)) {
    return new Error('Supabase could not send the email. If using its built-in mailer, it only sends to project team addresses. Otherwise check that custom SMTP is enabled, the sender matches your Gmail account, and the SMTP password is a valid Google App Password.')
  }
  if (error.status === 504 || /gateway timeout|upstream.*timed out/i.test(message)) {
    return new Error('Supabase timed out while sending the email code. Check that SMTP is enabled and that the host, port, username, password, and sender email are correct. Then check Supabase Authentication → Logs for the provider error.')
  }
  if (error.status === 502 || error.status === 503) {
    return new Error('Supabase Auth or the email provider is temporarily unavailable. Check Supabase Authentication → Logs and try again shortly.')
  }
  if (/572006|invalid template name|trial accounts can only use predefined sms templates/i.test(`${error.code || ''} ${message}`)) {
    return new Error('Twilio trial accounts reject Supabase custom OTP SMS. Upgrade Twilio to send real login codes, or configure a Supabase test phone number and fixed OTP for development.')
  }
  if (/572005|destination phone number.*not verified|verified recipient/i.test(`${error.code || ''} ${message}`)) {
    return new Error('This phone number is not verified in your Twilio trial account. Verify it in Twilio Console, or upgrade Twilio to send OTPs to other numbers.')
  }
  return error
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = getSupabaseClient()
  const [session, setSession] = useState<Session | null>(null)
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(client))

  useEffect(() => {
    if (!client) return
    let mounted = true
    client.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) console.error('Could not restore Supabase session:', error.message)
      setSession(data.session)
    }).catch(error => {
      if (mounted) console.error('Could not restore Supabase session:', error)
    }).finally(() => {
      if (mounted) setIsLoading(false)
    })
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setDemoUser(null)
      setIsLoading(false)
    })
    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [client])

  const sendOtp = useCallback(async (method: AuthMethod, value: string) => {
    if (!client) throw new Error('Sign-in is unavailable because Supabase is not configured.')
    if (method === 'phone' && isPhoneOtpDemo) return
    const { error } = method === 'email'
      ? await client.auth.signInWithOtp({ email: value, options: { shouldCreateUser: true } })
      : await client.auth.signInWithOtp({ phone: `+91${value}`, options: { shouldCreateUser: true } })
    if (error) throw explainAuthError(error)
  }, [client])

  const verifyOtp = useCallback(async (method: AuthMethod, value: string, code: string) => {
    if (method === 'phone' && isPhoneOtpDemo) {
      if (!/^\d{6}$/.test(code)) throw new Error('Enter a six-digit demo OTP.')
      setDemoUser({ method: 'phone', phone: value })
      return
    }
    if (!client) throw new Error('Sign-in is unavailable because Supabase is not configured.')
    const { error } = method === 'email'
      ? await client.auth.verifyOtp({ email: value, token: code, type: 'email' })
      : await client.auth.verifyOtp({ phone: `+91${value}`, token: code, type: 'sms' })
    if (error) throw error
  }, [client])

  const signOut = useCallback(async () => {
    setDemoUser(null)
    if (session && client) {
      const { error } = await client.auth.signOut()
      if (error) throw error
    }
    setSession(null)
  }, [client, session])

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(session || demoUser),
    isLoading,
    isDemo: Boolean(demoUser),
    userId: session?.user.id,
    email: session?.user.email,
    phone: demoUser?.phone || session?.user.phone?.replace(/^\+91/, ''),
    sendOtp,
    verifyOtp,
    signOut
  }), [session, demoUser, isLoading, sendOtp, verifyOtp, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
