import React, { useState } from 'react'
import { X, Check } from 'lucide-react'

interface FooterProps {
  onNavClick: (tab: 'shop' | 'customize' | 'bulk' | 'about') => void
  onOpenProfile: () => void
}

export const Footer: React.FC<FooterProps> = ({ onNavClick, onOpenProfile }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [infoModalTitle, setInfoModalTitle] = useState<string | null>(null)
  const [infoModalContent, setInfoModalContent] = useState<string | null>(null)

  const handleOpenInfo = (title: string, content: string) => {
    setInfoModalTitle(title)
    setInfoModalContent(content)
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterSubscribed(true)
    setTimeout(() => {
      setNewsletterEmail('')
      setNewsletterSubscribed(false)
    }, 4000)
  }

  return (
    <footer className="bg-white border-t border-neutral-200 mt-20 pt-16 pb-12 text-neutral-600 text-sm">
      {/* Informational Dialog */}
      {infoModalTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-neutral-900">{infoModalTitle}</h3>
              <button onClick={() => setInfoModalTitle(null)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
              {infoModalContent}
            </div>
            <button
              onClick={() => setInfoModalTitle(null)}
              className="w-full py-3 rounded-2xl bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-neutral-100">
          
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <div
              onClick={() => onNavClick('shop')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-neutral-900">
                TeeCraft
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
              Custom oversized streetwear & graphic apparel made easy. 240 GSM organic combed cotton, Japanese HD direct-to-garment printing, and swift delivery across India.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavClick('shop')} className="hover:text-neutral-900 transition">
                  T-Shirts Collection
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('customize')} className="hover:text-neutral-900 transition">
                  Customizer Studio
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('bulk')} className="hover:text-neutral-900 transition">
                  Bulk & Corporate Orders
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('about')} className="hover:text-neutral-900 transition">
                  About Our Craft
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Assistance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={onOpenProfile} className="hover:text-neutral-900 transition text-left">
                  Track Your Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenInfo(
                    'Shipping & Express Delivery',
                    '• Metro Cities (Bengaluru, Mumbai, Delhi, Chennai, Hyderabad): 2 - 3 business days.\n• Rest of India: 4 - 5 business days.\n• Free Shipping on all orders above ₹499.\n• Real-time SMS and WhatsApp dispatch notifications sent with AWB tracking number.'
                  )}
                  className="hover:text-neutral-900 transition text-left"
                >
                  Shipping & Delivery Times
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenInfo(
                    '7-Day Easy Returns & Exchanges',
                    'We want you to love your tee!\n• If the size does not fit or print is defective, request a free doorstep exchange within 7 days of delivery.\n• Unworn garments with original tags qualify for instant replacement or 100% store credit.'
                  )}
                  className="hover:text-neutral-900 transition text-left"
                >
                  Returns & Exchanges (7 Days)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleOpenInfo(
                    'Garment Care & Wash Guide',
                    'To keep your TeeCraft DTG print crisp for years:\n1. Machine wash cold (below 30°C) inside out.\n2. Wash with similar dark/light colors.\n3. Do not iron directly on the printed artwork (iron on reverse side).\n4. Tumble dry low or line dry in shade.'
                  )}
                  className="hover:text-neutral-900 transition text-left"
                >
                  Garment Wash & Care Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Get ₹100 Off</h4>
            <p className="text-xs text-neutral-500">Subscribe for secret drops and coupon codes.</p>
            {newsletterSubscribed ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Coupon TEECRAFT100 unlocked!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition"
                >
                  Join
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} TeeCraft India Apparel Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span
              onClick={() => handleOpenInfo('Privacy Policy', 'Your personal information is encrypted with 256-bit SSL security. We never sell your data or share it with third parties.')}
              className="cursor-pointer hover:text-neutral-600"
            >
              Privacy Policy
            </span>
            <span
              onClick={() => handleOpenInfo('Terms of Service', 'By ordering with TeeCraft, you agree to our standard manufacturing and fulfillment terms. Custom artwork must respect third-party copyright laws.')}
              className="cursor-pointer hover:text-neutral-600"
            >
              Terms of Service
            </span>
            <span
              onClick={() => handleOpenInfo('Payment Security', 'All credit cards, debit cards, UPI mandates, and NetBanking transactions are routed through RBI-compliant, PCI-DSS certified gateways.')}
              className="cursor-pointer hover:text-neutral-600"
            >
              Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

