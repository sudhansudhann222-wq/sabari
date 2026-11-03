import React from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { X, Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { TShirtCanvas } from './TShirtCanvas'
import { Product } from '../types'
import { LottieFeedback } from './animations/LottieFeedback'

interface WishlistModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (product: Product) => void
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct
}) => {
  const { wishlistProducts, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [wishlistListRef] = useAutoAnimate<HTMLDivElement>()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 overflow-hidden animate-spring-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-neutral-900 text-neutral-900 animate-heart-pop" />
            <h2 className="text-xl font-extrabold text-neutral-900">
              Saved Wishlist ({wishlistProducts.length})
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-900 active:scale-90 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with AutoAnimate on removals */}
        <div ref={wishlistListRef} className="flex-1 overflow-y-auto py-4 space-y-3">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <LottieFeedback type="empty-cart" className="w-24 h-24 mx-auto" />
              <p className="font-bold text-neutral-700">No items in your wishlist</p>
              <p className="text-xs text-neutral-400">Save designs you like while browsing our collection.</p>
            </div>
          ) : (
            wishlistProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 hover:border-neutral-300 transition"
              >
                <div
                  className="w-16 h-16 rounded-xl bg-neutral-200/50 p-1 shrink-0 cursor-pointer overflow-hidden"
                  onClick={() => {
                    onClose()
                    onSelectProduct(product)
                  }}
                >
                  <TShirtCanvas
                    color={product.colors[0]}
                    presetGraphicId={product.imageUrl}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => {
                      onClose()
                      onSelectProduct(product)
                    }}
                    className="font-bold text-sm text-neutral-900 truncate cursor-pointer hover:underline"
                  >
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-extrabold text-sm text-neutral-900">₹{product.price}</span>
                    <span className="text-xs text-neutral-400 line-through">₹{product.originalPrice}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      addToCart({
                        id: `cart-${product.id}-${Date.now()}`,
                        productId: product.id,
                        name: product.name,
                        tshirtType: product.category === 'Oversized' ? 'Oversized T-Shirt' : 'Regular T-Shirt',
                        color: product.colors[0],
                        colorName: 'Standard',
                        size: 'L',
                        quantity: 1,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        discountPercent: product.discountPercent,
                        printLocation: product.patternCoverage[0] || 'Front',
                        previewImage: product.imageUrl,
                        isCustom: false
                      })
                      toggleWishlist(product.id)
                    }}
                    className="p-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition"
                    title="Move to Cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-neutral-100 text-neutral-800 font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

