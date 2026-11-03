import React, { useState } from 'react'
import { X, Star, Heart, Check, ShoppingCart, SlidersHorizontal, ShieldCheck, Truck } from 'lucide-react'
import { Product, TShirtSize } from '../types'
import { TShirtCanvas } from './TShirtCanvas'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onCustomize: (product: Product) => void
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onCustomize
}) => {
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()

  const [selectedColor, setSelectedColor] = useState(product?.colors[0] || '#121212')
  const [selectedSize, setSelectedSize] = useState<TShirtSize>('L')
  const [selectedView, setSelectedView] = useState<'front' | 'back'>('front')
  const [quantity, setQuantity] = useState(1)
  const [addedToast, setAddedToast] = useState(false)

  if (!product) return null

  const isWishlisted = isInWishlist(product.id)

  const handleAddToCart = () => {
    addToCart({
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      tshirtType: product.category === 'Oversized' ? 'Oversized T-Shirt' : 'Regular T-Shirt',
      color: selectedColor,
      colorName: selectedColor === '#121212' ? 'Pitch Black' : 'Pure White',
      size: selectedSize,
      quantity,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      printLocation: selectedView === 'back' ? 'Back' : 'Front',
      previewImage: product.imageUrl,
      isCustom: false
    })

    setAddedToast(true)
    setTimeout(() => {
      setAddedToast(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-neutral-200 overflow-hidden my-8 relative animate-spring-pop">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          
          {/* Left Visual */}
          <div className="md:col-span-6 bg-neutral-100/70 p-6 sm:p-8 flex flex-col items-center justify-center relative">
            {/* Customizable Badge */}
            {product.isCustomizableBase && (
              <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1">
                <div className="bg-black/95 backdrop-blur-md px-2.5 py-1 rounded text-[9px] font-black tracking-widest text-white uppercase flex items-center gap-1 shadow-md border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>CUSTOM T-SHIRTS</span>
                </div>
                {product.fitBadge && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-tight shadow-sm text-white ${
                    product.fitBadge === 'Oversized'
                      ? 'bg-sky-600'
                      : product.fitBadge === 'Boyfriend Fit'
                      ? 'bg-rose-600'
                      : 'bg-neutral-800'
                  }`}>
                    {product.fitBadge}
                  </span>
                )}
              </div>
            )}

            <div className="w-full max-w-[320px] aspect-square">
              <TShirtCanvas
                color={selectedColor}
                viewMode={selectedView}
                presetGraphicId={product.isCustomizableBase ? undefined : product.imageUrl}
                modelType={product.modelType || 'flat'}
                bracketColor={product.bracketColor}
                isCustomizableBase={product.isCustomizableBase}
              />
            </div>

            {/* View Switcher if available */}
            {product.patternCoverage.includes('Back') && (
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setSelectedView('front')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedView === 'front' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 border'
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setSelectedView('back')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedView === 'back' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 border'
                  }`}
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Right Product Details */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Badge & Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      TeeCraft®
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating} ({product.reviewsCount} reviews)</span>
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                  {product.name}
                </h2>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-extrabold text-neutral-900">
                  ₹{product.price}
                </span>
                <span className="text-sm text-neutral-400 line-through font-medium">
                  ₹{product.originalPrice}
                </span>
                <span className="text-xs font-extrabold text-neutral-900 tracking-tight">
                  {product.discountPercent}% OFF
                </span>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Available Colors</label>
                <div className="flex items-center gap-2">
                  {product.colors.map(col => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`w-7 h-7 rounded-full border transition flex items-center justify-center ${
                        selectedColor === col ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110' : ''
                      }`}
                      style={{ backgroundColor: col }}
                    >
                      {selectedColor === col && (
                        <Check className={`w-3.5 h-3.5 ${col === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Select Size</label>
                <div className="flex items-center gap-2">
                  {product.availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition border ${
                        selectedSize === size
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Quantity</label>
                <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold transition"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{addedToast ? 'Added to Cart!' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-12 rounded-2xl border flex items-center justify-center transition ${
                    isWishlisted ? 'border-neutral-900 bg-neutral-50 text-neutral-900' : 'border-neutral-200 text-neutral-600 hover:text-neutral-950'
                  }`}
                  title="Save to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-neutral-900' : ''}`} />
                </button>
              </div>

              <button
                onClick={() => {
                  onClose()
                  onCustomize(product)
                }}
                className="w-full py-2.5 rounded-xl border border-neutral-300 hover:border-neutral-900 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Open in Customizer Studio</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

