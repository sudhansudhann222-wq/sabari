export type TShirtColor = {
  name: string
  hex: string
  class: string
  border?: boolean
}

export type TShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL'

export type TShirtFit = 'Regular' | 'Oversized' | 'Polo' | 'Crop' | 'Full Sleeve'

export type PrintLocation = 'Front' | 'Back' | 'Left Sleeve' | 'Right Sleeve'

export type GraphicItem = {
  id: string
  name: string
  category: 'Space' | 'Abstract' | 'Japanese' | 'Typography' | 'Streetwear' | 'Minimal'
  svgContent: string
  thumbnailUrl?: string
}

export type CustomTextElement = {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  color: string
  fontWeight: string
  letterSpacing: number
  x: number // percentage 0-100
  y: number // percentage 0-100
  rotation: number
}

export type CustomGraphicElement = {
  id: string
  graphicId?: string
  imageUrl?: string
  svgContent?: string
  width: number // percentage 10-90
  x: number // percentage 0-100
  y: number // percentage 0-100
  rotation: number
}

export type SideDesign = {
  graphics: CustomGraphicElement[]
  texts: CustomTextElement[]
}

export type CartItem = {
  id: string
  productId?: string
  name: string
  tshirtType: string
  color: string
  colorName: string
  size: TShirtSize
  quantity: number
  price: number
  originalPrice: number
  discountPercent: number
  printLocation: string
  previewImage: string
  isCustom?: boolean
  customDesign?: {
    front?: SideDesign
    back?: SideDesign
    sleeve?: SideDesign
  }
}

export type Coupon = {
  id?: string
  code: string
  discountType?: 'flat' | 'percentage'
  discountAmount?: number
  discountPercent?: number
  minSpend: number
  description: string
  isActive?: boolean
  usageCount?: number
  createdAt?: string
}

export type BulkInquiry = {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  pcsCount: number
  tshirtType: string
  printSides: string
  estimatedTotal: number
  notes?: string | null
  status: 'New' | 'Contacted' | 'Quoted' | 'Approved' | 'Closed' | string
  createdAt: string
}

export type Product = {
  id: string
  name: string
  category: 'T-Shirts' | 'Oversized' | 'Polo' | 'Crop' | 'Full Sleeve'
  price: number
  originalPrice: number
  discountPercent: number
  rating: number
  reviewsCount: number
  colors: string[] // hex values
  availableSizes: TShirtSize[]
  patternCoverage: ('Front' | 'Back' | 'All Over')[]
  imageUrl: string
  backImageUrl?: string
  description: string
  isBestseller?: boolean
  isNewArrival?: boolean
  tags: string[]
  isCustomizableBase?: boolean
  modelType?: 'flat' | 'male-model' | 'female-model'
  bracketColor?: string
  fitBadge?: 'Oversized' | 'Boyfriend Fit' | 'Classic Fit' | 'Boxy Heavyweight'
  inStock?: boolean
}

export type Order = {
  orderId: string
  date: string
  items: CartItem[]
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  shippingDetails: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  paymentMethod: string
  paymentStatus: 'Paid' | 'Pending (COD)'
  orderStatus?: string
  estimatedDelivery: string
}

