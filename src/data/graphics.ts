import { GraphicItem } from '../types'

export const PRESET_GRAPHICS: GraphicItem[] = [
  {
    id: 'astronaut',
    name: 'Astronaut Cosmos',
    category: 'Space',
    svgContent: `
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="185" fill="#111827" stroke="#374151" stroke-width="8"/>
        <!-- Star field -->
        <circle cx="90" cy="90" r="3" fill="#ffffff" opacity="0.9"/>
        <circle cx="310" cy="110" r="4" fill="#ffffff" opacity="0.8"/>
        <circle cx="70" cy="270" r="3" fill="#ffffff" opacity="0.7"/>
        <circle cx="320" cy="260" r="3" fill="#ffffff" opacity="0.8"/>
        <circle cx="150" cy="60" r="2" fill="#ffffff" opacity="0.6"/>
        <circle cx="260" cy="65" r="2.5" fill="#ffffff" opacity="0.7"/>
        <circle cx="180" cy="340" r="3" fill="#ffffff" opacity="0.8"/>
        <circle cx="290" cy="180" r="2" fill="#ffffff" opacity="0.5"/>
        <circle cx="100" cy="180" r="2.5" fill="#ffffff" opacity="0.6"/>
        <circle cx="220" cy="100" r="1.5" fill="#ffffff"/>
        <!-- Planet with ring -->
        <circle cx="105" cy="120" r="18" fill="#374151"/>
        <ellipse cx="105" cy="120" rx="30" ry="7" stroke="#9CA3AF" stroke-width="2" transform="rotate(-20 105 120)"/>
        <!-- Crescent moon -->
        <path d="M 290 80 A 18 18 0 0 1 290 110 A 13 13 0 0 0 290 80 Z" fill="#E5E7EB"/>
        <!-- Astronaut Helmet -->
        <rect x="135" y="110" width="130" height="115" rx="55" fill="#F3F4F6" stroke="#9CA3AF" stroke-width="4"/>
        <!-- Visor -->
        <rect x="145" y="125" width="110" height="75" rx="36" fill="#1F2937" stroke="#4B5563" stroke-width="4"/>
        <path d="M165 140 C 190 135, 220 135, 235 145 C 215 150, 180 150, 165 140 Z" fill="#60A5FA" opacity="0.5"/>
        <!-- Astronaut Suit / Shoulders -->
        <path d="M120 230 C 120 200, 140 215, 200 215 C 260 215, 280 200, 280 230 L 315 360 C 270 380, 130 380, 85 360 Z" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="5"/>
        <!-- Chest pack & straps -->
        <rect x="160" y="240" width="80" height="90" rx="10" fill="#D1D5DB" stroke="#6B7280" stroke-width="3"/>
        <rect x="175" y="255" width="50" height="24" rx="4" fill="#374151"/>
        <circle cx="185" cy="300" r="6" fill="#EF4444"/>
        <circle cx="205" cy="300" r="6" fill="#3B82F6"/>
        <circle cx="225" cy="300" r="6" fill="#10B981"/>
        <!-- Collar ring -->
        <ellipse cx="200" cy="220" rx="45" ry="12" fill="#9CA3AF" stroke="#4B5563" stroke-width="3"/>
      </svg>
    `
  },
  {
    id: 'abstract-lines',
    name: 'Topographic Abstract',
    category: 'Abstract',
    svgContent: `
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" rx="24" fill="#111827"/>
        <path d="M-20 80 Q 80 140, 200 80 T 420 100" stroke="#F3F4F6" stroke-width="5" fill="none"/>
        <path d="M-20 120 Q 90 190, 210 130 T 420 150" stroke="#F3F4F6" stroke-width="4.5" fill="none"/>
        <path d="M-20 160 Q 110 240, 230 180 T 420 200" stroke="#F3F4F6" stroke-width="5" fill="none"/>
        <path d="M-20 200 Q 130 290, 250 230 T 420 250" stroke="#F3F4F6" stroke-width="4.5" fill="none"/>
        <path d="M-20 240 Q 150 330, 270 270 T 420 290" stroke="#F3F4F6" stroke-width="5" fill="none"/>
        <path d="M-20 280 Q 170 370, 290 310 T 420 330" stroke="#F3F4F6" stroke-width="4.5" fill="none"/>
        <path d="M-20 40 Q 70 90, 190 30 T 420 50" stroke="#F3F4F6" stroke-width="4" fill="none"/>
        <path d="M-20 320 Q 180 410, 310 350 T 420 370" stroke="#F3F4F6" stroke-width="4" fill="none"/>
        <circle cx="200" cy="200" r="45" stroke="#F3F4F6" stroke-width="5" stroke-dasharray="8 6"/>
        <circle cx="200" cy="200" r="22" fill="#F3F4F6"/>
      </svg>
    `
  },
  {
    id: 'japanese-wave',
    name: 'Great Wave of Kanagawa',
    category: 'Japanese',
    svgContent: `
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" rx="24" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="4"/>
        <!-- Rising Red Sun -->
        <circle cx="270" cy="160" r="85" fill="#EF4444"/>
        <!-- Mount Fuji in distance -->
        <polygon points="175,250 215,190 255,250" fill="#3B82F6" opacity="0.6"/>
        <polygon points="202,208 215,190 228,208" fill="#FFFFFF"/>
        <!-- Giant Wave -->
        <path d="M 0 340 C 60 340, 100 310, 140 280 C 180 250, 210 220, 210 160 C 200 160, 185 180, 175 195 C 160 180, 140 180, 130 195 C 110 170, 90 200, 75 220 C 50 210, 30 230, 20 260 L 0 280 Z" fill="#1E3A8A"/>
        <path d="M 0 360 C 80 360, 120 320, 180 290 C 230 265, 270 230, 290 170 C 275 175, 260 195, 245 205 C 230 190, 210 210, 195 230 C 150 250, 100 290, 0 320 Z" fill="#2563EB"/>
        <!-- Crest foam splashes -->
        <circle cx="210" cy="155" r="7" fill="#FFFFFF"/>
        <circle cx="195" cy="150" r="5" fill="#FFFFFF"/>
        <circle cx="178" cy="170" r="6" fill="#FFFFFF"/>
        <circle cx="140" cy="180" r="7" fill="#FFFFFF"/>
        <circle cx="120" cy="175" r="5" fill="#FFFFFF"/>
        <circle cx="85" cy="195" r="6" fill="#FFFFFF"/>
        <!-- Waves base -->
        <path d="M 0 400 L 0 320 C 80 320, 160 360, 240 330 C 310 300, 360 340, 400 310 L 400 400 Z" fill="#1D4ED8"/>
        <path d="M 0 400 L 0 360 C 100 350, 180 385, 270 365 C 330 350, 370 375, 400 360 L 400 400 Z" fill="#172554"/>
      </svg>
    `
  },
  {
    id: 'tokyo-cyberpunk',
    name: 'Tokyo Neon Drift',
    category: 'Streetwear',
    svgContent: `
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" rx="24" fill="#0A0A0C"/>
        <!-- Cyber grid -->
        <line x1="50" y1="280" x2="350" y2="280" stroke="#EC4899" stroke-width="2" opacity="0.6"/>
        <line x1="20" y1="320" x2="380" y2="320" stroke="#EC4899" stroke-width="3" opacity="0.8"/>
        <line x1="0" y1="365" x2="400" y2="365" stroke="#EC4899" stroke-width="4"/>
        <!-- Vertical converging lines -->
        <line x1="200" y1="260" x2="50" y2="400" stroke="#06B6D4" stroke-width="2" opacity="0.7"/>
        <line x1="200" y1="260" x2="130" y2="400" stroke="#06B6D4" stroke-width="2" opacity="0.7"/>
        <line x1="200" y1="260" x2="270" y2="400" stroke="#06B6D4" stroke-width="2" opacity="0.7"/>
        <line x1="200" y1="260" x2="350" y2="400" stroke="#06B6D4" stroke-width="2" opacity="0.7"/>
        <!-- Retro Sunset semi-circle -->
        <path d="M 100 240 A 100 100 0 0 1 300 240 Z" fill="url(#cybergrad)"/>
        <defs>
          <linearGradient id="cybergrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#F43F5E"/>
            <stop offset="100%" stop-color="#F59E0B"/>
          </linearGradient>
        </defs>
        <!-- Japanese characters -->
        <text x="200" y="110" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">東京 SPEED</text>
        <text x="200" y="145" font-family="sans-serif" font-weight="700" font-size="16" fill="#06B6D4" text-anchor="middle" letter-spacing="8">NEO TOKYO 2099</text>
      </svg>
    `
  },
  {
    id: 'minimal-mountain',
    name: 'Alpine Range Minimal',
    category: 'Minimal',
    svgContent: `
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="180" fill="#18181B"/>
        <!-- Solar disc -->
        <circle cx="200" cy="150" r="55" fill="#F97316"/>
        <!-- Back mountains -->
        <polygon points="80,310 180,180 270,310" fill="#3F3F46"/>
        <polygon points="160,206 180,180 195,206" fill="#F4F4F5"/>
        <!-- Foreground mountain -->
        <polygon points="150,320 250,160 350,320" fill="#27272A"/>
        <polygon points="230,192 250,160 270,192" fill="#FFFFFF"/>
        <!-- Birds -->
        <path d="M 120 130 Q 130 120, 140 130 Q 150 120, 160 130" stroke="#FAFAFA" stroke-width="2.5" fill="none"/>
        <path d="M 150 110 Q 157 103, 165 110 Q 172 103, 180 110" stroke="#FAFAFA" stroke-width="2" fill="none"/>
        <!-- Bottom bar -->
        <rect x="70" y="320" width="260" height="6" fill="#F97316" rx="3"/>
        <text x="200" y="355" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="18" fill="#D4D4D8" text-anchor="middle" letter-spacing="6">DISCOVER THE WILD</text>
      </svg>
    `
  },
  {
    id: 'vintage-club',
    name: 'Vintage Athletic Club',
    category: 'Typography',
    svgContent: `
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="180" fill="#FFFFFF" stroke="#0F172A" stroke-width="12"/>
        <circle cx="200" cy="200" r="162" stroke="#0F172A" stroke-width="3" stroke-dasharray="6 4"/>
        <text x="200" y="115" font-family="'Bebas Neue', sans-serif" font-size="44" fill="#0F172A" text-anchor="middle" letter-spacing="4">ORIGINAL QUALITY</text>
        <!-- Stars -->
        <text x="200" y="150" font-size="20" fill="#E11D48" text-anchor="middle">★ ★ ★ ★ ★</text>
        <!-- Big Number -->
        <text x="200" y="245" font-family="'Bebas Neue', sans-serif" font-size="110" font-weight="bold" fill="#0F172A" text-anchor="middle">98</text>
        <!-- Athletic Banner -->
        <rect x="75" y="270" width="250" height="36" rx="6" fill="#E11D48"/>
        <text x="200" y="295" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="18" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">NEW YORK ATHLETICS</text>
        <text x="200" y="345" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="14" fill="#64748B" text-anchor="middle" letter-spacing="4">ESTABLISHED 1998</text>
      </svg>
    `
  }
]

