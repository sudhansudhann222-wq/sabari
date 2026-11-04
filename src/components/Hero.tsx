import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Truck, Award, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { TShirtCanvas } from './TShirtCanvas'
import { Product } from '../types'
import { useStoreData } from '../context/StoreDataContext'
import { useGSAPScrollReveal } from '../hooks/useGSAPAnimation'

interface HeroProps {
  onCustomizeClick: (shirtColor?: string, graphicId?: string) => void
  onShopClick: () => void
  onSelectProduct: (product: Product) => void
  onQuickAddToCart: (product: Product) => void
}

const HERO_SLIDES = [
  {
    badge: 'Custom T-Shirts Made Easy',
    title: 'Design Your Own T-Shirt',
    subtitle: 'Choose a style, add your design, pick your color and make it yours.',
    shirtColor: '#FFFFFF',
    graphicId: 'astronaut',
    tag: 'Bestseller'
  },
  {
    badge: 'Trending Streetwear 2026',
    title: 'Wear Your Imagination',
    subtitle: 'Premium 240 GSM French Terry cotton with museum-grade DTG prints.',
    shirtColor: '#121212',
    graphicId: 'japanese-wave',
    tag: 'New Drop'
  },
  {
    badge: 'High-Definition Bio-Washed',
    title: 'Monochrome Topography',
    subtitle: 'Crisp vector patterns mapped across relaxed streetwear silhouettes.',
    shirtColor: '#121212',
    graphicId: 'abstract-lines',
    tag: 'Staff Pick'
  }
]

export const Hero: React.FC<HeroProps> = ({
  onCustomizeClick,
  onShopClick,
  onSelectProduct,
  onQuickAddToCart
}) => {
  const { products } = useStoreData()
  const [activeSlide, setActiveSlide] = useState(0)
  const trustRef = useGSAPScrollReveal<HTMLDivElement>({ stagger: 0.1, y: 15 })

  // Auto carousel slide change
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const currentSlide = HERO_SLIDES[activeSlide]

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Main Hero Card Container (Matches Image 1) */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-neutral-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px] sm:min-h-[520px] items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 z-10 flex flex-col justify-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-800 text-xs sm:text-sm font-medium w-fit mb-5 sm:mb-6 shadow-sm border border-neutral-200/60">
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              <span>{currentSlide.badge}</span>
            </div>

            {/* Giant Title & Subtitle with Animated Reveal */}
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-neutral-900 leading-[1.1] sm:leading-[1.08] mb-4 sm:mb-5">
                Design Your<br />
                Own T-Shirt
              </h1>

              <p className="text-neutral-600 text-sm sm:text-lg max-w-md font-normal leading-relaxed mb-6 sm:mb-9">
                {currentSlide.subtitle}
              </p>
            </motion.div>

            {/* Action Buttons with Motion Tap feedback */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onCustomizeClick(currentSlide.shirtColor, currentSlide.graphicId)}
                className="shine-button inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm sm:text-base shadow-md hover:shadow-xl transition-all duration-200 group"
              >
                <span>Customize Now</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={onShopClick}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-sm sm:text-base border border-neutral-300 shadow-xs hover:shadow transition-all duration-200"
              >
                Shop Collection
              </motion.button>
            </div>

            {/* Carousel Dots */}
            <div className="flex items-center gap-2.5 mt-8 sm:mt-10">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeSlide === idx
                      ? 'w-8 bg-neutral-900 shadow-xs scale-105'
                      : 'w-2.5 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Hero Visual / T-Shirt Mockup */}
          <div className="lg:col-span-6 relative flex items-center justify-center p-4 sm:p-10 lg:p-12 min-h-[320px] sm:min-h-[400px]">
            {/* Soft subtle curved background gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[120%] bg-gradient-to-bl from-neutral-100 via-neutral-50/50 to-white rounded-l-[80px] sm:rounded-l-[120px] pointer-events-none -z-0 opacity-80" />

            {/* Concentric subtle circles background */}
            <div className="absolute w-[300px] h-[300px] sm:w-[440px] sm:h-[440px] rounded-full border border-neutral-200/60 pointer-events-none animate-pulse" />
            <div className="absolute w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] rounded-full border border-neutral-200/40 pointer-events-none" />

            {/* T-Shirt Canvas with subtle floating breathing animation */}
            <div
              className="relative z-10 w-full max-w-[300px] sm:max-w-[420px] animate-subtle-float hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => onCustomizeClick(currentSlide.shirtColor, currentSlide.graphicId)}
              title="Click to customize this style"
            >
              <TShirtCanvas
                color={currentSlide.shirtColor}
                viewMode="front"
                presetGraphicId={currentSlide.graphicId}
              />
            </div>
          </div>
        </div>

        {/* Bottom Trust & Feature Bar (Matches Image 1) */}
        <div className="border-t border-neutral-200/80 bg-neutral-50/50 px-5 py-5 sm:px-12 sm:py-6">
          <div ref={trustRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:justify-center group hover:-translate-y-1 transition-transform duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-center text-neutral-800 shadow-sm group-hover:scale-110 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shrink-0">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-xs sm:text-sm">Fast Delivery</p>
                <p className="text-neutral-500 text-[11px] sm:text-xs">Across India</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:justify-center group hover:-translate-y-1 transition-transform duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-center text-neutral-800 shadow-sm group-hover:scale-110 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-xs sm:text-sm">Premium Quality</p>
                <p className="text-neutral-500 text-[11px] sm:text-xs">& Print</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:justify-center group hover:-translate-y-1 transition-transform duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-center text-neutral-800 shadow-sm group-hover:scale-110 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-xs sm:text-sm">Secure Payments</p>
                <p className="text-neutral-500 text-[11px] sm:text-xs">& Easy Returns</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Bestsellers Section on Home */}
      <section className="space-y-5 sm:space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              Trending Drops
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1">
              Top trending designs printed on heavyweight 240 GSM organic cotton.
            </p>
          </div>
          <button
            onClick={onShopClick}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-900 hover:text-neutral-600 transition"
          >
            <span>Explore All 140+ Tees</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Featured Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {products.slice(0, 3).map(product => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-neutral-200/80 p-3.5 sm:p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col justify-between group card-sheen"
            >
              <div
                className="relative bg-neutral-100/70 rounded-xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer p-3"
                onClick={() => onSelectProduct(product)}
              >
                {product.isCustomizableBase && (
                  <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-start gap-1">
                    <div className="bg-black/95 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black tracking-widest text-white uppercase flex items-center gap-1 shadow border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>CUSTOM T-SHIRT</span>
                    </div>
                  </div>
                )}

                <TShirtCanvas
                  color={product.colors[0]}
                  presetGraphicId={product.isCustomizableBase ? undefined : product.imageUrl}
                  modelType={product.modelType || 'flat'}
                  bracketColor={product.bracketColor}
                  isCustomizableBase={product.isCustomizableBase}
                  className="group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Rating badge */}
                <div className="absolute bottom-2.5 left-2.5 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold text-neutral-800 shadow-sm flex items-center gap-1 border border-neutral-200/50">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating} | {product.reviewsCount}</span>
                </div>
              </div>

              <div className="pt-3.5 sm:pt-4 flex flex-col flex-1 justify-between">
                <div>
                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="font-bold text-neutral-900 text-sm sm:text-base hover:text-neutral-600 cursor-pointer transition line-clamp-1"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                    <span className="font-extrabold text-neutral-900 text-base sm:text-lg">
                      ₹{product.price}
                    </span>
                    <span className="text-neutral-400 line-through text-xs font-medium">
                      ₹{product.originalPrice}
                    </span>
                    <span className="text-neutral-900 text-xs font-bold tracking-tight">
                      {product.discountPercent}% OFF
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 sm:mt-4 pt-1 sm:pt-2">
                  <button
                    onClick={() => onQuickAddToCart(product)}
                    className="shine-button w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all duration-200"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Studio Banner */}
      <section className="relative rounded-3xl bg-neutral-900 text-white p-6 sm:p-12 overflow-hidden shadow-xl group">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        <div className="relative z-10 max-w-xl">
          <span className="text-neutral-400 text-[11px] font-bold tracking-widest uppercase">
            Custom Studio Engine
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-3 sm:mb-4 text-white">
            Got an idea? Print your own custom artwork.
          </h2>
          <p className="text-neutral-300 text-xs sm:text-base leading-relaxed mb-5 sm:mb-6 font-normal">
            Upload personal designs, add typography with 10+ custom streetwear fonts, change garment colors, and preview live front and back prints before placing your order.
          </p>
          <button
            onClick={() => onCustomizeClick()}
            className="shine-button inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-white text-neutral-950 font-bold text-xs sm:text-sm hover:bg-neutral-100 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-2xl"
          >
            <span>Open Customizer Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Background graphic motif */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full border-[30px] border-neutral-800/40 pointer-events-none" />
      </section>
    </div>
  )
}
