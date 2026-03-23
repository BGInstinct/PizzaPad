"use client"

import { ChevronLeft, Trash2, Plus, Minus, Pizza } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPizzaDescription, type CartItem } from "@/lib/pizza-data"

interface CartScreenProps {
  items: CartItem[]
  onBack: () => void
  onUpdateQuantity: (itemId: string, delta: number) => void
  onRemoveItem: (itemId: string) => void
  onProceedToCheckout: () => void
  onAddMore: () => void
}

export function CartScreen({ 
  items, 
  onBack, 
  onUpdateQuantity, 
  onRemoveItem, 
  onProceedToCheckout,
  onAddMore 
}: CartScreenProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <div className="min-h-dvh flex flex-col bg-background pb-44">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="sr-only">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-foreground">Your Order</h1>
          
          <div className="w-6" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-4">
              <Pizza className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some delicious pizzas to get started</p>
            <Button 
              onClick={onAddMore}
              variant="outline"
              className="rounded-xl"
            >
              Build a Pizza
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-foreground">
                      Pizza #{index + 1}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                      {getPizzaDescription(item.pizza)}
                    </p>
                    {item.pizza.specialInstructions && (
                      <p className="text-accent text-sm mt-2 italic">
                        Note: {item.pizza.specialInstructions}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-foreground font-semibold w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-primary font-semibold text-lg">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Add More Button */}
            <button
              onClick={onAddMore}
              className="w-full py-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium"
            >
              + Add Another Pizza
            </button>
          </div>
        )}
      </div>

      {/* Sticky Bottom Summary */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-inset-bottom">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground font-semibold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <Button
            onClick={onProceedToCheckout}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Proceed to Payment
          </Button>
        </div>
      )}
    </div>
  )
}
