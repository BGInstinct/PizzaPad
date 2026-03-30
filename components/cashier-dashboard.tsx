"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, Search, Banknote, RefreshCw, Pizza, AlertCircle } from "lucide-react"

interface OrderItem {
  size: string
  crust: string
  quantity: number
  price: number
}

interface Order {
  id: string
  table_number: number
  restaurant_name: string
  items: OrderItem[]
  total: number
  subtotal: number
  tax: number
  discount?: number
  payment_status: string
  payment_method: string
  created_at: string
  cash_received?: number
  change_given?: number
  updated_at?: string
}

export function CashierDashboard() {
  const [searchInput, setSearchInput] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [cashReceived, setCashReceived] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [loadingPending, setLoadingPending] = useState(true)

  const totalEuros = order ? order.total / 100 : 0
  const cashReceivedNum = parseFloat(cashReceived) || 0
  const change = Math.max(0, cashReceivedNum - totalEuros)
  const isEnoughCash = cashReceivedNum >= totalEuros

  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders")
      const all: Order[] = await res.json()
      const pending = all
        .filter((o) => o.payment_status === "pending_cash")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setPendingOrders(pending)
    } catch {
      // silently fail
    } finally {
      setLoadingPending(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingOrders()
    const interval = setInterval(fetchPendingOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchPendingOrders])

  const searchOrder = async (idToSearch?: string) => {
    const query = (idToSearch || searchInput).trim().toUpperCase().replace(/^#/, "")
    if (!query) return

    setIsSearching(true)
    setSearchError(null)
    setOrder(null)
    setPaymentComplete(false)
    setCashReceived("")

    try {
      // Search by short ID prefix (first 8 chars) or full ID
      const res = await fetch("/api/orders")
      const all: Order[] = await res.json()
      const found = all.find(
        (o) =>
          o.id.toUpperCase().includes(query) ||
          o.id.substring(0, 8).toUpperCase() === query
      )

      if (!found) {
        setSearchError("Order not found. Check the order number and try again.")
      } else if (found.payment_status === "paid") {
        setOrder(found)
        setPaymentComplete(true)
      } else {
        setOrder(found)
      }
    } catch {
      setSearchError("Failed to fetch order. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectPending = (o: Order) => {
    setOrder(o)
    setPaymentComplete(o.payment_status === "paid")
    setSearchError(null)
    setCashReceived("")
    setSearchInput(o.id.substring(0, 8).toUpperCase())
  }

  const handleMarkPaid = async () => {
    if (!order || !isEnoughCash) return
    setIsProcessing(true)

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: "paid",
          cash_received: Math.round(cashReceivedNum * 100),
          change_given: Math.round(change * 100),
        }),
      })

      if (!res.ok) throw new Error("Failed to update order")

      const updated: Order = await res.json()
      setOrder(updated)
      setPaymentComplete(true)
      fetchPendingOrders()
    } catch {
      setSearchError("Failed to mark order as paid. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setOrder(null)
    setSearchInput("")
    setSearchError(null)
    setCashReceived("")
    setPaymentComplete(false)
  }

  const quickCashOptions = [
    Math.ceil(totalEuros),
    Math.ceil(totalEuros / 5) * 5,
    Math.ceil(totalEuros / 10) * 10,
    Math.ceil(totalEuros / 20) * 20,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= totalEuros).slice(0, 4)

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pizza className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Cashier Dashboard</h1>
              <p className="text-xs text-muted-foreground">PizzaPad — Counter Payments</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchPendingOrders} className="text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Search */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Find Order
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="Enter order number (e.g. ORD-1234AB)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchOrder()}
                className="bg-input border-border text-foreground h-11 rounded-xl font-mono"
              />
              <Button
                onClick={() => searchOrder()}
                disabled={isSearching || !searchInput.trim()}
                className="h-11 px-4 rounded-xl"
              >
                {isSearching ? <Spinner className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {searchError && (
              <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {searchError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders List */}
        {!order && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
                  Pending Cash Payments
                </h2>
                {pendingOrders.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingOrders.length}
                  </span>
                )}
              </div>

              {loadingPending ? (
                <div className="flex justify-center py-6">
                  <Spinner className="w-6 h-6 text-muted-foreground" />
                </div>
              ) : pendingOrders.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">
                  No pending cash payments
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => handleSelectPending(o)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-mono font-semibold text-primary text-sm">
                          #{o.id.substring(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Table {o.table_number} · {o.items.reduce((s, i) => s + i.quantity, 0)} pizza(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{(o.total / 100).toFixed(2)} €</p>
                        <p className="text-xs text-amber-500 font-medium">Awaiting payment</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Detail + Payment */}
        {order && (
          <>
            {/* Order Summary */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Order</p>
                    <p className="font-mono font-bold text-primary text-xl">
                      #{order.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Table</p>
                    <p className="font-bold text-foreground text-xl">{order.table_number}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.size} {item.crust} Pizza
                      </span>
                      <span className="text-foreground">{(item.price * item.quantity / 100).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{(order.subtotal / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{(order.tax / 100).toFixed(2)} €</span>
                  </div>
                  {order.discount && order.discount > 0 ? (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{(order.discount / 100).toFixed(2)} €</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                    <span className="text-foreground">Total Due</span>
                    <span className="text-primary">{totalEuros.toFixed(2)} €</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Complete */}
            {paymentComplete ? (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">Payment Complete!</p>
                      <p className="text-sm text-muted-foreground">Order marked as paid</p>
                    </div>
                  </div>

                  {order.cash_received && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Cash Received</p>
                        <p className="font-bold text-xl text-foreground">
                          {(order.cash_received / 100).toFixed(2)} €
                        </p>
                      </div>
                      <div className="bg-card rounded-xl p-3 border border-green-500/30 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Change to Give</p>
                        <p className="font-bold text-xl text-green-600">
                          {(order.change_given! / 100).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full mt-4 rounded-xl"
                  >
                    Next Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Cash Input */
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Banknote className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Cash Received</h2>
                  </div>

                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">€</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={totalEuros.toFixed(2)}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="bg-input border-border text-foreground h-14 rounded-xl text-xl font-bold pl-8"
                    />
                  </div>

                  {/* Quick cash buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {quickCashOptions.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashReceived(amt.toFixed(2))}
                        className="py-2 px-1 rounded-xl border border-border bg-secondary/50 hover:border-primary hover:bg-secondary text-sm font-semibold transition-colors"
                      >
                        {amt} €
                      </button>
                    ))}
                  </div>

                  {/* Change preview */}
                  {cashReceivedNum > 0 && (
                    <div className={`rounded-xl p-3 mb-4 text-center ${isEnoughCash ? "bg-green-500/10 border border-green-500/20" : "bg-destructive/10 border border-destructive/20"}`}>
                      {isEnoughCash ? (
                        <>
                          <p className="text-xs text-muted-foreground">Change to give customer</p>
                          <p className="text-3xl font-bold text-green-600 mt-1">{change.toFixed(2)} €</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-destructive">Not enough cash</p>
                          <p className="text-lg font-bold text-destructive mt-1">
                            Still needs {(totalEuros - cashReceivedNum).toFixed(2)} €
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleMarkPaid}
                    disabled={!isEnoughCash || isProcessing || cashReceivedNum === 0}
                    className="w-full h-13 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="w-5 h-5" /> Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Mark as Paid · {totalEuros.toFixed(2)} €
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    className="w-full mt-2 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
