import React, { useState, useEffect, useRef } from 'react'
import { Search, Heart, ShoppingCart, User, Menu, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  currentTab: 'home' | 'shop' | 'customize' | 'bulk' | 'about' | 'cart'
  setCurrentTab: (tab: 'home' | 'shop' | 'customize' | 'bulk' | 'about' | 'cart') => void
  onOpenSearch: () => void
  onOpenWishlist: () => void
  onOpenProfile: () => void
  onOpenLogin: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSearch,
  onOpenWishlist,
  onOpenProfile,
  onOpenLogin
}) => {
  const { totalCount } = useCart()
  const { wishlistIds } = useWishlist()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Animation triggers for Cart & Wishlist badges and icons
  const [cartBouncing, setCartBouncing] = useState(false)
  const [heartBouncing, setHeartBouncing] = useState(false)
  const prevCountRef = useRef(totalCount)
  const prevWishlistRef = useRef(wishlistIds.length)

  useEffect(() => {
    if (totalCount !== prevCountRef.current) {
      setCartBouncing(true)
      const t = setTimeout(() => setCartBouncing(false), 700)
      prevCountRef.current = totalCount
      return () => clearTimeout(t)
    }
  }, [totalCount])

  useEffect(() => {
    if (wishlistIds.length !== prevWishlistRef.current) {
      setHeartBouncing(true)
      const t = setTimeout(() => setHeartBouncing(false), 700)
      prevWishlistRef.current = wishlistIds.length
      return () => clearTimeout(t)
    }
  }, [wishlistIds.length])

  const navLinks: { label: string; tab: 'shop' | 'customize' | 'bulk' | 'about' }[] = [
    { label: 'Shop', tab: 'shop' },
    { label: 'Customize', tab: 'customize' },
    { label: 'Bulk Order', tab: 'bulk' },
    { label: 'About', tab: 'about' }
  ]

  const handleNavClick = (tab: 'shop' | 'customize' | 'bulk' | 'about') => {
    setCurrentTab(tab)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo with micro bounce */}
          <div
            onClick={() => {
              setCurrentTab('home')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current transition-transform duration-300 group-hover:-translate-y-0.5" viewBox="0 0 24 24">
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-neutral-900 group-hover:text-black transition-colors">
              TeeCraft
            </span>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
            {navLinks.map(link => {
              const isActive = currentTab === link.tab
              return (
                <button
                  key={link.tab}
                  onClick={() => handleNavClick(link.tab)}
                  className={`text-sm font-semibold tracking-wide transition-all duration-200 relative py-2 ${
                    isActive ? 'text-neutral-900 font-bold' : 'text-neutral-600 hover:text-neutral-950 hover:-translate-y-0.5'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-neutral-900 rounded-full animate-spring-pop" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Action Icons (Animated Micro-interactions) */}
          <div className="flex items-center space-x-1.5 sm:space-x-3.5">
            {/* Search Icon */}
            <button
              onClick={onOpenSearch}
              className="p-2 sm:p-2.5 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/90 active:scale-90 rounded-full transition-all duration-200 group"
              aria-label="Search"
              title="Search collection"
            >
              <Search className="w-5 h-5 stroke-[2.2] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-115" />
            </button>

            {/* Wishlist Icon with Heart Animation and Pop Badge */}
            <button
              onClick={onOpenWishlist}
              className={`p-2 sm:p-2.5 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/90 active:scale-90 rounded-full transition-all duration-200 relative group ${
                heartBouncing ? 'animate-heart-pop' : ''
              }`}
              aria-label="Wishlist"
              title="Wishlist items"
            >
              <Heart
                className={`w-5 h-5 stroke-[2.2] transition-all duration-300 group-hover:scale-120 ${
                  wishlistIds.length > 0 ? 'fill-neutral-900 text-neutral-900' : 'group-hover:text-neutral-950'
                }`}
              />
              {wishlistIds.length > 0 && (
                <span
                  key={`wishlist-${wishlistIds.length}`}
                  className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-badge-pop ring-2 ring-white"
                >
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Cart Icon with Bounce Animation and Pop Badge */}
            <button
              onClick={() => {
                setCurrentTab('cart')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`p-2 sm:p-2.5 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/90 active:scale-90 rounded-full transition-all duration-200 relative group ${
                cartBouncing ? 'animate-cart-bounce' : ''
              }`}
              aria-label="Shopping Cart"
              title="Your Cart"
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.2] transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-115" />
              {totalCount > 0 && (
                <span
                  key={`cart-${totalCount}`}
                  className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-badge-pop ring-2 ring-white"
                >
                  {totalCount}
                </span>
              )}
            </button>

            {/* Explicit login or account action */}
            <button
              onClick={isAuthenticated ? onOpenProfile : onOpenLogin}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-extrabold text-neutral-900 shadow-sm transition hover:border-neutral-900 hover:bg-neutral-50 active:scale-95 sm:px-4 sm:text-sm"
              aria-label={isAuthenticated ? 'My account' : 'Log in'}
              title={isAuthenticated ? 'My account' : 'Log in or sign up'}
            >
              <User className="h-4 w-4" />
              <span>{isAuthLoading || isAuthenticated ? 'Account' : 'Log in'}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-neutral-700 hover:text-neutral-900 active:scale-90 rounded-lg transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white/95 backdrop-blur-md px-5 pt-3 pb-6 space-y-2 animate-fade-in-up shadow-xl">
          {navLinks.map(link => (
            <button
              key={link.tab}
              onClick={() => handleNavClick(link.tab)}
              className={`block w-full text-left py-3 text-base font-semibold rounded-xl transition-all duration-200 ${
                currentTab === link.tab
                  ? 'text-neutral-900 font-bold bg-neutral-100 pl-4 shadow-xs'
                  : 'text-neutral-600 pl-4 hover:bg-neutral-50 hover:text-neutral-950'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
