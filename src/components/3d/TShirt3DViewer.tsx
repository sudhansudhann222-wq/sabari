import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Float } from '@react-three/drei'
import * as THREE from 'three'
import { CustomGraphicElement, CustomTextElement, SideDesign } from '../../types'
import { PRESET_GRAPHICS } from '../../data/graphics'
import { RotateCw, ZoomIn, ZoomOut, Compass, Eye } from 'lucide-react'

interface TShirt3DViewerProps {
  color: string
  frontDesign?: SideDesign
  backDesign?: SideDesign
  sleeveDesign?: SideDesign
  className?: string
  isCustomizableBase?: boolean
  bracketColor?: string
}

// -------------------------------------------------------------
// Procedural Dynamic Canvas Texture Generator
// -------------------------------------------------------------
function useTShirtTexture({
  color,
  frontDesign,
  backDesign,
  isCustomizableBase,
  bracketColor = '#0ea5e9'
}: {
  color: string
  frontDesign?: SideDesign
  backDesign?: SideDesign
  isCustomizableBase?: boolean
  bracketColor?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let canvas = canvasRef.current
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      canvasRef.current = canvas
      const newTex = new THREE.CanvasTexture(canvas)
      newTex.colorSpace = THREE.SRGBColorSpace
      setTexture(newTex)
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Fill base t-shirt color
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1024, 1024)

    // Subtle fabric grain texture simulation
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
    for (let i = 0; i < 1024; i += 4) {
      ctx.fillRect(0, i, 1024, 1)
    }

    // 2. Draw Front Chest Print Area (Center ~ x: 512, y: 460, width: 340, height: 380)
    const frontArea = { x: 512, y: 480, w: 360, h: 420 }

    const hasFrontGraphics = frontDesign && frontDesign.graphics.length > 0
    const hasFrontTexts = frontDesign && frontDesign.texts.length > 0

    // Corner crop brackets if empty customizable base
    if ((isCustomizableBase || bracketColor) && !hasFrontGraphics && !hasFrontTexts) {
      ctx.save()
      ctx.strokeStyle = bracketColor
      ctx.lineWidth = 8
      ctx.lineCap = 'square'

      const bw = 120
      const bh = 120
      const bx = frontArea.x - bw
      const by = frontArea.y - bh
      const bSize = 36

      // Top Left
      ctx.beginPath()
      ctx.moveTo(bx, by + bSize)
      ctx.lineTo(bx, by)
      ctx.lineTo(bx + bSize, by)
      ctx.stroke()

      // Top Right
      ctx.beginPath()
      ctx.moveTo(bx + bw * 2 - bSize, by)
      ctx.lineTo(bx + bw * 2, by)
      ctx.lineTo(bx + bw * 2, by + bSize)
      ctx.stroke()

      // Bottom Left
      ctx.beginPath()
      ctx.moveTo(bx, by + bh * 2 - bSize)
      ctx.lineTo(bx, by + bh * 2)
      ctx.lineTo(bx + bSize, by + bh * 2)
      ctx.stroke()

      // Bottom Right
      ctx.beginPath()
      ctx.moveTo(bx + bw * 2 - bSize, by + bh * 2)
      ctx.lineTo(bx + bw * 2, by + bh * 2)
      ctx.lineTo(bx + bw * 2, by + bh * 2 - bSize)
      ctx.stroke()

      // Text "YOUR DESIGN HERE"
      const isDark = color === '#121212' || color === '#374151' || color === '#1E3A8A' || color === '#14532D' || color === '#831843'
      ctx.fillStyle = isDark ? '#ffffff' : '#111827'
      ctx.font = '900 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('YOUR DESIGN', frontArea.x, frontArea.y - 16)
      ctx.fillText('HERE', frontArea.x, frontArea.y + 20)
      ctx.restore()
    }

    // Draw Front Graphic elements
    if (frontDesign?.graphics) {
      frontDesign.graphics.forEach((g) => {
        const preset = g.graphicId ? PRESET_GRAPHICS.find((p) => p.id === g.graphicId) : null
        const targetX = frontArea.x + ((g.x - 50) / 50) * (frontArea.w / 2)
        const targetY = frontArea.y + ((g.y - 50) / 50) * (frontArea.h / 2)
        const targetW = (g.width / 100) * frontArea.w

        if (g.imageUrl) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = g.imageUrl
          img.onload = () => {
            ctx.save()
            ctx.translate(targetX, targetY)
            ctx.rotate((g.rotation * Math.PI) / 180)
            ctx.drawImage(img, -targetW / 2, -targetW / 2, targetW, targetW)
            ctx.restore()
            if (texture) texture.needsUpdate = true
          }
        } else if (preset) {
          // Render vector SVG string as data URL on offscreen image
          const svgBlob = new Blob([preset.svgContent], { type: 'image/svg+xml;charset=utf-8' })
          const URL = window.URL || window.webkitURL || window
          const blobURL = URL.createObjectURL(svgBlob)
          const img = new Image()
          img.src = blobURL
          img.onload = () => {
            ctx.save()
            ctx.translate(targetX, targetY)
            ctx.rotate((g.rotation * Math.PI) / 180)
            ctx.drawImage(img, -targetW / 2, -targetW / 2, targetW, targetW)
            ctx.restore()
            URL.revokeObjectURL(blobURL)
            if (texture) texture.needsUpdate = true
          }
        }
      })
    }

    // Draw Front Text elements
    if (frontDesign?.texts) {
      frontDesign.texts.forEach((t) => {
        const targetX = frontArea.x + ((t.x - 50) / 50) * (frontArea.w / 2)
        const targetY = frontArea.y + ((t.y - 50) / 50) * (frontArea.h / 2)

        ctx.save()
        ctx.translate(targetX, targetY)
        ctx.rotate((t.rotation * Math.PI) / 180)
        ctx.font = `${t.fontWeight || 'bold'} ${t.fontSize * 1.6}px ${t.fontFamily || 'sans-serif'}`
        ctx.fillStyle = t.color || '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = 4
        ctx.fillText(t.text, 0, 0)
        ctx.restore()
      })
    }

    if (texture) {
      texture.needsUpdate = true
    }
  }, [color, frontDesign, backDesign, isCustomizableBase, bracketColor, texture])

  return texture
}

function useSideDesignTexture(design?: SideDesign) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    if (!design || (!design.graphics.length && !design.texts.length)) {
      setTexture(null)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const nextTexture = new THREE.CanvasTexture(canvas)
    nextTexture.colorSpace = THREE.SRGBColorSpace
    nextTexture.needsUpdate = true
    setTexture(nextTexture)

    const area = { x: 512, y: 512, w: 700, h: 760 }
    const drawGraphic = (g: CustomGraphicElement) => {
      const preset = g.graphicId ? PRESET_GRAPHICS.find(p => p.id === g.graphicId) : null
      const targetX = area.x + ((g.x - 50) / 50) * (area.w / 2)
      const targetY = area.y + ((g.y - 50) / 50) * (area.h / 2)
      const targetW = (g.width / 100) * area.w
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.save()
        ctx.translate(targetX, targetY)
        ctx.rotate((g.rotation * Math.PI) / 180)
        ctx.drawImage(img, -targetW / 2, -targetW / 2, targetW, targetW)
        ctx.restore()
        nextTexture.needsUpdate = true
      }
      if (g.imageUrl) img.src = g.imageUrl
      else if (preset) {
        const url = URL.createObjectURL(new Blob([preset.svgContent], { type: 'image/svg+xml;charset=utf-8' }))
        img.onload = () => {
          ctx.save()
          ctx.translate(targetX, targetY)
          ctx.rotate((g.rotation * Math.PI) / 180)
          ctx.drawImage(img, -targetW / 2, -targetW / 2, targetW, targetW)
          ctx.restore()
          URL.revokeObjectURL(url)
          nextTexture.needsUpdate = true
        }
        img.src = url
      }
    }

    design.graphics.forEach(drawGraphic)
    design.texts.forEach(t => {
      const targetX = area.x + ((t.x - 50) / 50) * (area.w / 2)
      const targetY = area.y + ((t.y - 50) / 50) * (area.h / 2)
      ctx.save()
      ctx.translate(targetX, targetY)
      ctx.rotate((t.rotation * Math.PI) / 180)
      ctx.font = `${t.fontWeight || 'bold'} ${t.fontSize * 1.6}px ${t.fontFamily || 'sans-serif'}`
      ctx.fillStyle = t.color || '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 4
      ctx.fillText(t.text, 0, 0)
      ctx.restore()
    })

    return () => nextTexture.dispose()
  }, [design])

  return texture
}

// -------------------------------------------------------------
// 3D T-Shirt Mesh Representation
// -------------------------------------------------------------
function TShirtMesh({
  color,
  texture,
  backTexture,
  sleeveTexture
}: {
  color: string
  texture: THREE.CanvasTexture | null
  backTexture: THREE.CanvasTexture | null
  sleeveTexture: THREE.CanvasTexture | null
}) {
  const meshRef = useRef<THREE.Group>(null)

  // Gentle idle hover breathing
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04
    }
  })

  // Material with front design texture and natural fabric roughness
  const fabricMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      map: texture || null,
      roughness: 0.85,
      metalness: 0.08,
      side: THREE.DoubleSide
    })
  }, [color, texture])

  const ribbingMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.9),
      roughness: 0.95,
      metalness: 0.02
    })
  }, [color])

  const overlayMaterial = (map: THREE.CanvasTexture | null) => map ? (
    <meshBasicMaterial map={map} transparent alphaTest={0.01} side={THREE.DoubleSide} depthWrite={false} />
  ) : null

  return (
    <group ref={meshRef} position={[0, -0.2, 0]}>
      {/* 1. Main Torso - Oversized Drop-Shoulder Streetwear Silhouette */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={fabricMaterial}>
        <cylinderGeometry args={[0.9, 0.96, 1.9, 36, 1, false]} />
      </mesh>

      {/* 2. Left Drop Sleeve */}
      <group position={[-1.02, 0.65, 0]} rotation={[0, 0, Math.PI / 5.5]}>
        <mesh castShadow receiveShadow material={fabricMaterial}>
          <cylinderGeometry args={[0.34, 0.38, 0.95, 24]} />
        </mesh>
      </group>

      {/* 3. Right Drop Sleeve */}
      <group position={[1.02, 0.65, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
        <mesh castShadow receiveShadow material={fabricMaterial}>
          <cylinderGeometry args={[0.34, 0.38, 0.95, 24]} />
        </mesh>
      </group>

      {/* 4. Collar Ribbing Ring */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} material={ribbingMaterial}>
        <torusGeometry args={[0.38, 0.045, 16, 40]} />
      </mesh>

      {/* 5. Inner Neck Depth */}
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.15, 24]} />
        <meshBasicMaterial color="#18181b" side={THREE.DoubleSide} />
      </mesh>

      {/* Design decals keep each side independent from the garment base texture. */}
      {texture && <mesh position={[0, 0, 0.965]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.25, 1.45]} />
        {overlayMaterial(texture)}
      </mesh>}
      {backTexture && <mesh position={[0, 0, -0.965]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.25, 1.45]} />
        {overlayMaterial(backTexture)}
      </mesh>}
      {sleeveTexture && <>
        <mesh position={[-1.03, 0.65, 0.02]} rotation={[0, 0, Math.PI / 5.5]}>
          <planeGeometry args={[0.42, 0.58]} />
          {overlayMaterial(sleeveTexture)}
        </mesh>
        <mesh position={[1.03, 0.65, 0.02]} rotation={[0, 0, -Math.PI / 5.5]}>
          <planeGeometry args={[0.42, 0.58]} />
          {overlayMaterial(sleeveTexture)}
        </mesh>
      </>}
    </group>
  )
}

// -------------------------------------------------------------
// Interactive 3D Viewer Container with Camera Presets
// -------------------------------------------------------------
export const TShirt3DViewer: React.FC<TShirt3DViewerProps> = ({
  color,
  frontDesign,
  backDesign,
  sleeveDesign,
  className = 'w-full h-full min-h-[380px]',
  isCustomizableBase = false,
  bracketColor
}) => {
  const controlsRef = useRef<any>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const texture = useTShirtTexture({
    color,
    frontDesign,
    backDesign,
    isCustomizableBase,
    bracketColor
  })
  const backTexture = useSideDesignTexture(backDesign)
  const sleeveTexture = useSideDesignTexture(sleeveDesign)

  // Smooth camera view transitions
  const setCameraAngle = (azimuthAngle: number, polarAngle: number = Math.PI / 2) => {
    if (!controlsRef.current) return
    controlsRef.current.reset()
    controlsRef.current.setAzimuthalAngle(azimuthAngle)
    controlsRef.current.setPolarAngle(polarAngle)
    controlsRef.current.update()
  }

  const handleZoom = (delta: number) => {
    if (!controlsRef.current) return
    const camera = controlsRef.current.object
    if (camera) {
      camera.position.z = Math.max(1.8, Math.min(4.5, camera.position.z + delta))
      controlsRef.current.update()
    }
  }

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#f8f9fa] to-[#eceef1] border border-neutral-200/80 shadow-inner flex flex-col items-center justify-center ${className}`}>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 2.7], fov: 48 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 7, 5]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 3, -4]} intensity={0.6} />
        <directionalLight position={[0, -2, 3]} intensity={0.35} />

        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          <TShirtMesh color={color} texture={texture} backTexture={backTexture} sleeveTexture={sleeveTexture} />
        </Float>

        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.45}
          scale={3.5}
          blur={1.8}
          far={4}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={1.8}
          maxDistance={4.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.7}
          autoRotate={autoRotate}
          autoRotateSpeed={1.8}
        />
      </Canvas>

      {/* Top Floating View Angle Switcher */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Preset Angle Buttons */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1 rounded-2xl border border-neutral-200/80 shadow-sm pointer-events-auto">
          <button
            type="button"
            onClick={() => setCameraAngle(0)}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl hover:bg-neutral-100 text-neutral-800 transition"
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle(Math.PI)}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl hover:bg-neutral-100 text-neutral-800 transition"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle(-Math.PI / 2)}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl hover:bg-neutral-100 text-neutral-800 transition"
          >
            L-Sleeve
          </button>
          <button
            type="button"
            onClick={() => setCameraAngle(Math.PI / 2)}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl hover:bg-neutral-100 text-neutral-800 transition"
          >
            R-Sleeve
          </button>
        </div>

        {/* 360 Spin and Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-neutral-200/80 shadow-sm pointer-events-auto">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-xl transition ${
              autoRotate ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            title={autoRotate ? 'Stop 360 Spin' : '360° Auto Spin'}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.4)}
            className="p-1.5 rounded-xl text-neutral-700 hover:bg-neutral-100 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.4)}
            className="p-1.5 rounded-xl text-neutral-700 hover:bg-neutral-100 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtle Drag Prompt Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-neutral-900/80 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1.5 shadow-sm">
        <Compass className="w-3 h-3 text-cyan-400 animate-spin" />
        <span>Drag to rotate 360° &bull; Pinch to zoom</span>
      </div>

    </div>
  )
}

