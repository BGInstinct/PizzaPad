"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  ArrowLeft, CreditCard, Lock, CheckCircle2, Banknote,
  Sparkles, Gift, Minus, Plus, QrCode, Clock
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { AuthModal } from "./auth-modal"

// ─── Pure TypeScript QR Code encoder (no external dependencies) ──────────────
// Supports alphanumeric mode, ECC level M, versions 1–10.

type QRMatrix = boolean[][]

function makeQR(text: string): QRMatrix {
  const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:".split("")
  const s = text.toUpperCase()
  const allAlnum = [...s].every(c => ALNUM.includes(c))

  // Fallback: return empty 21×21 if we cannot encode
  if (!allAlnum) return Array.from({ length: 21 }, () => Array(21).fill(false))

  // GF(256) setup
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256)
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i
    x = x << 1; if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
  const mul = (a: number, b: number) => (!a || !b) ? 0 : EXP[LOG[a] + LOG[b]]

  const polyMul = (p: number[], q: number[]) => {
    const r = new Array(p.length + q.length - 1).fill(0)
    for (let i = 0; i < p.length; i++)
      for (let j = 0; j < q.length; j++) r[i + j] ^= mul(p[i], q[j])
    return r
  }
  const genPoly = (n: number) => {
    let g = [1]
    for (let i = 0; i < n; i++) g = polyMul(g, [1, EXP[i]])
    return g
  }
  const rsEncode = (data: number[], nsym: number) => {
    const gen = genPoly(nsym)
    const msg = [...data, ...new Array(nsym).fill(0)]
    for (let i = 0; i < data.length; i++) {
      const c = msg[i]
      if (c) for (let j = 0; j < gen.length; j++) msg[i + j] ^= mul(gen[j], c)
    }
    return msg.slice(data.length)
  }

  // Alphanumeric bit stream
  const bits: number[] = []
  const push = (v: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1) }
  push(0b0010, 4); push(s.length, 9)
  for (let i = 0; i < s.length - 1; i += 2)
    push(ALNUM.indexOf(s[i]) * 45 + ALNUM.indexOf(s[i + 1]), 11)
  if (s.length & 1) push(ALNUM.indexOf(s[s.length - 1]), 6)

  // Version table [ver, totalCW, ecCW, dataCW] ECC level M
  const VTAB = [
    [1,26,10,16],[2,44,16,28],[3,70,26,44],[4,100,36,64],[5,134,48,86],
    [6,172,64,108],[7,196,72,124],[8,242,88,154],[9,292,110,182],[10,346,130,216],
  ]
  const vRow = VTAB.find(([,,,dc]) => dc * 8 >= bits.length + 4)
  if (!vRow) return Array.from({ length: 21 }, () => Array(21).fill(false))
  const [version,,ecCW,dataCW] = vRow
  const size = version * 4 + 17

  // Pad to dataCW bytes
  const all = [...bits]
  for (let i = 0; i < 4 && all.length < dataCW * 8; i++) all.push(0)
  while (all.length % 8) all.push(0)
  const PAD = [0b11101100, 0b00010001]
  for (let pi = 0; all.length < dataCW * 8;) {
    for (let i = 7; i >= 0; i--) all.push((PAD[pi] >> i) & 1)
    pi ^= 1
  }
  const dataBytes: number[] = []
  for (let i = 0; i < all.length; i += 8) {
    let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | (all[i + j] ?? 0)
    dataBytes.push(b)
  }
  const codewords = [...dataBytes, ...rsEncode(dataBytes, ecCW)]

  // Matrix + reserved map
  const M: QRMatrix = Array.from({ length: size }, () => Array(size).fill(false))
  const R: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const set = (r: number, c: number, v: boolean, res = false) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return
    M[r][c] = v; if (res) R[r][c] = true
  }

  // Finder patterns
  const finder = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
      const edge = dr === -1 || dr === 7 || dc === -1 || dc === 7
      const center = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
      set(row + dr, col + dc, edge || center, true)
    }
  }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0)

  // Timing
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0, true); set(i, 6, i % 2 === 0, true)
  }
  set(size - 8, 8, true, true) // dark module

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    R[8][i] = true; R[i][8] = true
    if (i < 7) R[size - 1 - i][8] = true
    if (i < 8) R[8][size - 1 - i] = true
  }

  // Alignment patterns
  const AP: Record<number, number[]> = {
    2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],
    7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50]
  }
  if (version >= 2) {
    const pos = AP[version] ?? []
    for (const ar of pos) for (const ac of pos) {
      if (R[ar][ac]) continue
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
        set(ar+dr, ac+dc, Math.abs(dr)===2||Math.abs(dc)===2||(!dr&&!dc), true)
    }
  }

  // Data placement
  const cwBits: number[] = []
  for (const cw of codewords) for (let i = 7; i >= 0; i--) cwBits.push((cw >> i) & 1)
  let bi = 0, up = true, col = size - 1
  while (col > 0) {
    if (col === 6) col--
    for (let row = up ? size - 1 : 0; up ? row >= 0 : row < size; up ? row-- : row++) {
      for (let dc = 0; dc <= 1; dc++) {
        const c = col - dc
        if (!R[row][c]) { set(row, c, (cwBits[bi] ?? 0) === 1); bi++ }
      }
    }
    up = !up; col -= 2
  }

  // Mask pattern 0: (row + col) % 2 === 0
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!R[r][c] && (r + c) % 2 === 0) M[r][c] = !M[r][c]

  // Format info for M level + mask 0 = 101010000010010
  const FMT = [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0]
  const F1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]]
  const F2 = [[size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],
              [8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]]
  for (let i = 0; i < 15; i++) {
    M[F1[i][0]][F1[i][1]] = FMT[i] === 1
    M[F2[i][0]][F2[i][1]] = FMT[i] === 1
  }

  return M
}

function QRCodeSVG({ value, size = 220 }: { value: string; size?: number }) {
  const matrix = makeQR(value)
  const n = matrix.length
  const px = Math.floor(size / (n + 8))
  const dim = (n + 8) * px
  const off = 4 * px
  const rects = matrix.flatMap((row, r) =>
    row.map((dark, c) =>
      dark ? `<rect x="${off + c * px}" y="${off + r * px}" width="${px}" height="${px}"/>` : ""
    )
  ).join("")

  return (
    <svg
      viewBox={`0 0 ${dim} ${dim}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ display: "block" }}
    >
      <rect width={dim} height={dim} fill="white" />
      <g fill="black" dangerouslySetInnerHTML={{ __html: rects }} />
    </svg>
  )
}
// ─── End QR encoder ──────────────────────────────────────────────────────────

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
  const { user, isGuest, addPoints, redeemPoints, getPointsValue } = useAuth()
  const [step, setStep] = useState<"select" | "card-details" | "qr-waiting" | "complete">("select")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessingCash, setIsProcessingCash] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cashReceived, setCashReceived] = useState<number | null>(null)
  const [changeGiven, setChangeGiven] = useState<number | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Card form state
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [name, setName] = useState("")

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const guestDiscount = isGuest ? subtotal * 0.05 : 0
  const pointsDiscount = getPointsValue(pointsToRedeem)
  const totalBeforeDiscounts = subtotal + tax
  const totalDiscount = guestDiscount + pointsDiscount
  const total = Math.max(0, totalBeforeDiscounts - totalDiscount)
  const pointsToEarn = user ? Math.floor(total) : 0

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.payment_status === "paid") {
          clearInterval(pollRef.current!); pollRef.current = null
          setCashReceived(data.cash_received ?? null)
          setChangeGiven(data.change_given ?? null)
          if (user && pointsToEarn > 0) { addPoints(pointsToEarn); setEarnedPoints(pointsToEarn) }
          setStep("complete")
          onSuccess(id)
        }
      } catch { /* keep polling */ }
    }, 3000)
  }, [user, pointsToEarn, addPoints, onSuccess])

  const formatCardNumber = (v: string) => {
    const n = v.replace(/\D/g, ""), g = n.match(/.{1,4}/g)
    return g ? g.join(" ").substring(0, 19) : ""
  }
  const formatExpiry = (v: string) => {
    const n = v.replace(/\D/g, "")
    return n.length >= 2 ? n.substring(0, 2) + "/" + n.substring(2, 4) : n
  }

  const handlePayment = async () => {
    if (cardNumber.replace(/\s/g, "").length < 16) return setError("Please enter a valid card number")
    if (expiry.length < 5) return setError("Please enter a valid expiry date")
    if (cvc.length < 3) return setError("Please enter a valid CVC")
    if (!name.trim()) return setError("Please enter the cardholder name")
    setError(null); setIsProcessing(true)
    try {
      await new Promise(r => setTimeout(r, 1500))
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber, restaurant_name: restaurantName, items: cartItems,
          subtotal: Math.round(subtotal * 100), tax: Math.round(tax * 100),
          discount: Math.round(totalDiscount * 100), total: Math.round(total * 100),
          order_status: "confirmed", payment_status: "paid", payment_method: "card",
          user_id: user?.id || null, user_email: user?.email || null, is_guest: isGuest,
          points_redeemed: pointsToRedeem, points_earned: pointsToEarn,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create order")
      if (pointsToRedeem > 0 && user) redeemPoints(pointsToRedeem)
      if (user && pointsToEarn > 0) { addPoints(pointsToEarn); setEarnedPoints(pointsToEarn) }
      setPaymentMethod("card"); setOrderId(data.id); setStep("complete"); onSuccess(data.id)
    } catch (err) {
      console.error(err); setError("Failed to process payment. Please try again.")
    } finally { setIsProcessing(false) }
  }

  const handleCashPayment = async () => {
    setError(null); setIsProcessingCash(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber, restaurant_name: restaurantName, items: cartItems,
          subtotal: Math.round(subtotal * 100), tax: Math.round(tax * 100),
          discount: Math.round(totalDiscount * 100), total: Math.round(total * 100),
          order_status: "confirmed", payment_status: "pending_cash", payment_method: "cash",
          user_id: user?.id || null, user_email: user?.email || null, is_guest: isGuest,
          points_redeemed: pointsToRedeem, points_earned: pointsToEarn,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create order")
      if (pointsToRedeem > 0 && user) redeemPoints(pointsToRedeem)
      setPaymentMethod("cash"); setOrderId(data.id); setStep("qr-waiting"); startPolling(data.id)
    } catch (err) {
      console.error(err); setError("Failed to submit order. Please try again.")
    } finally { setIsProcessingCash(false) }
  }

  // ── QR waiting screen ──────────────────────────────────────────────────────
  if (step === "qr-waiting" && orderId) {
    const shortId = orderId.substring(0, 8).toUpperCase()
    const qrValue = `PIZZAPAD:${shortId}:${Math.round(total * 100)}`
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Pay at Counter</h1>
              <p className="text-xs text-muted-foreground">Show this QR code to the cashier</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
          <Card className="w-full max-w-sm bg-card border-border">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <QRCodeSVG value={qrValue} size={216} />
              </div>
              <div className="text-center">
                <p className="font-mono font-bold text-primary text-xl">#{shortId}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Table {tableNumber} · {cartItems.reduce((s, i) => s + i.quantity, 0)} pizza(s)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm bg-primary/5 border-primary/20">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
              <p className="text-5xl font-bold text-primary tracking-tight">{total.toFixed(2)} €</p>
              {totalDiscount > 0 && (
                <p className="text-xs text-green-600 mt-2">Includes {totalDiscount.toFixed(2)} € discount</p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
            <span className="flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
            <Clock className="w-4 h-4" />
            <span>Waiting for cashier to confirm payment…</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Complete screen ────────────────────────────────────────────────────────
  if (step === "complete" && orderId) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {paymentMethod === "cash" ? "Payment Received!" : "Payment Successful!"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {paymentMethod === "cash"
                ? "Your cash payment has been confirmed at the counter"
                : "Your order has been sent to the kitchen"}
            </p>
          </div>

          <Card className="w-full max-w-sm bg-card border-border">
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order Number</p>
              <p className="text-3xl font-mono font-bold text-primary">
                #{orderId.substring(0, 8).toUpperCase()}
              </p>
            </CardContent>
          </Card>

          {paymentMethod === "cash" && cashReceived !== null && changeGiven !== null && (
            <Card className="w-full max-w-sm bg-card border-border">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide text-center mb-4">
                  Payment Breakdown
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-bold text-foreground">{total.toFixed(2)} €</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Paid</p>
                    <p className="font-bold text-foreground">{(cashReceived / 100).toFixed(2)} €</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Change</p>
                    <p className="font-bold text-green-600">{(changeGiven / 100).toFixed(2)} €</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="w-full max-w-sm bg-card border-border">
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Table</span>
                <span className="font-semibold">{tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold">{cartItems.reduce((s, i) => s + i.quantity, 0)} pizza(s)</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-{totalDiscount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-border pt-3">
                <span>Total {paymentMethod === "cash" ? "Paid" : "Charged"}</span>
                <span className="text-primary">{total.toFixed(2)} €</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Estimated wait: <span className="text-foreground font-medium">15–20 minutes</span>
              </p>
            </CardContent>
          </Card>

          {earnedPoints > 0 && (
            <Card className="w-full max-w-sm bg-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">+{earnedPoints} points earned!</p>
                    <p className="text-sm text-muted-foreground">You now have {user?.points} total points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={() => window.location.reload()} variant="outline" className="w-full max-w-sm h-12 rounded-xl border-border">
            Start New Order
          </Button>
        </div>
      </div>
    )
  }

  // ── Main payment selection / card form ─────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { if (step === "card-details") { setStep("select"); setError(null) } else onBack() }} className="text-muted-foreground" disabled={isProcessing}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{step === "card-details" ? "Card Details" : "Payment"}</h1>
            <p className="text-xs text-muted-foreground">{step === "card-details" ? "Enter your card information" : "Choose payment method"}</p>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>
      </header>

      <div className="flex-1 p-4 pb-32 overflow-y-auto space-y-4">
        {/* Order summary */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {cartItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.quantity}x {item.size} {item.crust} Pizza</span>
                  <span className="text-foreground">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{subtotal.toFixed(2)} €</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span>{tax.toFixed(2)} €</span></div>
                {guestDiscount > 0 && <div className="flex justify-between text-green-600"><span>Guest Discount (5%)</span><span>-{guestDiscount.toFixed(2)} €</span></div>}
                {pointsDiscount > 0 && <div className="flex justify-between text-green-600"><span>Points ({pointsToRedeem} pts)</span><span>-{pointsDiscount.toFixed(2)} €</span></div>}
                <div className="flex justify-between font-semibold text-base pt-1"><span className="text-foreground">Total</span><span className="text-primary">{total.toFixed(2)} €</span></div>
                {pointsToEarn > 0 && <div className="flex justify-between text-xs text-primary"><span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />Points to earn</span><span>+{pointsToEarn} pts</span></div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points redemption */}
        {user && user.points > 0 && step === "select" && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3"><Gift className="w-5 h-5 text-primary" /><h2 className="font-semibold text-foreground">Redeem Points</h2></div>
              <p className="text-sm text-muted-foreground mb-3">Available: <span className="text-foreground font-medium">{user.points} points</span> <span className="text-xs">(worth {getPointsValue(user.points).toFixed(2)} €)</span></p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setPointsToRedeem(Math.max(0, pointsToRedeem - 10))} disabled={pointsToRedeem === 0} className="h-10 w-10"><Minus className="w-4 h-4" /></Button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-foreground">{pointsToRedeem}</span>
                  <span className="text-sm text-muted-foreground ml-1">points</span>
                  <p className="text-xs text-primary">= {getPointsValue(pointsToRedeem).toFixed(2)} € off</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => setPointsToRedeem(Math.min(user.points, pointsToRedeem + 10))} disabled={pointsToRedeem >= user.points} className="h-10 w-10"><Plus className="w-4 h-4" /></Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPointsToRedeem(user.points)} className="w-full mt-2 text-xs text-primary">Use all {user.points} points</Button>
            </CardContent>
          </Card>
        )}

        {/* Sign-in prompt */}
        {!user && !isGuest && step === "select" && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary" /></div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Earn points on this order!</p>
                  <p className="text-xs text-muted-foreground">Sign in to earn {Math.floor(totalBeforeDiscounts)} points</p>
                </div>
                <Button size="sm" onClick={() => setAuthModalOpen(true)}>Sign In</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment method selection */}
        {step === "select" && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h2 className="font-semibold text-foreground mb-4">Choose Payment Method</h2>
              <div className="space-y-3">
                <button onClick={() => setStep("card-details")} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-left">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><CreditCard className="w-6 h-6 text-primary" /></div>
                  <div className="flex-1"><p className="font-medium text-foreground">Pay with Card</p><p className="text-sm text-muted-foreground">Credit or debit card</p></div>
                  <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                </button>
                <button onClick={handleCashPayment} disabled={isProcessingCash} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-left disabled:opacity-50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Banknote className="w-6 h-6 text-primary" /></div>
                  <div className="flex-1"><p className="font-medium text-foreground">Pay Cash at Counter</p><p className="text-sm text-muted-foreground">Get a QR code — show it at the counter</p></div>
                  {isProcessingCash ? <Spinner className="w-5 h-5" /> : <QrCode className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>
              {error && <p className="text-destructive text-sm mt-3">{error}</p>}
            </CardContent>
          </Card>
        )}

        {/* Card details form */}
        {step === "card-details" && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-primary" /><h2 className="font-semibold text-foreground">Card Details</h2></div>
              <p className="text-xs text-muted-foreground mb-4 bg-secondary/50 p-2 rounded-lg">Demo mode: Enter any card details to simulate payment</p>
              <div className="space-y-4">
                <div><label className="text-sm text-muted-foreground mb-1 block">Card Number</label><Input placeholder="4242 4242 4242 4242" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} className="bg-input border-border text-foreground h-12 rounded-xl" disabled={isProcessing} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm text-muted-foreground mb-1 block">Expiry</label><Input placeholder="MM/YY" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} maxLength={5} className="bg-input border-border text-foreground h-12 rounded-xl" disabled={isProcessing} /></div>
                  <div><label className="text-sm text-muted-foreground mb-1 block">CVC</label><Input placeholder="123" value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").substring(0, 4))} maxLength={4} className="bg-input border-border text-foreground h-12 rounded-xl" disabled={isProcessing} /></div>
                </div>
                <div><label className="text-sm text-muted-foreground mb-1 block">Cardholder Name</label><Input placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="bg-input border-border text-foreground h-12 rounded-xl" disabled={isProcessing} /></div>
              </div>
              {error && <p className="text-destructive text-sm mt-3">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>

      {step === "card-details" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
          <div className="max-w-md mx-auto">
            <Button onClick={handlePayment} disabled={isProcessing} className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
              {isProcessing
                ? <span className="flex items-center gap-2"><Spinner className="w-5 h-5" />Processing...</span>
                : <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Pay {total.toFixed(2)} €</span>}
            </Button>
          </div>
        </div>
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}
