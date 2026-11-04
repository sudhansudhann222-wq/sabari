import React, { useState } from 'react'
import { Building2, CheckCircle, Calculator, Send } from 'lucide-react'
import { submitBulkInquiryToSupabase } from '../lib/supabase'
import { useStoreData } from '../context/StoreDataContext'

export const BulkOrderPage: React.FC = () => {
  const { addBulkInquiry } = useStoreData()
  const [pcsCount, setPcsCount] = useState(50)
  const [tshirtType, setTshirtType] = useState('Oversized 240 GSM')
  const [printSides, setPrintSides] = useState<'single' | 'both'>('single')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form inputs
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    notes: ''
  })

  // Tiered pricing calculation
  const getPerUnitRate = (count: number) => {
    let base = 499
    if (count >= 100) base = 249 // 50% off
    else if (count >= 50) base = 299 // 40% off
    else if (count >= 20) base = 349 // 30% off
    
    if (printSides === 'both') base += 50
    return base
  }

  const unitRate = getPerUnitRate(pcsCount)
  const estimatedTotal = unitRate * pcsCount
  const savings = (499 * pcsCount) - estimatedTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const inquiryPayload = {
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      pcsCount,
      tshirtType,
      printSides,
      estimatedTotal,
      notes: form.notes,
      status: 'New'
    }

    try {
      addBulkInquiry(inquiryPayload)
    } catch {
      // local store
    }

    await submitBulkInquiryToSupabase(inquiryPayload)

    setIsSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Bulk Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold">
          <Building2 className="w-3.5 h-3.5" />
          <span>Corporate & College Merch</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight">
          Bulk Orders Made Seamless
        </h1>
        <p className="text-neutral-500 text-sm sm:text-base">
          Custom merchandise for startups, university fests, hackathons, and corporate teams with tier-volume discounts up to 55% off.
        </p>
      </div>

      {/* Pricing Tiers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 text-center space-y-3 shadow-xs">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Starter Tier</span>
          <h3 className="text-2xl font-extrabold text-neutral-900">20 - 49 Pieces</h3>
          <p className="text-3xl font-extrabold text-neutral-900">₹349 <span className="text-xs font-normal text-neutral-500">/ tee</span></p>
          <p className="text-xs text-emerald-600 font-bold">Save 30% Off Regular</p>
          <ul className="text-xs text-neutral-600 space-y-2 pt-3 border-t border-neutral-100 text-left">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-neutral-900" /> Free digital mockups</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-neutral-900" /> Standard 5-day dispatch</li>
          </ul>
        </div>

        <div className="bg-neutral-900 text-white rounded-3xl p-6 text-center space-y-3 shadow-xl relative ring-2 ring-neutral-900">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-neutral-900 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-sm">
            Most Popular
          </span>
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Growth Tier</span>
          <h3 className="text-2xl font-extrabold text-white">50 - 99 Pieces</h3>
          <p className="text-3xl font-extrabold text-white">₹299 <span className="text-xs font-normal text-neutral-400">/ tee</span></p>
          <p className="text-xs text-emerald-400 font-bold">Save 40% Off Regular</p>
          <ul className="text-xs text-neutral-300 space-y-2 pt-3 border-t border-neutral-800 text-left">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-white" /> Free physical sample</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-white" /> Custom neck tag branding</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-white" /> Dedicated account manager</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 text-center space-y-3 shadow-xs">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Enterprise Tier</span>
          <h3 className="text-2xl font-extrabold text-neutral-900">100+ Pieces</h3>
          <p className="text-3xl font-extrabold text-neutral-900">₹249 <span className="text-xs font-normal text-neutral-500">/ tee</span></p>
          <p className="text-xs text-emerald-600 font-bold">Save 55% Off Regular</p>
          <ul className="text-xs text-neutral-600 space-y-2 pt-3 border-t border-neutral-100 text-left">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-neutral-900" /> Free doorstep sample kit</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-neutral-900" /> Custom individual packaging</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-neutral-900" /> Priority 48-hour delivery</li>
          </ul>
        </div>
      </div>

      {/* Instant Calculator & Quote Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calculator */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-neutral-700" />
            <h3 className="font-extrabold text-lg text-neutral-900">Instant Estimate</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                <span>Quantity</span>
                <span className="text-neutral-900 font-extrabold text-sm">{pcsCount} Tees</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={pcsCount}
                onChange={e => setPcsCount(Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Fabric Choice</label>
              <select
                value={tshirtType}
                onChange={e => setTshirtType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-none"
              >
                <option value="Oversized 240 GSM">Oversized 240 GSM French Terry</option>
                <option value="Regular 190 GSM">Classic Crewneck 190 GSM Combed</option>
                <option value="Polo 260 GSM">Honeycomb Pique Polo 260 GSM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Print Placement</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPrintSides('single')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                    printSides === 'single' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white border-neutral-200'
                  }`}
                >
                  Front Only
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSides('both')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                    printSides === 'both' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white border-neutral-200'
                  }`}
                >
                  Front + Back
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Per Unit Price</span>
                <span className="font-bold text-neutral-900">₹{unitRate}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>Total Savings</span>
                <span>-₹{savings}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Estimated Total</span>
                <span className="text-xl">₹{estimatedTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          {submitted ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-neutral-900">Quotation Request Received!</h3>
              <p className="text-neutral-500 text-sm max-w-md mx-auto">
                Our team will prepare a 3D digital mockup and email you the official quotation within 2 business hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold"
              >
                Send Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-extrabold text-lg text-neutral-900">Submit Your Inquiry</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp / IIT Madras"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Phone (+91)</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Order Notes / Custom Requests</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about the logo placement, delivery deadline, or special packaging..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow transition"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting to Supabase...' : 'Request Official Quotation'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

