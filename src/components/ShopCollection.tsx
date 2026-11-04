import React, { useState, useMemo } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Heart, Star, ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import { Product, TShirtSize } from '../types'
import { COLOR_PALETTE } from '../data/products'
import { TShirtCanvas } from './TShirtCanvas'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useStoreData } from '../context/StoreDataContext'

interface ShopCollectionProps {
  onCustomizeDesign: (product: Product) => void
  onProductClick: (product: Product) => void
}

export const ShopCollection: React.FC<ShopCollectionProps> = ({
  onCustomizeDesign,
  onProductClick
}) => {
  const { products } = useStoreData()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [gridParentRef] = useAutoAnimate<HTMLDivElement>()

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<TShirtSize[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price-low' | 'price-high'>('popular')
  const [addedToast, setAddedToast] = useState<string | null>(null)

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    category: true,
    size: true,
    color: true,
    pattern: true
  })

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedPatterns([])
  }

  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedPatterns.length > 0

  // Category counts computed dynamically from live products catalog
  const categoryOptions = useMemo(() => {
    const cats: Array<{ label: string; count: number }> = [
      { label: 'T-Shirts', count: 0 },
      { label: 'Oversized', count: 0 },
      { label: 'Polo', count: 0 },
      { label: 'Crop', count: 0 },
      { label: 'Full Sleeve', count: 0 }
    ]
    cats.forEach(c => {
      c.count = products.filter(p => p.category === c.label).length
    })
    return cats
  }, [products])

  const sizeOptions: TShirtSize[] = ['S', 'M', 'L', 'XL', 'XXL']
  const patternOptions = ['Front', 'Back', 'All Over']

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) {
        return false
      }
      if (selectedSizes.length > 0 && !selectedSizes.some(s => p.availableSizes.includes(s))) {
        return false
      }
      if (selectedColors.length > 0 && !selectedColors.some(c => p.colors.includes(c))) {
        return false
      }
      if (selectedPatterns.length > 0 && !selectedPatterns.some(pat => p.patternCoverage.includes(pat as any))) {
        return false
      }
      return true
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'rating') return b.rating - a.rating
      return b.reviewsCount - a.reviewsCount // 'popular'
    })
  }, [products, selectedCategories, selectedSizes, selectedColors, selectedPatterns, sortBy])

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      tshirtType: product.category === 'Oversized' ? 'Oversized T-Shirt' : 'Regular T-Shirt',
      color: product.colors[0],
      colorName: product.colors[0] === '#121212' ? 'Pitch Black' : 'Pure White',
      size: 'L',
      quantity: 1,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      printLocation: product.patternCoverage[0] || 'Front',
      previewImage: product.imageUrl,
      isCustom: false
    })

    setAddedToast(`Added "${product.name}" to cart!`)
    setTimeout(() => setAddedToast(null), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in border border-neutral-700">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Header Row (Matches Image 2 exactly) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-neutral-200/80">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
            T-Shirts Collection
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base mt-1 font-normal">
            Explore our range or customize your own design.
          </p>
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-neutral-900" />
            )}
          </button>

          {/* Sort By Dropdown (Matches Screenshot "Sort by: Popular v") */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500 font-medium whitespace-nowrap">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="appearance-none bg-transparent font-bold text-neutral-900 pr-7 pl-1 py-1 focus:outline-none cursor-pointer"
              >
                <option value="popular">Popular</option>
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-700 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Filters Sidebar (Desktop) */}
        <aside className="hidden md:block md:col-span-3 bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h2 className="font-extrabold text-neutral-900 text-base">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 underline transition"
              >
                Clear All
              </button>
            )}
          </div>

          {/* 1. Category */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('category')}
              className="w-full flex items-center justify-between text-sm font-bold text-neutral-900"
            >
              <span>Category</span>
              {openSections.category ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
            </button>
            {openSections.category && (
              <div className="space-y-2 pt-1">
                {categoryOptions.map(cat => {
                  const isChecked = selectedCategories.includes(cat.label)
                  return (
                    <label
                      key={cat.label}
                      className="flex items-center justify-between text-sm text-neutral-700 cursor-pointer hover:text-neutral-950 select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedCategories(prev =>
                              prev.includes(cat.label) ? prev.filter(c => c !== cat.label) : [...prev, cat.label]
                            )
                          }}
                          className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900 cursor-pointer accent-neutral-900"
                        />
                        <span className={isChecked ? 'font-bold text-neutral-900' : 'font-normal'}>
                          {cat.label}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">({cat.count})</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* 2. Size */}
          <div className="space-y-3 border-t border-neutral-100 pt-5">
            <button
              onClick={() => toggleSection('size')}
              className="w-full flex items-center justify-between text-sm font-bold text-neutral-900"
            >
              <span>Size</span>
              {openSections.size ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
            </button>
            {openSections.size && (
              <div className="flex flex-wrap gap-2 pt-1">
                {sizeOptions.map(size => {
                  const isSelected = selectedSizes.includes(size)
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSizes(prev =>
                          prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                        )
                      }}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. Color */}
          <div className="space-y-3 border-t border-neutral-100 pt-5">
            <button
              onClick={() => toggleSection('color')}
              className="w-full flex items-center justify-between text-sm font-bold text-neutral-900"
            >
              <span>Color</span>
              {openSections.color ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
            </button>
            {openSections.color && (
              <div className="flex items-center gap-2 pt-1">
                {COLOR_PALETTE.slice(0, 5).map(c => {
                  const isSelected = selectedColors.includes(c.hex)
                  return (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedColors(prev =>
                          prev.includes(c.hex) ? prev.filter(hex => hex !== c.hex) : [...prev, c.hex]
                        )
                      }}
                      title={c.name}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        isSelected
                          ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110'
                          : 'hover:scale-110'
                      } ${c.border ? 'border-neutral-300' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* 4. Pattern Coverage */}
          <div className="space-y-3 border-t border-neutral-100 pt-5">
            <button
              onClick={() => toggleSection('pattern')}
              className="w-full flex items-center justify-between text-sm font-bold text-neutral-900"
            >
              <span>Pattern Coverage</span>
              {openSections.pattern ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
            </button>
            {openSections.pattern && (
              <div className="space-y-2 pt-1">
                {patternOptions.map(pattern => {
                  const isChecked = selectedPatterns.includes(pattern)
                  return (
                    <label
                      key={pattern}
                      className="flex items-center gap-2.5 text-sm text-neutral-700 cursor-pointer hover:text-neutral-950 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedPatterns(prev =>
                            prev.includes(pattern) ? prev.filter(p => p !== pattern) : [...prev, pattern]
                          )
                        }}
                        className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900 cursor-pointer accent-neutral-900"
                      />
                      <span className={isChecked ? 'font-bold text-neutral-900' : 'font-normal'}>
                        {pattern}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Product Cards Grid (Matches Image 2 exactly) */}
        <main className="md:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center">
              <p className="text-neutral-500 text-base font-medium">No t-shirts match the selected filters.</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div ref={gridParentRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const wishlisted = isInWishlist(product.id)
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-neutral-200/80 p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between group card-sheen"
                  >
                    {/* Card Mockup Image Container */}
                    <div
                      className="relative bg-neutral-100/70 rounded-xl overflow-hidden aspect-[4/4] flex items-center justify-center p-3 cursor-pointer group/img"
                      onClick={() => onProductClick(product)}
                    >
                      {/* Customizable Base Badge (Bewakoof Reference Style) */}
                      {product.isCustomizableBase && (
                        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-start gap-1">
                          <div className="bg-black/95 backdrop-blur-md px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black tracking-widest text-white uppercase flex items-center gap-1 shadow-md border border-white/10 animate-fade-in-scale">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>CUSTOM T-SHIRTS</span>
                          </div>
                          {product.fitBadge && (
                            <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold tracking-tight shadow-sm text-white ${
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

                      {/* T-Shirt Canvas or Model Mockup */}
                      <TShirtCanvas
                        color={product.colors[0]}
                        presetGraphicId={product.isCustomizableBase ? undefined : product.imageUrl}
                        modelType={product.modelType || 'flat'}
                        bracketColor={product.bracketColor}
                        isCustomizableBase={product.isCustomizableBase}
                        className="group-hover/img:scale-105 transition-transform duration-300"
                      />

                      {/* Out of Stock Overlay / Badge */}
                      {product.inStock === false && (
                        <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-white text-neutral-900 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}

                      {/* Wishlist Button (Top Right of image with Heart Pop) */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          toggleWishlist(product.id)
                        }}
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-700 hover:text-neutral-950 active:scale-75 shadow-sm transition-all duration-200 hover:scale-115 border border-neutral-200/40"
                        title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-4 h-4 transition-transform duration-200 ${wishlisted ? 'fill-neutral-900 text-neutral-900 scale-110' : ''}`} />
                      </button>

                      {/* Star Rating Badge (Bottom Left of image, e.g. ★ 4.6 | 158) */}
                      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-neutral-800 shadow-sm flex items-center gap-1 border border-neutral-200/50">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{product.rating} | {product.reviewsCount}</span>
                      </div>
                    </div>

                    {/* Card Bottom Meta */}
                    <div className="pt-4 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Subtitle / Brand label (Bewakoof Reference Style) */}
                        <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">
                          TeeCraft®
                        </div>

                        <h3
                          onClick={() => onProductClick(product)}
                          className="font-bold text-neutral-900 text-base hover:text-neutral-600 cursor-pointer transition line-clamp-1"
                        >
                          {product.name}
                        </h3>

                        {/* Price Row */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-extrabold text-neutral-900 text-lg">
                            ₹{product.price}
                          </span>
                          <span className="text-neutral-400 line-through text-xs font-medium">
                            ₹{product.originalPrice}
                          </span>
                          <span className="text-emerald-600 text-xs font-extrabold tracking-tight">
                            {product.discountPercent}% OFF
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-2 space-y-2">
                        {/* Primary Button */}
                        <button
                          disabled={product.inStock === false}
                          onClick={e => {
                            if (product.inStock === false) return
                            if (product.isCustomizableBase) {
                              e.stopPropagation()
                              onCustomizeDesign(product)
                            } else {
                              handleAddToCart(product, e)
                            }
                          }}
                          className={`shine-button w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                            product.inStock === false
                              ? 'bg-neutral-300 text-neutral-600'
                              : product.isCustomizableBase
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                          }`}
                        >
                          {product.inStock === false ? 'SOLD OUT' : product.isCustomizableBase ? 'CUSTOMIZE NOW' : 'ADD TO CART'}
                        </button>

                        {/* Secondary Button */}
                        <button
                          onClick={e => {
                            if (product.isCustomizableBase) {
                              handleAddToCart(product, e)
                            } else {
                              onCustomizeDesign(product)
                            }
                          }}
                          className="w-full py-1.5 text-center text-xs font-bold text-neutral-600 hover:text-neutral-950 hover:translate-x-0.5 transition-all duration-200"
                        >
                          {product.isCustomizableBase ? 'Quick Add Blank Tee' : 'Customize This Tee →'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end md:hidden">
          <div className="w-5/6 max-w-sm bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h2 className="font-extrabold text-lg text-neutral-900">Filters</h2>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div className="space-y-2">
              <p className="font-bold text-sm">Category</p>
              {categoryOptions.map(cat => (
                <label key={cat.label} className="flex items-center justify-between text-sm py-1">
                  <span>{cat.label}</span>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.label)}
                    onChange={() => {
                      setSelectedCategories(prev =>
                        prev.includes(cat.label) ? prev.filter(c => c !== cat.label) : [...prev, cat.label]
                      )
                    }}
                    className="accent-neutral-900"
                  />
                </label>
              ))}
            </div>

            {/* Mobile Sizes */}
            <div className="space-y-2 border-t pt-4">
              <p className="font-bold text-sm">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSizes(prev =>
                        prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                      )
                    }}
                    className={`w-9 h-9 rounded-lg text-xs font-bold border ${
                      selectedSizes.includes(size) ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 rounded-xl border border-neutral-300 font-bold text-xs"
              >
                Clear
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-bold text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

