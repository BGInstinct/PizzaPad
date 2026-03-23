"use client"

import { CheckCircle2, Clock, Pizza } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type CartItem, getPizzaDescription } from "@/lib/pizza-data"

interface ConfirmationScreenProps {
  orderNumber: string
  items: CartItem[]
  total: number
  tableNumber: string
  onNewOrder: () => void
}

export function ConfirmationScreen({ 
  orderNumber, 
  items, 
  total, 
  tableNumber,
  onNewOrder 
}: ConfirmationScreenProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-background px-4 py-8">
      {/* Success Header */}
      <div className="flex flex-col items-center text-center py-8">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Order Sent!</h1>
        <p className="text-muted-foreground mt-2">
          Your order has been sent to the kitchen
        </p>
      </div>

      {/* Order Info */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div>
            <p className="text-muted-foreground text-sm">Order Number</p>
            <p className="text-2xl font-bold text-primary">{orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">Table</p>
            <p className="text-2xl font-bold text-foreground">{tableNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl">
          <Clock className="w-6 h-6 text-accent" />
          <div>
            <p className="font-medium text-foreground">Estimated Time</p>
            <p className="text-muted-foreground text-sm">15-20 minutes</p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-2xl p-6 flex-1">
        <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div 
              key={item.id}
              className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Pizza className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {item.quantity}x Pizza #{index + 1}
                    </p>
                    <p className="text-muted-foreground text-sm truncate">
                      {getPizzaDescription(item.pizza)}
                    </p>
                  </div>
                  <span className="text-foreground font-medium flex-shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
          <span className="font-semibold text-foreground">Total Paid</span>
          <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-6">
        <Button
          onClick={onNewOrder}
          variant="outline"
          className="w-full h-14 text-lg font-semibold rounded-xl border-border hover:bg-card"
        >
          Start New Order
        </Button>
        <p className="text-center text-muted-foreground text-sm mt-4">
          Thank you for ordering with PizzaPad!
        </p>
      </div>
    </div>
  )
}
