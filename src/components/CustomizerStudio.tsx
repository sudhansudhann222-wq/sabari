import React, { Suspense, lazy, useState, useRef } from 'react'
import {
  Palette,
  Type,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Trash2,
  ShoppingCart,
  Check,
  Ruler,
  Sliders,
  ChevronDown,
  Droplet,
  CloudUpload
} from 'lucide-react'
import { TShirtColor, TShirtSize, SideDesign, CustomGraphicElement, CustomTextElement, Product } from '../types'
import { COLOR_PALETTE } from '../data/products'
import { PRESET_GRAPHICS } from '../data/graphics'
import { TShirtCanvas } from './TShirtCanvas'
import { useCart } from '../context/CartContext'
import { saveCustomDesignToSupabase } from '../lib/supabase'
import confetti from 'canvas-confetti'

const TShirt3DViewer = lazy(() => import('./3d/TShirt3DViewer').then(module => ({ default: module.TShirt3DViewer })))

interface CustomizerStudioProps {
  initialProduct?: Product | null
  initialColor?: string
  initialGraphicId?: string
  onCartNavigate: () => void
}

export const CustomizerStudio: React.FC<CustomizerStudioProps> = ({
  initialProduct,
  initialColor,
  initialGraphicId,
  onCartNavigate
}) => {
  const { addToCart } = useCart()

  // Left Active Tool Tab
  const [activeTab, setActiveTab] = useState<'design' | 'text' | 'upload' | 'color' | 'fit' | 'print-area'>('design')

  // Garment Configuration (Right Panel)
  const [tshirtType, setTshirtType] = useState('Oversized T-Shirt')

  // Determine initial color
  const startColor = initialColor
    ? (COLOR_PALETTE.find(c => c.hex.toLowerCase() === initialColor.toLowerCase()) || COLOR_PALETTE[0])
    : initialProduct
    ? (COLOR_PALETTE.find(c => c.hex === initialProduct.colors[0]) || COLOR_PALETTE[0])
    : COLOR_PALETTE[0]

  const [selectedColor, setSelectedColor] = useState<TShirtColor>(startColor)
  const [selectedSize, setSelectedSize] = useState<TShirtSize>('L')
  const [quantity, setQuantity] = useState(1)

  // View Switcher (Front, Back, Sleeve)
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'sleeve'>('front')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const studioRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Starting graphic (do not set preset SVG if it's a customizable base tee with photo URL)
  const startGraphicId = initialGraphicId 
    ? initialGraphicId 
    : (initialProduct && !initialProduct.isCustomizableBase && !initialProduct.imageUrl.startsWith('http') ? initialProduct.imageUrl : null)

  // Model Perspective (Flat Garment vs Model Wear vs 3D)
  const [modelPerspective, setModelPerspective] = useState<'flat' | 'male-model' | 'female-model' | '3d'>(
    initialProduct?.modelType || 'flat'
  )

  // Design Canvas State per side
  const [designs, setDesigns] = useState<{
    front: SideDesign
    back: SideDesign
    sleeve: SideDesign
  }>({
    front: {
      graphics: startGraphicId ? [{
        id: 'init-g1',
        graphicId: startGraphicId,
        width: 76,
        x: 50,
        y: 50,
        rotation: 0
      }] : [],
      texts: []
    },
    back: {
      graphics: [],
      texts: []
    },
    sleeve: {
      graphics: [],
      texts: []
    }
  })

  // History for Undo / Redo
  const [history, setHistory] = useState<typeof designs[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Selected element on canvas
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  // Text tool controls
  const [customText, setCustomText] = useState('')
  const [selectedFont, setSelectedFont] = useState("'Plus Jakarta Sans', sans-serif")
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [textSize, setTextSize] = useState(26)

  // Success Feedback
  const [addedToast, setAddedToast] = useState(false)

  // Record history
  const recordHistory = (newDesigns: typeof designs) => {
    const newHist = history.slice(0, historyIndex + 1)
    newHist.push(newDesigns)
    setHistory(newHist)
    setHistoryIndex(newHist.length - 1)
    setDesigns(newDesigns)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1
      setHistoryIndex(prevIdx)
      setDesigns(history[prevIdx])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1
      setHistoryIndex(nextIdx)
      setDesigns(history[nextIdx])
    }
  }

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      studioRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // Add Graphic to current view
  const handleSelectPresetGraphic = (graphicId: string) => {
    const newElement: CustomGraphicElement = {
      id: `graphic-${Date.now()}`,
      graphicId,
      width: 76,
      x: 50,
      y: 50,
      rotation: 0
    }
    const updated = {
      ...designs,
      [currentView]: {
        ...designs[currentView],
        graphics: [newElement]
      }
    }
    recordHistory(updated)
    setSelectedElementId(newElement.id)
  }

  // Handle User Uploaded Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      if (result) {
        const newElement: CustomGraphicElement = {
          id: `upload-${Date.now()}`,
          imageUrl: result,
          width: 74,
          x: 50,
          y: 50,
          rotation: 0
        }
        const updated = {
          ...designs,
          [currentView]: {
            ...designs[currentView],
            graphics: [newElement]
          }
        }
        recordHistory(updated)
        setSelectedElementId(newElement.id)
      }
    }
    reader.readAsDataURL(file)
  }

  // Add Custom Text
  const handleAddText = () => {
    if (!customText.trim()) return
    const newText: CustomTextElement = {
      id: `text-${Date.now()}`,
      text: customText,
      fontFamily: selectedFont,
      fontSize: textSize,
      color: textColor,
      fontWeight: 'bold',
      letterSpacing: 2,
      x: 50,
      y: 50,
      rotation: 0
    }
    const updated = {
      ...designs,
      [currentView]: {
        ...designs[currentView],
        texts: [...designs[currentView].texts, newText]
      }
    }
    recordHistory(updated)
    setSelectedElementId(newText.id)
    setCustomText('')
  }

  // Remove selected element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return
    const updated = {
      ...designs,
      [currentView]: {
        graphics: designs[currentView].graphics.filter(g => g.id !== selectedElementId),
        texts: designs[currentView].texts.filter(t => t.id !== selectedElementId)
      }
    }
    recordHistory(updated)
    setSelectedElementId(null)
  }

  // Update graphic position / properties (e.g. from mouse dragging)
  const handleUpdateGraphic = (id: string, updates: Partial<CustomGraphicElement>) => {
    setDesigns(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        graphics: prev[currentView].graphics.map(g => g.id === id ? { ...g, ...updates } : g)
      }
    }))
  }

  // Update text position / properties (e.g. from mouse dragging)
  const handleUpdateText = (id: string, updates: Partial<CustomTextElement>) => {
    setDesigns(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        texts: prev[currentView].texts.map(t => t.id === id ? { ...t, ...updates } : t)
      }
    }))
  }

  // Save design to Supabase / Cloud
  const [savedCloudMessage, setSavedCloudMessage] = useState<string | null>(null)
  const [isSavingCloud, setIsSavingCloud] = useState(false)

  const handleSaveToCloud = async () => {
    setIsSavingCloud(true)
    const firstGraphicId = designs.front.graphics[0]?.graphicId || designs.back.graphics[0]?.graphicId || 'astronaut'
    const printLocation = [
      designs.front.graphics.length || designs.front.texts.length ? 'Front' : null,
      designs.back.graphics.length || designs.back.texts.length ? 'Back' : null,
      designs.sleeve.graphics.length ? 'Sleeve' : null
    ].filter(Boolean).join(' + ') || 'Front'

    const res = await saveCustomDesignToSupabase({
      name: `Custom ${selectedColor.name} Tee`,
      tshirtType,
      color: selectedColor.hex,
      colorName: selectedColor.name,
      size: selectedSize,
      printLocation,
      designData: designs,
      previewImage: firstGraphicId
    })

    setIsSavingCloud(false)
    if (res.success) {
      setSavedCloudMessage('Design saved on this device.')
      setTimeout(() => setSavedCloudMessage(null), 3000)
    }
  }

  // Add to Cart Action
  const handleAddToCart = () => {
    const hasBack = designs.back.graphics.length > 0 || designs.back.texts.length > 0
    const hasSleeve = designs.sleeve.graphics.length > 0 || designs.sleeve.texts.length > 0
    const printLocation = [
      'Front',
      hasBack ? 'Back' : null,
      hasSleeve ? 'Sleeve' : null
    ].filter(Boolean).join(' + ')

    const firstGraphicId = designs.front.graphics[0]?.graphicId || designs.back.graphics[0]?.graphicId || 'astronaut'

    addToCart({
      id: `custom-tee-${Date.now()}`,
      productId: 'custom-design',
      name: 'Custom T-Shirt',
      tshirtType: tshirtType,
      color: selectedColor.hex,
      colorName: selectedColor.name,
      size: selectedSize,
      quantity: quantity,
      price: 499,
      originalPrice: 1199,
      discountPercent: 58,
      printLocation: printLocation,
      previewImage: firstGraphicId,
      isCustom: true,
      customDesign: designs
    })

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch {
      // ignore
    }

    // Keep the success state on the button until the user changes context.
    // This avoids it reverting to "Add to the Cart" while the user is still
    // looking at the action they just completed.
    setAddedToast(true)
  }

  // Tools definition
  const tools = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'upload', label: 'Upload Image', icon: ImageIcon },
    { id: 'color', label: 'Color', icon: Droplet },
    { id: 'fit', label: 'Size & Fit', icon: Ruler },
    { id: 'print-area', label: 'Print Area', icon: Sliders }
  ]

  // Render Subpanel content
  const renderToolSubPanel = () => {
    return (
      <div className="pt-3">
        {/* 1. Design Presets */}
        {activeTab === 'design' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Select Graphic
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {PRESET_GRAPHICS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelectPresetGraphic(item.id)}
                  className="p-2 sm:p-2.5 border border-neutral-200 rounded-xl hover:border-neutral-900 hover:shadow-xs transition bg-neutral-50 flex flex-col items-center gap-1 group text-left"
                >
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-105 transition-transform"
                    dangerouslySetInnerHTML={{ __html: item.svgContent }}
                  />
                  <span className="text-[10px] sm:text-[11px] font-bold text-neutral-800 line-clamp-1 w-full text-center">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Text Controls */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Type custom text..."
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />

            <div className="flex flex-wrap gap-1">
              {['OVERTHINKING', 'OFFLINE', 'TOKYO', 'STAY WEIRD'].map(slogan => (
                <button
                  key={slogan}
                  type="button"
                  onClick={() => setCustomText(slogan)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold"
                >
                  {slogan}
                </button>
              ))}
            </div>

            <div>
              <select
                value={selectedFont}
                onChange={e => setSelectedFont(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-none"
              >
                <option value="'Plus Jakarta Sans', sans-serif">Modern Sans</option>
                <option value="'Bebas Neue', sans-serif">Streetwear Heavy (Bebas)</option>
                <option value="'Space Grotesk', sans-serif">Cyberpunk Tech</option>
                <option value="'Caveat', cursive">Handwritten Script</option>
                <option value="'Playfair Display', serif">Vintage Serif</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {['#FFFFFF', '#121212', '#EF4444', '#3B82F6', '#F59E0B'].map(c => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className={`w-6 h-6 rounded-full border ${textColor === c ? 'ring-2 ring-neutral-900 ring-offset-1 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-neutral-500">{textSize}px</span>
            </div>

            <button
              onClick={handleAddText}
              className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition"
            >
              + Add Text to Shirt
            </button>
          </div>
        )}

        {/* 3. Upload Image */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <label className="border-2 border-dashed border-neutral-300 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-neutral-900 transition bg-neutral-50 hover:bg-white">
              <ImageIcon className="w-8 h-8 text-neutral-400 mb-2" />
              <span className="text-xs font-bold text-neutral-800">
                Click to upload
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">
                PNG, JPG, SVG up to 10MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* 4. Color Palette */}
        {activeTab === 'color' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Fabric Shades
            </p>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c)}
                  className={`h-9 sm:h-10 rounded-xl border flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 ${
                    selectedColor.hex === c.hex ? 'ring-2 ring-neutral-900 ring-offset-2 scale-105 shadow-sm' : ''
                  } ${c.border ? 'border-neutral-300' : 'border-transparent'}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor.hex === c.hex && (
                    <Check className={`w-4 h-4 animate-spring-pop ${c.hex === '#FFFFFF' || c.hex === '#F3F4F6' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Size & Fit */}
        {activeTab === 'fit' && (
          <div className="space-y-2 text-xs">
            <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-neutral-700 space-y-1">
              <p className="font-bold text-neutral-900">240 GSM Oversized Streetwear</p>
              <p>Drop-shoulder, relaxed boxy drape tailored for standard unisex chest sizes.</p>
            </div>
          </div>
        )}

        {/* 6. Print Area */}
        {activeTab === 'print-area' && (
          <div className="space-y-1.5">
            {['front', 'back', 'sleeve'].map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view as any)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold capitalize text-left flex justify-between items-center ${
                  currentView === view ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-neutral-700'
                }`}
              >
                <span>{view} Placement</span>
                {currentView === view && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={studioRef} className="space-y-6 pb-20 lg:pb-0">
      {/* Main Studio Card Container */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-12 min-h-[640px]">
          
          {/* ========================================================= */}
          {/* MOBILE ONLY: Horizontal Tool Bar (Positioned under/over)  */}
          {/* ========================================================= */}
          <div className="lg:hidden p-4 border-b border-neutral-200/80 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">
                Customize T-Shirt
              </h2>
              <span className="text-xs font-bold text-neutral-500 capitalize">{activeTab}</span>
            </div>
            
            {/* Scrollable Tool Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {tools.map(tool => {
                const Icon = tool.icon
                const isActive = activeTab === tool.id
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tool.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Active Tool Sub-Panel on Mobile */}
            <div className="bg-neutral-50/70 rounded-2xl p-3 border border-neutral-200/60">
              {renderToolSubPanel()}
            </div>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP ONLY: Left Sidebar (Matches Image 3)               */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:col-span-3 border-r border-neutral-200/80 p-6 flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                Customize T-Shirt
              </h2>

              <div className="space-y-2">
                {tools.map(tool => {
                  const Icon = tool.icon
                  const isActive = activeTab === tool.id
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTab(tool.id as any)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-neutral-100 text-neutral-950 font-bold shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/80'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2] text-neutral-950' : 'stroke-[1.8] text-neutral-500'}`} />
                      <span>{tool.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Sub-panel on desktop */}
              {renderToolSubPanel()}
            </div>

            {/* Selected item remove shortcut */}
            {selectedElementId && (
              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700">Selected Item</span>
                <button
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* CENTER CANVAS STUDIO (Responsive for all screens)          */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 bg-[#fbfbfb] p-4 sm:p-6 flex flex-col justify-between relative order-first lg:order-none">
            
            {/* Top Canvas Controls (Left ↺ ↻, Center Perspective, Right [ ]) */}
            <div className="flex items-center justify-between z-20 gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-xs border border-neutral-200/80">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 text-neutral-700 transition"
                  title="Undo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 text-neutral-700 transition"
                  title="Redo"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Perspective Selector (Flat Garment vs Model Wear vs 3D) */}
              <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-xs border border-neutral-200/80 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setModelPerspective('flat')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    modelPerspective === 'flat'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  👕 Flat
                </button>
                <button
                  type="button"
                  onClick={() => setModelPerspective('male-model')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    modelPerspective === 'male-model'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  🧔 Men's Fit
                </button>
                <button
                  type="button"
                  onClick={() => setModelPerspective('female-model')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    modelPerspective === 'female-model'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  👩 Women's Fit
                </button>
                <button
                  type="button"
                  onClick={() => setModelPerspective('3d')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    modelPerspective === '3d'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>🌐 3D View</span>
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-neutral-100 text-neutral-700 shadow-xs border border-neutral-200/80 transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Central Garment Display */}
            <div
              className="flex-1 flex items-center justify-center my-3 sm:my-2"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = ev => {
                    const result = ev.target?.result as string
                    if (result) {
                      const newElement: CustomGraphicElement = {
                        id: `upload-${Date.now()}`,
                        imageUrl: result,
                        width: 74,
                        x: 50,
                        y: 50,
                        rotation: 0
                      }
                      const updated = {
                        ...designs,
                        [currentView]: {
                          ...designs[currentView],
                          graphics: [newElement]
                        }
                      }
                      recordHistory(updated)
                      setSelectedElementId(newElement.id)
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            >
              <div className="w-full max-w-[340px] sm:max-w-[440px] aspect-square relative flex items-center justify-center">
                {modelPerspective === '3d' ? (
                  <Suspense fallback={<div className="grid h-full w-full place-items-center text-sm text-neutral-500">Loading 3D preview…</div>}>
                    <TShirt3DViewer
                    color={selectedColor.hex}
                    frontDesign={designs.front}
                    backDesign={designs.back}
                    sleeveDesign={designs.sleeve}
                    isCustomizableBase={initialProduct?.isCustomizableBase || false}
                    bracketColor={initialProduct?.bracketColor || '#0ea5e9'}
                    className="w-full h-full"
                    />
                  </Suspense>
                ) : (
                  <TShirtCanvas
                    color={selectedColor.hex}
                    viewMode={currentView}
                    graphics={designs[currentView].graphics}
                    texts={designs[currentView].texts}
                    showDashedArea={true}
                    interactive={true}
                    selectedElementId={selectedElementId}
                    onSelectElement={setSelectedElementId}
                    onUpdateGraphic={handleUpdateGraphic}
                    onUpdateText={handleUpdateText}
                    modelType={modelPerspective}
                    bracketColor={initialProduct?.bracketColor || '#0ea5e9'}
                    isCustomizableBase={initialProduct?.isCustomizableBase || false}
                    onEmptyAreaClick={() => {
                      setActiveTab('upload')
                      fileInputRef.current?.click()
                    }}
                  />
                )}
              </div>
            </div>

            {/* Bottom View Switcher Thumbnails (Front, Back, Sleeve) */}
            <div className="flex items-center justify-center gap-3 z-20 pt-2">
              <button
                onClick={() => setCurrentView('front')}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border-2 flex items-center justify-center p-1 transition-all shadow-xs ${
                  currentView === 'front'
                    ? 'border-neutral-900 ring-2 ring-neutral-900/10 scale-105'
                    : 'border-neutral-200 hover:border-neutral-400 opacity-70'
                }`}
                title="Front View"
              >
                <TShirtCanvas
                  color={selectedColor.hex}
                  viewMode="front"
                  graphics={designs.front.graphics}
                />
              </button>

              <button
                onClick={() => setCurrentView('back')}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border-2 flex items-center justify-center p-1 transition-all shadow-xs ${
                  currentView === 'back'
                    ? 'border-neutral-900 ring-2 ring-neutral-900/10 scale-105'
                    : 'border-neutral-200 hover:border-neutral-400 opacity-70'
                }`}
                title="Back View"
              >
                <TShirtCanvas
                  color={selectedColor.hex}
                  viewMode="back"
                  graphics={designs.back.graphics}
                />
              </button>

              <button
                onClick={() => setCurrentView('sleeve')}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border-2 flex items-center justify-center p-1 transition-all shadow-xs ${
                  currentView === 'sleeve'
                    ? 'border-neutral-900 ring-2 ring-neutral-900/10 scale-105'
                    : 'border-neutral-200 hover:border-neutral-400 opacity-70'
                }`}
                title="Sleeve View"
              >
                <TShirtCanvas
                  color={selectedColor.hex}
                  viewMode="sleeve"
                  graphics={designs.sleeve.graphics}
                />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT OPTIONS & ORDER PANEL (Responsive)                   */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-neutral-200/80 p-5 sm:p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              
              {/* T-Shirt Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-2">
                  T-Shirt Type
                </label>
                <div className="relative">
                  <select
                    value={tshirtType}
                    onChange={e => setTshirtType(e.target.value)}
                    className="w-full appearance-none bg-white border border-neutral-300 rounded-xl px-4 py-2.5 sm:py-3 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
                  >
                    <option value="Oversized T-Shirt">Oversized T-Shirt</option>
                    <option value="Classic Regular Fit">Classic Regular Fit</option>
                    <option value="Heavyweight Boxy Tee">Heavyweight Boxy Tee</option>
                    <option value="Pique Polo T-Shirt">Pique Polo T-Shirt</option>
                    <option value="Pullover Hoodie">Pullover Hoodie</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  {COLOR_PALETTE.slice(0, 5).map(c => {
                    const isSelected = selectedColor.hex === c.hex
                    return (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110 shadow-sm'
                            : 'hover:scale-105'
                        } ${c.border ? 'border border-neutral-300' : ''}`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <Check
                            className={`w-4 h-4 ${
                              c.hex === '#FFFFFF' || c.hex === '#F3F4F6'
                                ? 'text-black stroke-[3]'
                                : 'text-white stroke-[3]'
                            }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Size Buttons */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-2">
                  Size
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['S', 'M', 'L', 'XL', 'XXL'] as TShirtSize[]).map(size => {
                    const isSelected = selectedSize === size
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-9 sm:w-11 sm:h-10 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                            : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quantity Counter */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-2">
                  Quantity
                </label>
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

            {/* Price & Add to Cart Action */}
            <div className="space-y-3 pt-5 border-t border-neutral-100">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-extrabold text-neutral-900">
                  ₹{499 * quantity}
                </span>
                <span className="text-sm text-neutral-400 line-through font-medium">
                  ₹{1199 * quantity}
                </span>
                <span className="text-xs font-extrabold text-neutral-900 tracking-tight">
                  58% OFF
                </span>
              </div>

              {savedCloudMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200 animate-fade-in">
                  ✓ {savedCloudMessage}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className={`shine-button w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-xl transition-all duration-200 active:scale-95 ${addedToast ? 'bg-emerald-600 hover:bg-emerald-700 animate-spring-pop' : 'bg-neutral-900 hover:bg-neutral-800'}`}
              >
                {addedToast ? <Check className="w-4 h-4 stroke-[2.5]" /> : <ShoppingCart className="w-4 h-4 stroke-[2.2]" />}
                <span>{addedToast ? 'Addedd to the cart' : 'Add to the Cart'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSavingCloud}
                className="w-full py-2.5 rounded-xl border border-neutral-200 hover:border-neutral-900 active:scale-95 text-neutral-700 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200"
              >
                <CloudUpload className="w-4 h-4 text-neutral-500" />
                <span>{isSavingCloud ? 'Saving...' : 'Save Design on This Device'}</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR FOR INSTANT CHECKOUT */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 px-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div>
          <span className="text-[11px] text-neutral-400 font-medium block">Total Price</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-neutral-900">₹{499 * quantity}</span>
            <span className="text-[11px] text-neutral-400 line-through">₹{1199 * quantity}</span>
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          className={`py-3 px-6 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition ${addedToast ? 'bg-emerald-600 animate-spring-pop' : 'bg-neutral-900'}`}
        >
          {addedToast ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          <span>{addedToast ? 'Addedd to the cart' : 'Add to the Cart'}</span>
        </button>
      </div>

    </div>
  )
}
