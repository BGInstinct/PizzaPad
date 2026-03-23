"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export interface CartItem {
  id: string
  size: string
  crust: string
  sauce: string
  cheese: string
  toppings: string[]
  specialInstructions: string
  price: number
  quantity: number
}

export async function createCheckoutSession(
  cartItems: CartItem[],
  tableNumber: number,
  restaurantName: string
) {
  const headersList = await headers()
  const origin = headersList.get("origin") || "http://localhost:3000"

  // Calculate totals on server side for security
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const supabase = await createClient()

  // Create order in database with pending status
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      table_number: tableNumber,
      restaurant_name: restaurantName,
      items: cartItems,
      subtotal: Math.round(subtotal * 100),
      tax: Math.round(tax * 100),
      total: Math.round(total * 100),
      order_status: "pending",
      payment_status: "pending",
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error("Error creating order:", orderError)
    return { error: "Failed to create order" }
  }

  // Create line items for Stripe
  const lineItems = cartItems.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: `${item.size} ${item.crust} Pizza`,
        description: `${item.sauce} sauce, ${item.cheese} cheese${item.toppings.length > 0 ? `, Toppings: ${item.toppings.join(", ")}` : ""}${item.specialInstructions ? ` | Notes: ${item.specialInstructions}` : ""}`,
      },
      unit_amount: Math.round(item.price * 100), // Convert to cents
    },
    quantity: item.quantity,
  }))

  // Add tax as a separate line item
  lineItems.push({
    price_data: {
      currency: "usd",
      product_data: {
        name: "Tax (8%)",
        description: "Sales tax",
      },
      unit_amount: Math.round(tax * 100),
    },
    quantity: 1,
  })

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${origin}/checkout/cancel?order_id=${order.id}`,
      metadata: {
        order_id: order.id,
        table_number: tableNumber.toString(),
      },
    })

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id)

    return { clientSecret: session.client_secret, sessionId: session.id }
  } catch (error) {
    console.error("Error creating checkout session:", error)
    // Delete the pending order if Stripe session creation fails
    await supabase.from("orders").delete().eq("id", order.id)
    return { error: "Failed to create payment session" }
  }
}

export async function getOrderStatus(orderId: string) {
  const supabase = await createClient()
  
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single()

  if (error || !order) {
    return { error: "Order not found" }
  }

  return { order }
}
