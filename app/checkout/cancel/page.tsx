"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, Loader2 } from "lucide-react"

function CancelContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")

  useEffect(() => {
    async function cancelOrder() {
      if (!orderId) return

      const supabase = createClient()
      
      // Update order status to cancelled
      await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          payment_status: "cancelled",
        })
        .eq("id", orderId)
    }

    cancelOrder()
  }, [orderId])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Cancel Header */}
      <div className="flex flex-col items-center justify-center bg-destructive/10 px-4 py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Payment Cancelled</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Your order was not completed. No charges were made.
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mx-auto max-w-md text-center">
          <p className="text-muted-foreground">
            Your cart items are still saved. You can return to complete your order
            whenever you're ready.
          </p>
          
          <div className="mt-8 space-y-3">
            <Button
              className="w-full bg-primary py-6 text-lg font-semibold text-primary-foreground"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Return to Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
    </div>
  )
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CancelContent />
    </Suspense>
  )
}
