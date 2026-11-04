import React, { useState, useMemo } from 'react'
import { Search, X, Star } from 'lucide-react'
import { Product } from '../types'
import { TShirtCanvas } from './TShirtCanvas'
import { useStoreData } from '../context/StoreDataContext'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (product: Product) => void
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct
}) => {
  const { products } = useStoreData()
  const [query, setQuery] = useState('')

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [query, products])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[80vh] animate-spring-pop">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search astronaut, japanese wave, oversized, streetwear, polo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-base sm:text-lg font-medium text-neutral-900 focus:outline-none placeholder:text-neutral-400"
          />
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!query.trim() ? (
            <div className="space-y-4">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Trending Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {['Astronaut', 'Oversized', 'Japanese Wave', 'Topographic', 'Tokyo Streetwear', 'Polo'].map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-sm">
              No t-shirts found matching "{query}". Try "Astronaut" or "Oversized".
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Found {searchResults.length} Products
              </p>
              {searchResults.map(product => (
                <div
                  key={product.id}
                  onClick={() => {
                    onClose()
                    onSelectProduct(product)
                  }}
                  className="flex items-center gap-4 p-3 rounded-2xl border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer transition"
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-200/50 p-1 shrink-0 overflow-hidden">
                    <TShirtCanvas
                      color={product.colors[0]}
                      presetGraphicId={product.imageUrl}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-neutral-900 truncate">{product.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{product.category} • ★ {product.rating}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-neutral-900">₹{product.price}</p>
                    <span className="text-[10px] text-neutral-400 line-through">₹{product.originalPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

