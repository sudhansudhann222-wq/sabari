import React, { useState } from 'react'
import { X, Database, Check, AlertCircle, Copy, ExternalLink, RefreshCw, Key, Globe, Shield } from 'lucide-react'
import { isSupabaseConfigured, getSupabaseConfig, setSupabaseConfig, testSupabaseConnection } from '../lib/supabase'

interface SupabaseModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSupabaseConfig()
  const [url, setUrl] = useState(currentConfig.url)
  const [key, setKey] = useState(currentConfig.key)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copiedSql, setCopiedSql] = useState(false)
  const environmentConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

  if (!isOpen) return null

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTesting(true)
    setTestResult(null)

    const result = await testSupabaseConnection(url, key)
    setTestResult(result)
    setIsTesting(false)

    if (result.success) {
      setSupabaseConfig(url, key)
    }
  }

  const handleCopySqlInstructions = () => {
    setCopiedSql(true)
    navigator.clipboard.writeText(`-- Run schema.sql from the supabase/ folder in your project!`)
    setTimeout(() => setCopiedSql(false), 2500)
  }

  const isConfigured = isSupabaseConfigured()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-neutral-200 overflow-hidden my-8 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">Supabase Database</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-xs font-semibold text-neutral-500">
                  {isConfigured ? 'Connected & Live' : 'Local Storage Mode (Ready to Connect)'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-600 space-y-2">
          <p className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Real-time Cloud Backend for TeeCraft</span>
          </p>
          <p>
            Connect your free Supabase project to persist orders, products, custom T-shirt creations, and bulk inquiries in PostgreSQL tables with Row-Level Security.
          </p>
          {environmentConfigured && <p className="rounded-lg bg-blue-50 p-2 text-blue-800">This app uses the Supabase project configured in `.env`. Update the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values there, then restart the dev server to switch projects.</p>}
          <div className="pt-1 flex items-center gap-3">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-neutral-900 hover:underline"
            >
              <span>Open Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500">Schema file at: <code className="bg-neutral-200 px-1 py-0.5 rounded text-[10px]">supabase/schema.sql</code></span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-neutral-500" />
              <span>Project URL</span>
            </label>
            <input
              type="url"
              required
              disabled={environmentConfigured}
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Found in: Project Settings → API → Project URL
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-neutral-500" />
              <span>Anon Public Key</span>
            </label>
            <input
              type="password"
              required
              disabled={environmentConfigured}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={e => setKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Found in: Project Settings → API → Project API Keys → anon / public
            </span>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {testResult.success ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isTesting || environmentConfigured}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{environmentConfigured ? 'Configured by .env' : isTesting ? 'Verifying...' : 'Save & Test Connection'}</span>
            </button>

            {isConfigured && !environmentConfigured && (
              <button
                type="button"
                onClick={() => {
                  setSupabaseConfig('', '')
                  setUrl('')
                  setKey('')
                  setTestResult({ success: true, message: 'Switched back to local storage mode.' })
                }}
                className="w-full sm:w-auto px-4 py-3.5 rounded-2xl border border-neutral-300 hover:border-neutral-900 text-neutral-700 font-bold text-xs transition"
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        {/* Database Tables & Schema Guide */}
        <div className="pt-4 border-t border-neutral-100 space-y-2">
          <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Connected Database Tables
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-900 block">📦 public.products</span>
              <span className="text-[11px] text-neutral-500">T-Shirt catalog & prices</span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-900 block">🛍️ public.orders</span>
              <span className="text-[11px] text-neutral-500">Live checkouts & tracking</span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-900 block">🎨 public.custom_designs</span>
              <span className="text-[11px] text-neutral-500">User created Studio tees</span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-900 block">📑 public.bulk_inquiries</span>
              <span className="text-[11px] text-neutral-500">Corporate quote requests</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

