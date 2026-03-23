"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, CreditCard, Lock, CheckCircle2, Banknote } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CartItemData {
  id: string
  size: string
  crust: string
  sauce: string
  cheese: string
  toppings: string[]
  specialInstructions?: string
  price: number
  quantity: number
}

interface CheckoutProps {
  cartItems: CartItemData[]
  tableNumber: number
  restaurantName: string
  onBack: () => void
  onSuccess: (orderId: string) => void
}

export function Checkout({ 
  cartItems, 
  tableNumber, 
  restaurantName,
  onBack,
  onSuccess 
}: CheckoutProps) {
  const [step, setStep] = useState<"select" | "card-details" | "complete">("select")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessingCash, setIsProcessingCash] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Mock card form state
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [name, setName] = useState("")

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const groups = numbers.match(/.{1,4}/g)
    return groups ? groups.join(" ").substring(0, 19) : ""
  }

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + "/" + numbers.substring(2, 4)
    }
    return numbers
  }

  const handlePayment = async () => {
    // Basic validation
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("Please enter a valid card number")
      return
    }
    if (expiry.length < 5) {
      setError("Please enter a valid expiry date")
      return
    }
    if (cvc.length < 3) {
      setError("Please enter a valid CVC")
      return
    }
    if (!name.trim()) {
      setError("Please enter the cardholder name")
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      const supabase = createClient()
      
      // Create order in database (amounts stored as cents/integers)
      const { data, error: dbError } = await supabase
        .from("orders")
        .insert({
          table_number: tableNumber,
          restaurant_name: restaurantName,
          items: cartItems,
          subtotal: Math.round(subtotal * 100),
          tax: Math.round(tax * 100),
          total: Math.round(total * 100),
          order_status: "confirmed",
          payment_status: "paid",
          stripe_session_id: `mock_card_${Date.now()}`,
        })
        .select("id")
        .single()

      if (dbError) throw dbError

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      setPaymentMethod("card")
      setOrderId(data.id)
      setIsComplete(true)
      onSuccess(data.id)
    } catch (err) {
      console.error("Payment error:", err)
      setError("Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCashPayment = async () => {
    setError(null)
    setIsProcessingCash(true)

    try {
      const supabase = createClient()
      
      // Create order in database with cash payment
      const { data, error: dbError } = await supabase
        .from("orders")
        .insert({
          table_number: tableNumber,
          restaurant_name: restaurantName,
          items: cartItems,
          subtotal: Math.round(subtotal * 100),
          tax: Math.round(tax * 100),
          total: Math.round(total * 100),
          order_status: "confirmed",
          payment_status: "pending_cash",
          stripe_session_id: `cash_${Date.now()}`,
        })
        .select("id")
        .single()

      if (dbError) throw dbError

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 800))

      setPaymentMethod("cash")
      setOrderId(data.id)
      setIsComplete(true)
      onSuccess(data.id)
    } catch (err) {
      console.error("Cash order error:", err)
      setError("Failed to submit order. Please try again.")
    } finally {
      setIsProcessingCash(false)
    }
  }

  if (isComplete && orderId) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {paymentMethod === "cash" ? "Order Confirmed!" : "Payment Successful!"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {paymentMethod === "cash" 
              ? "Please pay at the counter when your order is ready" 
              : "Your order has been sent to the kitchen"}
          </p>
          
          <Card className="w-full max-w-sm bg-card border-border mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="text-2xl font-mono font-bold text-primary">
                #{orderId.substring(0, 8).toUpperCase()}
              </p>
            </CardContent>
          </Card>
          
          <Card className="w-full max-w-sm bg-card border-border mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Table</span>
                <span className="font-semibold text-foreground">{tableNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold text-foreground">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)} pizzas
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">
                  {paymentMethod === "cash" ? "Total Due" : "Total Paid"}
                </span>
                <span className="font-semibold text-foreground">{total.toFixed(2)} €</span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Estimated wait time: <span className="text-foreground font-medium">15-20 minutes</span>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full max-w-sm h-12 rounded-xl border-border text-foreground"
          >
            Start New Order
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (step === "card-details") {
                setStep("select")
                setError(null)
              } else {
                onBack()
              }
            }}
            className="text-muted-foreground"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {step === "card-details" ? "Card Details" : "Payment"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {step === "card-details" ? "Enter your card information" : "Choose payment method"}
            </p>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>
      </header>

      <div className="flex-1 p-4 pb-32 overflow-y-auto">
        {/* Order Summary - Always visible */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.size} {item.crust} Pizza
                  </span>
                  <span className="text-foreground">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="text-foreground">{tax.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-semibold text-base mt-2">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Payment Method Selection */}
        {step === "select" && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h2 className="font-semibold text-foreground mb-4">Choose Payment Method</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setStep("card-details")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Pay with Card</p>
                    <p className="text-sm text-muted-foreground">Credit or debit card</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                </button>
                
                <button
                  onClick={handleCashPayment}
                  disabled={isProcessingCash}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Pay Cash at Counter</p>
                    <p className="text-sm text-muted-foreground">Pay when you collect your order</p>
                  </div>
                  {isProcessingCash ? (
                    <Spinner className="w-5 h-5" />
                  ) : (
                    <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                  )}
                </button>
              </div>
              
              {error && (
                <p className="text-destructive text-sm mt-3">{error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Card Details Form */}
        {step === "card-details" && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Card Details</h2>
              </div>
              
              <p className="text-xs text-muted-foreground mb-4 bg-secondary/50 p-2 rounded-lg">
                Demo mode: Enter any card details to simulate payment
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Card Number</label>
                  <Input
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="bg-input border-border text-foreground h-12 rounded-xl"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Expiry</label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      className="bg-input border-border text-foreground h-12 rounded-xl"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">CVC</label>
                    <Input
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").substring(0, 4))}
                      maxLength={4}
                      className="bg-input border-border text-foreground h-12 rounded-xl"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Cardholder Name</label>
                  <Input
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-input border-border text-foreground h-12 rounded-xl"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm mt-3">{error}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky Pay Button - Only shown on card details step */}
      {step === "card-details" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-5 h-5" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pay {total.toFixed(2)} €
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
