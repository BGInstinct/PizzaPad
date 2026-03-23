"use client"

import { Pizza, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeScreenProps {
  restaurantName: string
  tableNumber: string
  onStartOrder: () => void
}

export function WelcomeScreen({ restaurantName, tableNumber, onStartOrder }: WelcomeScreenProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-6 py-12">
      {/* Header */}
      <div className="text-center">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Welcome to
        </p>
        <h2 className="text-xl font-semibold text-foreground mt-1">
          {restaurantName}
        </h2>
      </div>

      {/* Logo & Branding */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <Pizza className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-lg">QR</span>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            PizzaPad
          </h1>
          <p className="text-muted-foreground mt-2">
            Build your perfect pizza
          </p>
        </div>

        {/* Table Info Card */}
        <div className="bg-card border border-border rounded-2xl px-8 py-4 text-center">
          <p className="text-muted-foreground text-sm">Table Number</p>
          <p className="text-3xl font-bold text-foreground">{tableNumber}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full">
        <Button 
          onClick={onStartOrder}
          className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Start Order
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-muted-foreground text-sm mt-4">
          Tap to begin building your pizza
        </p>
      </div>
    </div>
  )
}
