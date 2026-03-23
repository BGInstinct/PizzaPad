"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Loader2, UtensilsCrossed } from "lucide-react"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function updateAndFetchOrder() {
      if (!orderId) {
        setError("Order not found")
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Update order status to paid
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
        })
        .eq("id", orderId)

      if (updateError) {
        console.error("Error updating order:", updateError)
      }

      // Fetch the order
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (fetchError || !data) {
        setError("Could not load order details")
        setLoading(false)
        return
      }

      setOrder(data)
      setLoading(false)
    }

    updateAndFetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Processing your order...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-xl font-medium text-destructive">{error || "Something went wrong"}</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Start New Order
          </Button>
        </div>
      </div>
    )
  }

  const orderNumber = order.id.slice(-6).toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Success Header */}
      <div className="flex flex-col items-center justify-center bg-success/10 px-4 py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Your payment was successful
        </p>
      </div>

      {/* Order Details */}
      <div className="flex-1 p-4">
        <div className="mx-auto max-w-md space-y-4">
          {/* Order Number */}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-primary">
              #{orderNumber}
            </p>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Wait</p>
              <p className="text-xl font-bold text-foreground">15-20 minutes</p>
            </div>
          </div>

          {/* Table Info */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <UtensilsCrossed className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivering to</p>
              <p className="text-lg font-semibold text-foreground">
                Table {order.table_number}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 font-semibold text-foreground">Order Summary</h3>
            <div className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {item.quantity}x {item.size} {item.crust} Pizza
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.toppings.length > 0 && item.toppings.join(", ")}
                    </p>
                  </div>
                  <p className="text-foreground">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between text-lg font-bold text-foreground">
                <span>Total Paid</span>
                <span className="text-success">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card p-4">
        <div className="mx-auto max-w-md">
          <Button
            className="w-full bg-primary py-6 text-lg font-semibold text-primary-foreground"
            onClick={() => router.push("/")}
          >
            Start New Order
          </Button>
        </div>
      </div>
    </div>
  )
}
