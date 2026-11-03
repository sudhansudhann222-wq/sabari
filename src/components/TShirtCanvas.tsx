import React, { useRef, useState, useEffect } from 'react'
import { CustomGraphicElement, CustomTextElement } from '../types'
import { PRESET_GRAPHICS } from '../data/graphics'
import { Upload } from 'lucide-react'

interface TShirtCanvasProps {
  color: string
  viewMode?: 'front' | 'back' | 'sleeve'
  graphics?: CustomGraphicElement[]
  texts?: CustomTextElement[]
  showDashedArea?: boolean
  interactive?: boolean
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
  onEmptyAreaClick?: () => void
  onUpdateGraphic?: (id: string, updates: Partial<CustomGraphicElement>) => void
  onUpdateText?: (id: string, updates: Partial<CustomTextElement>) => void
  className?: string
  presetGraphicId?: string
  modelType?: 'flat' | 'male-model' | 'female-model'
  bracketColor?: string
  isCustomizableBase?: boolean
}

export const TShirtCanvas: React.FC<TShirtCanvasProps> = ({
  color = '#121212',
  viewMode = 'front',
  graphics = [],
  texts = [],
  showDashedArea = false,
  interactive = false,
  selectedElementId = null,
  onSelectElement,
  onEmptyAreaClick,
  onUpdateGraphic,
  onUpdateText,
  className = '',
  presetGraphicId,
  modelType = 'flat',
  bracketColor,
  isCustomizableBase = false
}) => {
  const isDark = color === '#121212' || color === '#374151' || color === '#1E3A8A' || color === '#14532D' || color === '#831843' || color === '#B91C1C'
  const isWhite = color === '#FFFFFF' || color === '#F3F4F6'

  // Model image resolution based on modelType and color
  const getModelImage = () => {
    const c = color.toLowerCase()
    if (modelType === 'male-model') {
      if (c === '#c2783b') return 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80'
      if (c === '#ffffff' || c === '#f3f4f6') return 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=80'
      if (c === '#374151' || c === '#9ca3af') return 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80'
      return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'
    }
    if (modelType === 'female-model') {
      if (c === '#e08a6c') return 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80'
      if (c === '#b91c1c') return 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'
      if (c === '#ffffff' || c === '#f3f4f6') return 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=900&q=80'
      return 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80'
    }
    return null
  }

  const modelImageSrc = modelType !== 'flat' ? getModelImage() : null

  const printAreaRef = useRef<HTMLDivElement>(null)
  const presetGraphic = presetGraphicId ? PRESET_GRAPHICS.find(g => g.id === presetGraphicId) : null

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragRef = useRef<{
    id: string
    type: 'graphic' | 'text'
    startX: number
    startY: number
    initialElemX: number
    initialElemY: number
  } | null>(null)

  // Mouse Move & Up Listeners
  useEffect(() => {
    if (!interactive) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !printAreaRef.current) return
      const rect = printAreaRef.current.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const deltaX = e.clientX - dragRef.current.startX
      const deltaY = e.clientY - dragRef.current.startY

      const deltaPercentX = (deltaX / rect.width) * 100
      const deltaPercentY = (deltaY / rect.height) * 100

      const newX = Math.max(12, Math.min(88, dragRef.current.initialElemX + deltaPercentX))
      const newY = Math.max(12, Math.min(88, dragRef.current.initialElemY + deltaPercentY))

      if (dragRef.current.type === 'graphic') {
        onUpdateGraphic?.(dragRef.current.id, { x: Math.round(newX), y: Math.round(newY) })
      } else {
        onUpdateText?.(dragRef.current.id, { x: Math.round(newX), y: Math.round(newY) })
      }
    }

    const handleMouseUp = () => {
      dragRef.current = null
      setDraggingId(null)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current || !printAreaRef.current || !e.touches[0]) return
      const rect = printAreaRef.current.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - dragRef.current.startX
      const deltaY = touch.clientY - dragRef.current.startY

      const deltaPercentX = (deltaX / rect.width) * 100
      const deltaPercentY = (deltaY / rect.height) * 100

      const newX = Math.max(12, Math.min(88, dragRef.current.initialElemX + deltaPercentX))
      const newY = Math.max(12, Math.min(88, dragRef.current.initialElemY + deltaPercentY))

      if (dragRef.current.type === 'graphic') {
        onUpdateGraphic?.(dragRef.current.id, { x: Math.round(newX), y: Math.round(newY) })
      } else {
        onUpdateText?.(dragRef.current.id, { x: Math.round(newX), y: Math.round(newY) })
      }
    }

    const handleTouchEnd = () => {
      dragRef.current = null
      setDraggingId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [interactive, onUpdateGraphic, onUpdateText])

  const startDrag = (id: string, type: 'graphic' | 'text', clientX: number, clientY: number, elemX: number, elemY: number) => {
    dragRef.current = {
      id,
      type,
      startX: clientX,
      startY: clientY,
      initialElemX: elemX,
      initialElemY: elemY
    }
    setDraggingId(id)
    onSelectElement?.(id)
  }

  return (
    <div className={`relative w-full aspect-square flex items-center justify-center select-none overflow-hidden cursor-default ${className}`}>
      {/* Model Mode OR Flat SVG Garment Mode */}
      {modelImageSrc ? (
        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner flex items-center justify-center bg-neutral-200">
          <img
            src={modelImageSrc}
            alt="Model View"
            className="w-full h-full object-cover object-top select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full transition-all duration-300 filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.18)]"
          xmlns="http://www.w3.org/2000/svg"
        >
        <defs>
          <linearGradient id="bodyLighting" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? "0.15" : "0.5"} />
            <stop offset="25%" stopColor="#ffffff" stopOpacity={isDark ? "0.05" : "0.2"} />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
            <stop offset="85%" stopColor="#000000" stopOpacity={isDark ? "0.25" : "0.12"} />
            <stop offset="100%" stopColor="#000000" stopOpacity={isDark ? "0.45" : "0.22"} />
          </linearGradient>

          <radialGradient id="torsoFold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? "0.08" : "0.25"} />
            <stop offset="70%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={isDark ? "0.3" : "0.1"} />
          </radialGradient>

          <linearGradient id="leftSleeveShadow" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={isDark ? "0.4" : "0.2"} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="rightSleeveShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={isDark ? "0.4" : "0.2"} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {viewMode === 'front' && (
          <g>
            {/* 1. Behind Collar / Inner Back Neck with Brand Label */}
            <path
              d="M 235 98 C 265 118, 335 118, 365 98 C 340 85, 260 85, 235 98 Z"
              fill={isDark ? "#18181b" : "#94a3b8"}
              stroke="#000000"
              strokeWidth="0.5"
              strokeOpacity="0.2"
            />
            <rect x="282" y="93" width="36" height="16" rx="2" fill="#fafafa" opacity="0.85" />
            <text x="300" y="104" fontSize="6" fontFamily="sans-serif" fontWeight="900" fill="#111827" textAnchor="middle">TEECRAFT</text>

            {/* 2. Main Garment Body & Sleeves */}
            <path
              d="M 235 98
                 C 255 125, 345 125, 365 98
                 L 435 114
                 C 475 124, 510 148, 545 178
                 L 490 286
                 C 475 280, 460 270, 442 250
                 L 446 498
                 C 446 512, 432 522, 418 522
                 L 182 522
                 C 168 522, 154 512, 154 498
                 L 158 250
                 C 140 270, 125 280, 110 286
                 L 55 178
                 C 90 148, 125 124, 165 114
                 Z"
              fill={color}
              stroke={isWhite ? "#cbd5e1" : "#18181b"}
              strokeWidth="1.5"
            />

            {/* 3. Soft 3D Lighting */}
            <path
              d="M 235 98 C 255 125, 345 125, 365 98 L 435 114 C 475 124, 510 148, 545 178 L 490 286 C 475 280, 460 270, 442 250 L 446 498 C 446 512, 432 522, 418 522 L 182 522 C 168 522, 154 512, 154 498 L 158 250 C 140 270, 125 280, 110 286 L 55 178 C 90 148, 125 124, 165 114 Z"
              fill="url(#bodyLighting)"
            />

            {/* 4. Torso Center Fabric Fold */}
            <rect x="156" y="160" width="288" height="360" fill="url(#torsoFold)" opacity="0.7" />

            {/* 5. Realistic Creases */}
            <path
              d="M 158 248 C 168 200, 175 160, 192 120"
              stroke="#000000"
              strokeWidth="2.5"
              strokeOpacity={isDark ? "0.35" : "0.15"}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 442 248 C 432 200, 425 160, 408 120"
              stroke="#000000"
              strokeWidth="2.5"
              strokeOpacity={isDark ? "0.35" : "0.15"}
              fill="none"
              strokeLinecap="round"
            />

            <path d="M 158 248 L 110 286 L 125 295 L 165 258 Z" fill="url(#leftSleeveShadow)" />
            <path d="M 442 248 L 490 286 L 475 295 L 435 258 Z" fill="url(#rightSleeveShadow)" />

            {/* 6. Collar */}
            <path
              d="M 235 98
                 C 255 130, 345 130, 365 98
                 C 375 106, 365 118, 345 136
                 C 320 148, 280 148, 255 136
                 C 235 118, 225 106, 235 98
                 Z"
              fill={color}
              stroke={isWhite ? "#94a3b8" : "#000000"}
              strokeWidth="1.8"
            />
            <path
              d="M 245 112 C 265 138, 335 138, 355 112"
              stroke={isDark ? "#ffffff" : "#000000"}
              strokeWidth="1"
              strokeOpacity="0.15"
              fill="none"
            />

            {/* 7. Hem Stitching */}
            <path
              d="M 160 508 L 440 508"
              stroke={isWhite ? "#94a3b8" : "#ffffff"}
              strokeWidth="1"
              strokeDasharray="4 2"
              strokeOpacity={isDark ? "0.2" : "0.3"}
              fill="none"
            />
          </g>
        )}

        {viewMode === 'back' && (
          <g>
            <path
              d="M 235 98
                 C 265 92, 335 92, 365 98
                 L 435 114
                 C 475 124, 510 148, 545 178
                 L 490 286
                 C 475 280, 460 270, 442 250
                 L 446 498
                 C 446 512, 432 522, 418 522
                 L 182 522
                 C 168 522, 154 512, 154 498
                 L 158 250
                 C 140 270, 125 280, 110 286
                 L 55 178
                 C 90 148, 125 124, 165 114
                 Z"
              fill={color}
              stroke={isWhite ? "#cbd5e1" : "#18181b"}
              strokeWidth="1.5"
            />
            <path
              d="M 235 98 C 265 92, 335 92, 365 98 L 435 114 C 475 124, 510 148, 545 178 L 490 286 C 475 280, 460 270, 442 250 L 446 498 C 446 512, 432 522, 418 522 L 182 522 C 168 522, 154 512, 154 498 L 158 250 C 140 270, 125 280, 110 286 L 55 178 C 90 148, 125 124, 165 114 Z"
              fill="url(#bodyLighting)"
            />
            <path
              d="M 235 98 C 275 105, 325 105, 365 98 C 355 112, 245 112, 235 98 Z"
              fill={color}
              stroke={isWhite ? "#94a3b8" : "#000000"}
              strokeWidth="1.5"
            />
            <path
              d="M 195 142 Q 300 155, 405 142"
              stroke={isWhite ? "#94a3b8" : "#ffffff"}
              strokeWidth="1.2"
              strokeDasharray="4 2"
              strokeOpacity="0.25"
              fill="none"
            />
          </g>
        )}

        {viewMode === 'sleeve' && (
          <g>
            <path
              d="M 240 90
                 C 290 85, 350 95, 370 120
                 L 405 290
                 C 405 300, 395 310, 380 310
                 L 280 310
                 L 265 485
                 C 265 500, 255 510, 240 510
                 L 165 510
                 C 150 510, 140 500, 140 485
                 L 165 145
                 Z"
              fill={color}
              stroke={isWhite ? "#cbd5e1" : "#18181b"}
              strokeWidth="1.5"
            />
            <path
              d="M 240 90 C 290 85, 350 95, 370 120 L 405 290 C 405 300, 395 310, 380 310 L 280 310 L 265 485 C 265 500, 255 510, 240 510 L 165 510 C 150 510, 140 500, 140 485 L 165 145 Z"
              fill="url(#bodyLighting)"
            />
          </g>
        )}
      </svg>
      )}

      {/* Printable Area - Perfectly Positioned on Chest / Back */}
      {viewMode !== 'sleeve' ? (
        <div
          ref={printAreaRef}
          className={`absolute z-10 transition-all ${
            modelImageSrc
              ? 'top-[30%] left-[27%] w-[46%] h-[42%]'
              : viewMode === 'back'
              ? 'top-[26%] left-[30%] w-[40%] h-[48%]'
              : 'top-[28%] left-[30%] w-[40%] h-[46%]'
          } flex flex-col items-center justify-center ${
            showDashedArea && !bracketColor && !isCustomizableBase
              ? 'border-2 border-dashed border-white/50 bg-black/5 rounded-2xl p-2'
              : ''
          }`}
          onClick={() => interactive && onSelectElement?.(null)}
        >
          {/* Preset Graphic Preview */}
          {presetGraphic && !graphics.length && (
            <div
              className="w-full h-full flex items-center justify-center p-1 drop-shadow-sm pointer-events-none"
              dangerouslySetInnerHTML={{ __html: presetGraphic.svgContent }}
            />
          )}

          {/* 4 Corner Crop Brackets (Bewakoof Style Reference) with subtle breathing pulse */}
          {(showDashedArea || isCustomizableBase || bracketColor) && (
            <div className="absolute inset-0 pointer-events-none p-0.5 animate-bracket-pulse">
              <div 
                className="absolute top-0 left-0 w-5 h-5 border-t-[3.5px] border-l-[3.5px] rounded-tl-xs"
                style={{ borderColor: bracketColor || (isDark ? '#38bdf8' : '#0ea5e9') }}
              />
              <div 
                className="absolute top-0 right-0 w-5 h-5 border-t-[3.5px] border-r-[3.5px] rounded-tr-xs"
                style={{ borderColor: bracketColor || (isDark ? '#38bdf8' : '#0ea5e9') }}
              />
              <div 
                className="absolute bottom-0 left-0 w-5 h-5 border-b-[3.5px] border-l-[3.5px] rounded-bl-xs"
                style={{ borderColor: bracketColor || (isDark ? '#38bdf8' : '#0ea5e9') }}
              />
              <div 
                className="absolute bottom-0 right-0 w-5 h-5 border-b-[3.5px] border-r-[3.5px] rounded-br-xs"
                style={{ borderColor: bracketColor || (isDark ? '#38bdf8' : '#0ea5e9') }}
              />
            </div>
          )}

          {/* Empty State: matches Image 3 and Bewakoof Reference */}
          {(showDashedArea || isCustomizableBase) && graphics.length === 0 && texts.length === 0 && !presetGraphic && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onEmptyAreaClick?.()
              }}
              className="flex flex-col items-center justify-center text-center p-2 cursor-pointer select-none hover:scale-105 transition-transform z-20 group/upload"
            >
              {isCustomizableBase || bracketColor ? (
                <div className="text-center font-black text-xs md:text-sm tracking-wider uppercase leading-tight select-none drop-shadow-sm">
                  <span className={isDark || color === '#B91C1C' ? 'text-white' : 'text-neutral-900'}>
                    YOUR DESIGN<br/>HERE
                  </span>
                  {showDashedArea && (
                    <p className={`text-[9px] mt-1 font-semibold group-hover/upload:underline normal-case ${
                      isDark || color === '#B91C1C' ? 'text-white/70' : 'text-neutral-600'
                    }`}>
                      (Click to customize)
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1">
                    <Upload className="w-8 h-8 stroke-[1.8] text-white animate-pulse" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold tracking-tight text-white leading-tight">
                    Upload Your Design
                  </p>
                  <p className="text-[10px] md:text-xs text-white/70 mt-0.5 font-normal">
                    (or drag & drop)
                  </p>
                </>
              )}
            </div>
          )}

          {/* Custom Graphics on the shirt with full mouse drag support */}
          {graphics.map(item => {
            const isSelected = selectedElementId === item.id
            const isBeingDragged = draggingId === item.id
            const foundPreset = item.graphicId ? PRESET_GRAPHICS.find(g => g.id === item.graphicId) : null
            const content = item.svgContent || foundPreset?.svgContent

            return (
              <div
                key={item.id}
                onMouseDown={e => {
                  if (interactive) {
                    e.stopPropagation()
                    startDrag(item.id, 'graphic', e.clientX, e.clientY, item.x, item.y)
                  }
                }}
                onTouchStart={e => {
                  if (interactive && e.touches[0]) {
                    e.stopPropagation()
                    startDrag(item.id, 'graphic', e.touches[0].clientX, e.touches[0].clientY, item.x, item.y)
                  }
                }}
                className={`absolute select-none transition-all duration-100 ${
                  isBeingDragged
                    ? 'cursor-grabbing scale-105 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] z-30'
                    : 'cursor-grab hover:cursor-grab z-10'
                } ${
                  isSelected && interactive ? 'ring-2 ring-blue-500 rounded-xl ring-offset-2 ring-offset-transparent shadow-lg animate-spring-pop' : ''
                }`}
                style={{
                  top: `${item.y}%`,
                  left: `${item.x}%`,
                  width: `${item.width}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                  touchAction: 'none'
                }}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="custom design" className="w-full h-auto object-contain drop-shadow-sm rounded-lg pointer-events-none" />
                ) : content ? (
                  <div
                    className="w-full h-auto drop-shadow-sm pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : null}
              </div>
            )
          })}

          {/* Custom Texts on the shirt with mouse drag support */}
          {texts.map(txt => {
            const isSelected = selectedElementId === txt.id
            const isBeingDragged = draggingId === txt.id

            return (
              <div
                key={txt.id}
                onMouseDown={e => {
                  if (interactive) {
                    e.stopPropagation()
                    startDrag(txt.id, 'text', e.clientX, e.clientY, txt.x, txt.y)
                  }
                }}
                onTouchStart={e => {
                  if (interactive && e.touches[0]) {
                    e.stopPropagation()
                    startDrag(txt.id, 'text', e.touches[0].clientX, e.touches[0].clientY, txt.x, txt.y)
                  }
                }}
                className={`absolute whitespace-nowrap select-none transition-all duration-100 ${
                  isBeingDragged
                    ? 'cursor-grabbing scale-110 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] z-30'
                    : 'cursor-grab hover:cursor-grab z-10'
                } ${
                  isSelected && interactive ? 'ring-2 ring-blue-500 px-2 py-0.5 rounded-lg ring-offset-2 ring-offset-transparent shadow-md animate-spring-pop' : ''
                }`}
                style={{
                  top: `${txt.y}%`,
                  left: `${txt.x}%`,
                  transform: `translate(-50%, -50%) rotate(${txt.rotation}deg)`,
                  fontFamily: txt.fontFamily,
                  fontSize: `${txt.fontSize}px`,
                  color: txt.color,
                  fontWeight: txt.fontWeight,
                  letterSpacing: `${txt.letterSpacing}px`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  touchAction: 'none'
                }}
              >
                {txt.text}
              </div>
            )
          })}
        </div>
      ) : (
        /* Sleeve printable area */
        <div
          className={`absolute z-10 top-[28%] left-[45%] w-[26%] h-[24%] flex flex-col items-center justify-center ${
            showDashedArea ? 'border-2 border-dashed border-white/50 bg-black/5 rounded-xl p-2' : ''
          }`}
        >
          {showDashedArea && graphics.length === 0 && texts.length === 0 && (
            <div className="text-center text-white/90">
              <Upload className="w-5 h-5 mx-auto mb-1" />
              <p className="text-[9px] font-semibold">Sleeve Print</p>
            </div>
          )}
          {graphics.map(item => {
            const foundPreset = item.graphicId ? PRESET_GRAPHICS.find(g => g.id === item.graphicId) : null
            return (
              <div key={item.id} className="w-full h-full flex items-center justify-center pointer-events-none">
                {foundPreset && (
                  <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: foundPreset.svgContent }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
