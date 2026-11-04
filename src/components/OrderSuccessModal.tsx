import React from 'react'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import { Order } from '../types'
import { TShirtCanvas } from './TShirtCanvas'
import { LottieFeedback } from './animations/LottieFeedback'

interface OrderSuccessModalProps {
  order: Order | null
  onClose: () => void
  onContinueShopping: () => void
  onViewOrders: () => void
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onContinueShopping,
  onViewOrders
}) => {
  if (!order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 overflow-hidden my-8 p-6 sm:p-8 space-y-6 text-left animate-spring-pop">
        
        {/* Success Icon & Header */}
        <div className="text-center space-y-2">
          <LottieFeedback type="success" className="w-20 h-20 mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Order Placed Successfully!
          </h2>
          <p className="text-neutral-500 text-sm">
            Thank you for ordering with TeeCraft. We've started prepping your custom print!
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-200 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
            <span className="text-neutral-500 font-medium">Order Number</span>
            <span className="font-extrabold text-neutral-900">{order.orderId}</span>
          </div>

          <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>Est. Delivery</span>
            </div>
            <span className="font-bold text-neutral-900">{order.estimatedDelivery}</span>
          </div>

          <div className="flex items-start justify-between border-b border-neutral-200 pb-2.5">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>Shipping to</span>
            </div>
            <span className="font-medium text-neutral-800 text-right max-w-[220px]">
              {order.shippingDetails.fullName}, {order.shippingDetails.city}, {order.shippingDetails.pincode}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-neutral-500 font-medium">Amount Paid</span>
            <span className="text-base font-extrabold text-neutral-900">₹{order.total}</span>
          </div>
        </div>

        {/* Items Preview */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Items in this order ({order.items.length})
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-10 h-10 rounded-lg bg-neutral-200/60 p-0.5 overflow-hidden shrink-0">
                  <TShirtCanvas
                    color={item.color}
                    presetGraphicId={item.previewImage}
                  />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                  <p className="text-neutral-500">{item.size} | {item.colorName} | Qty {item.quantity}</p>
                </div>
                <span className="font-bold text-xs text-neutral-900 shrink-0">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onContinueShopping}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow transition"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onViewOrders}
            className="w-full py-2.5 rounded-xl border border-neutral-300 hover:border-neutral-900 text-neutral-800 font-bold text-xs transition"
          >
            Track in My Orders →
          </button>
        </div>

      </div>
    </div>
  )
}

