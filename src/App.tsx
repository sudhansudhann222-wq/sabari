import React, { Suspense, lazy, useState } from 'react'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ShopCollection } from './components/ShopCollection'
import { CartPage } from './components/CartPage'
import { CheckoutModal } from './components/CheckoutModal'
import { OrderSuccessModal } from './components/OrderSuccessModal'
import { WishlistModal } from './components/WishlistModal'
import { SearchModal } from './components/SearchModal'
import { UserProfileModal } from './components/UserProfileModal'
import { ProductDetailModal } from './components/ProductDetailModal'
import { BulkOrderPage } from './components/BulkOrderPage'
import { AboutPage } from './components/AboutPage'
import { Footer } from './components/Footer'
import { SupabaseModal } from './components/SupabaseModal'
import { Product, Order } from './types'
import { SavedCustomDesign } from './lib/supabase'
import { useLenis } from './hooks/useLenis'
import { PageTransition } from './components/animations/PageTransition'
import { AdminPanel } from './components/AdminPanel'
import { LoginModal } from './components/LoginModal'

const CustomizerStudio = lazy(() => import('./components/CustomizerStudio').then(module => ({ default: module.CustomizerStudio })))

export const AppContent: React.FC = () => {
  useLenis()
  const [currentTab, setCurrentTab] = useState<'home' | 'shop' | 'customize' | 'bulk' | 'about' | 'cart'>('home')

  // Modals and Selection state
  const [searchOpen, setSearchOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [supabaseOpen, setSupabaseOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [customizerProduct, setCustomizerProduct] = useState<Product | null>(null)
  const [customizerColor, setCustomizerColor] = useState<string | undefined>(undefined)
  const [customizerGraphicId, setCustomizerGraphicId] = useState<string | undefined>(undefined)

  const handleOpenCustomizeWithProduct = (product: Product) => {
    setCustomizerProduct(product)
    setCustomizerColor(product.colors[0])
    setCustomizerGraphicId(product.imageUrl)
    setCurrentTab('customize')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenCustomizeDirect = (color?: string, graphicId?: string) => {
    setCustomizerProduct(null)
    setCustomizerColor(color)
    setCustomizerGraphicId(graphicId)
    setCurrentTab('customize')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectProduct = (product: Product) => {
    setDetailProduct(product)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenLogin={() => setLoginOpen(true)}
      />

      {/* Main Container with smooth view transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        <PageTransition pageKey={currentTab}>
          {/* 1. Home / Hero Screen (Image 1) */}
          {currentTab === 'home' && (
            <Hero
              onCustomizeClick={(shirtColor, graphicId) => {
                handleOpenCustomizeDirect(shirtColor, graphicId)
              }}
              onShopClick={() => {
                setCurrentTab('shop')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onSelectProduct={handleSelectProduct}
              onQuickAddToCart={p => handleSelectProduct(p)}
            />
          )}

          {/* 2. Shop / T-Shirts Collection Screen (Image 2) */}
          {currentTab === 'shop' && (
            <ShopCollection
              onCustomizeDesign={handleOpenCustomizeWithProduct}
              onProductClick={handleSelectProduct}
            />
          )}

          {/* 3. Interactive Customizer Studio Screen (Image 3) */}
          {currentTab === 'customize' && (
            <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-sm text-neutral-500">Loading the design studio…</div>}>
            <CustomizerStudio
              key={`${customizerProduct?.id || 'studio'}-${customizerColor || 'def'}-${customizerGraphicId || 'def'}`}
              initialProduct={customizerProduct}
              initialColor={customizerColor}
              initialGraphicId={customizerGraphicId}
              onCartNavigate={() => {
                setCurrentTab('cart')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
            </Suspense>
          )}

          {/* 4. Cart & Order Summary Screen (Image 4) */}
          {currentTab === 'cart' && (
            <CartPage
              onBackToShop={() => {
                setCurrentTab('shop')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onProceedToCheckout={() => setCheckoutOpen(true)}
            />
          )}

          {/* 5. Bulk Order Page */}
          {currentTab === 'bulk' && (
            <BulkOrderPage />
          )}

          {/* 6. About Page */}
          {currentTab === 'about' && (
            <AboutPage />
          )}
        </PageTransition>

      </main>

      {/* Footer */}
      <Footer
        onNavClick={tab => {
          setCurrentTab(tab)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onCustomize={p => handleOpenCustomizeWithProduct(p)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={p => {
          setSearchOpen(false)
          handleSelectProduct(p)
        }}
      />

      {/* Wishlist Drawer Modal */}
      <WishlistModal
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onSelectProduct={p => {
          setWishlistOpen(false)
          handleSelectProduct(p)
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onOpenLogin={() => { setProfileOpen(false); setLoginOpen(true) }}
        onOpenDatabaseSettings={() => setSupabaseOpen(true)}
        onLoadCustomDesign={(design: SavedCustomDesign) => {
          setCustomizerProduct(null)
          setCustomizerColor(design.color)
          setCustomizerGraphicId(design.previewImage)
          setCurrentTab('customize')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* Supabase Database Settings Modal */}
      <SupabaseModal
        isOpen={supabaseOpen}
        onClose={() => setSupabaseOpen(false)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderCompleted={order => {
          setCheckoutOpen(false)
          setCompletedOrder(order)
        }}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
        onContinueShopping={() => {
          setCompletedOrder(null)
          setCurrentTab('shop')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onViewOrders={() => {
          setCompletedOrder(null)
          setProfileOpen(true)
        }}
      />

    </div>
  )
}

export default function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/admin') {
    return <AdminPanel />
  }

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  )
}
