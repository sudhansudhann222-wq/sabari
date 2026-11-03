import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '../types'
import { PRODUCTS } from '../data/products'

interface WishlistContextType {
  wishlistIds: string[]
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  wishlistProducts: Product[]
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('teecraft_wishlist')
      return saved ? JSON.parse(saved) : ['tee-astronaut']
    } catch {
      return ['tee-astronaut']
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('teecraft_wishlist', JSON.stringify(wishlistIds))
    } catch {
      // ignore
    }
  }, [wishlistIds])

  const toggleWishlist = (productId: string) => {
    setWishlistIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  const isInWishlist = (productId: string) => wishlistIds.includes(productId)

  const wishlistProducts = PRODUCTS.filter(p => wishlistIds.includes(p.id))

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist, wishlistProducts }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}

