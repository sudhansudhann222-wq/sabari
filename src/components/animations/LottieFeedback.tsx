import React from 'react'
import { Lottie } from 'lottie-react'

// Lightweight procedural Lottie JSON animations
// 1. Success Celebration Checkmark
const successAnimationData = {
  v: '5.5.7',
  fr: 60,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: 'SuccessCheck',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Checkmark',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 10, s: [0, 0, 100], e: [120, 120, 100] },
            { t: 25, s: [120, 120, 100], e: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'sh',
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-16, 2], [-4, 14], [18, -12]],
                  c: false
                }
              }
            },
            {
              ty: 'st',
              c: { a: 0, k: [0.07, 0.09, 0.15, 1] }, // Dark streetwear stroke
              o: { a: 0, k: 100 },
              w: { a: 0, k: 5 },
              lc: 2,
              lj: 2
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'CircleRing',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [40, 40, 100], e: [105, 105, 100] },
            { t: 20, s: [105, 105, 100], e: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: 'el',
          d: 1,
          s: { a: 0, k: [80, 80] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: 'st',
          c: { a: 0, k: [0.07, 0.09, 0.15, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 4 }
        },
        {
          ty: 'fl',
          c: { a: 0, k: [0.95, 0.96, 0.98, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
}

// 2. Empty Cart Illustration
const emptyCartAnimationData = {
  v: '5.5.7',
  fr: 60,
  ip: 0,
  op: 120,
  w: 140,
  h: 140,
  nm: 'EmptyCart',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'BagBody',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [-4] },
            { t: 30, s: [-4], e: [4] },
            { t: 60, s: [4], e: [-2] },
            { t: 90, s: [-2], e: [0] }
          ]
        },
        p: {
          a: 1,
          k: [
            { t: 0, s: [70, 70, 0], e: [70, 66, 0] },
            { t: 60, s: [70, 66, 0], e: [70, 70, 0] }
          ]
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: 'rc',
          d: 1,
          s: { a: 0, k: [60, 60] },
          p: { a: 0, k: [0, 10] },
          r: { a: 0, k: 8 }
        },
        {
          ty: 'st',
          c: { a: 0, k: [0.15, 0.15, 0.15, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3.5 }
        },
        {
          ty: 'fl',
          c: { a: 0, k: [0.97, 0.97, 0.98, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
}

interface LottieFeedbackProps {
  type: 'success' | 'empty-cart' | 'loading'
  className?: string
  loop?: boolean
}

export const LottieFeedback: React.FC<LottieFeedbackProps> = ({
  type,
  className = 'w-20 h-20 mx-auto',
  loop = false
}) => {
  const data = type === 'success' ? successAnimationData : emptyCartAnimationData

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        src={data}
        autoplay
        loop={loop || type === 'empty-cart'}
        className="w-full h-full"
      />
    </div>
  )
}
