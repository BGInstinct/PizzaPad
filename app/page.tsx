"use client"

import { useState, useCallback } from "react"
import { WelcomeScreen } from "@/components/welcome-screen"
import { PizzaBuilder } from "@/components/pizza-builder"
import { CartScreen } from "@/components/cart-screen"
import { Checkout } from "@/components/checkout"
import { type PizzaConfig, type CartItem } from "@/lib/pizza-data"

type Screen = "welcome" | "builder" | "cart" | "checkout"

// Mock session data - in production, this would come from QR code/URL params
const SESSION = {
  restaurantName: "Napoli's Kitchen",
  tableNumber: 7,
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export default function PizzaPadApp() {
  const [screen, setScreen] = useState<Screen>("welcome")
  const [cart, setCart] = useState<CartItem[]>([])

  const handleStartOrder = useCallback(() => {
    setScreen("builder")
  }, [])

  const handleAddToCart = useCallback((pizza: PizzaConfig, price: number) => {
    const newItem: CartItem = {
      id: generateId(),
      pizza,
      quantity: 1,
      price,
    }
    setCart(prev => [...prev, newItem])
    setScreen("cart")
  }, [])

  const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }, [])

  const handleRemoveItem = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const handleProceedToCheckout = useCallback(() => {
    setScreen("checkout")
  }, [])

  const handleCheckoutSuccess = useCallback((orderId: string) => {
    // Clear cart and redirect will happen via the success page
    setCart([])
  }, [])

  const handleBackToWelcome = useCallback(() => {
    setScreen("welcome")
  }, [])

  const handleBackToBuilder = useCallback(() => {
    setScreen("builder")
  }, [])

  const handleBackToCart = useCallback(() => {
    setScreen("cart")
  }, [])

  const handleViewCart = useCallback(() => {
    setScreen("cart")
  }, [])

  // Transform cart items for Stripe checkout
  const stripeCartItems = cart.map(item => ({
    id: item.id,
    size: item.pizza.size,
    crust: item.pizza.crust,
    sauce: item.pizza.sauce,
    cheese: item.pizza.cheese,
    toppings: [...(item.pizza.meats || []), ...(item.pizza.veggies || [])],
    specialInstructions: item.pizza.specialInstructions,
    price: item.price,
    quantity: item.quantity,
  }))

  return (
    <main className="max-w-md mx-auto min-h-dvh bg-background">
      {screen === "welcome" && (
        <WelcomeScreen
          restaurantName={SESSION.restaurantName}
          tableNumber={String(SESSION.tableNumber)}
          onStartOrder={handleStartOrder}
        />
      )}
      
      {screen === "builder" && (
        <PizzaBuilder
          onAddToCart={handleAddToCart}
          onBack={handleBackToWelcome}
          cartItemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onViewCart={handleViewCart}
        />
      )}
      
      {screen === "cart" && (
        <CartScreen
          items={cart}
          onBack={handleBackToBuilder}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedToCheckout={handleProceedToCheckout}
          onAddMore={handleBackToBuilder}
        />
      )}
      
      {screen === "checkout" && (
        <Checkout
          cartItems={stripeCartItems}
          tableNumber={SESSION.tableNumber}
          restaurantName={SESSION.restaurantName}
          onBack={handleBackToCart}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </main>
  )
}
