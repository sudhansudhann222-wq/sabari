import React from 'react'
import { Sparkles, Shield, Leaf, HeartHandshake, Layers } from 'lucide-react'

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The TeeCraft Craftsmanship</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight">
          We Re-engineered the Everyday T-Shirt
        </h1>
        <p className="text-neutral-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Born out of a simple frustration with thin, ill-fitting tees that shrink after a single wash. TeeCraft brings heavyweight architectural streetwear silhouettes to creators across India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-neutral-900">240 GSM Combed French Terry</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Twice the density of standard tees. We use 100% long-staple combed cotton spun with zero micro-fibril breakage, pre-shrunk so your tee holds its signature drop-shoulder fit forever.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-neutral-900">Japanese Ultra-HD DTG Inks</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Our state-of-the-art Direct-to-Garment printers inject water-based OEKO-TEX certified pigment directly into the fabric pores. No plastic rubbery feel, completely breathable, and guaranteed 50+ wash cycles without peeling.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
            <Leaf className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-neutral-900">Sustainable Zero-Waste Production</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Because we print on demand, zero surplus garments end up in landfills. Our packaging is 100% compostable corn-starch based, shipped with carbon-neutral logistics across all 28 Indian states.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-neutral-900">Crafted with Fair Wages</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Every stitch is tailored in our ethically run manufacturing facility in Tirupur, India, ensuring fair living wages, medical coverage, and proud artisan craftsmanship in every garment.
          </p>
        </div>
      </div>
    </div>
  )
}

