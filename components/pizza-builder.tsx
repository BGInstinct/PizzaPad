"use client"

import { useState } from "react"
import { Check, Plus, Minus, ChevronLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  SIZES,
  CRUSTS,
  SAUCES,
  CHEESE_AMOUNTS,
  TOPPINGS,
  calculatePizzaPrice,
  DEFAULT_PIZZA,
  type PizzaConfig,
  type SizeId,
  type CrustId,
  type SauceId,
  type CheeseId,
  type ToppingId,
} from "@/lib/pizza-data"

interface PizzaBuilderProps {
  onAddToCart: (pizza: PizzaConfig, price: number) => void
  onBack: () => void
  cartItemCount: number
  onViewCart: () => void
}

export function PizzaBuilder({ onAddToCart, onBack, cartItemCount, onViewCart }: PizzaBuilderProps) {
  const [config, setConfig] = useState<PizzaConfig>(DEFAULT_PIZZA)
  const price = calculatePizzaPrice(config)

  const updateConfig = <K extends keyof PizzaConfig>(key: K, value: PizzaConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const toggleTopping = (toppingId: ToppingId) => {
    setConfig(prev => ({
      ...prev,
      toppings: prev.toppings.includes(toppingId)
        ? prev.toppings.filter(t => t !== toppingId)
        : [...prev.toppings, toppingId]
    }))
  }

  const handleAddToCart = () => {
    onAddToCart(config, price)
    setConfig(DEFAULT_PIZZA)
  }

  const meatToppings = TOPPINGS.filter(t => t.category === "meats")
  const veggieToppings = TOPPINGS.filter(t => t.category === "veggies")

  return (
    <div className="min-h-dvh flex flex-col bg-background pb-32">
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
          
          <h1 className="text-lg font-semibold text-foreground">Build Your Pizza</h1>
          
          <button 
            onClick={onViewCart}
            className="relative p-2"
          >
            <ShoppingCart className="w-6 h-6 text-foreground" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {/* Size Selection */}
        <Section title="Choose Size">
          <div className="grid grid-cols-2 gap-3">
            {SIZES.map(size => (
              <OptionCard
                key={size.id}
                selected={config.size === size.id}
                onClick={() => updateConfig("size", size.id as SizeId)}
                title={size.name}
                subtitle={size.description}
                price={`${size.price.toFixed(2)} \u20AC`}
              />
            ))}
          </div>
        </Section>

        {/* Crust Selection */}
        <Section title="Choose Crust">
          <div className="space-y-3">
            {CRUSTS.map(crust => (
              <OptionRow
                key={crust.id}
                selected={config.crust === crust.id}
                onClick={() => updateConfig("crust", crust.id as CrustId)}
                title={crust.name}
                price={crust.price > 0 ? `+${crust.price.toFixed(2)} \u20AC` : "Included"}
              />
            ))}
          </div>
        </Section>

        {/* Sauce Selection */}
        <Section title="Choose Sauce">
          <div className="space-y-3">
            {SAUCES.map(sauce => (
              <OptionRow
                key={sauce.id}
                selected={config.sauce === sauce.id}
                onClick={() => updateConfig("sauce", sauce.id as SauceId)}
                title={sauce.name}
                price={sauce.price > 0 ? `+${sauce.price.toFixed(2)} \u20AC` : "Included"}
              />
            ))}
          </div>
        </Section>

        {/* Cheese Amount */}
        <Section title="Cheese Amount">
          <div className="flex gap-2">
            {CHEESE_AMOUNTS.map(cheese => (
              <button
                key={cheese.id}
                onClick={() => updateConfig("cheese", cheese.id as CheeseId)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
                  config.cheese === cheese.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground hover:border-primary/50"
                )}
              >
                {cheese.name}
              </button>
            ))}
          </div>
        </Section>

        {/* Toppings - Meats */}
        <Section title="Add Toppings - Meats">
          <div className="grid grid-cols-2 gap-3">
            {meatToppings.map(topping => (
              <ToppingCard
                key={topping.id}
                selected={config.toppings.includes(topping.id)}
                onClick={() => toggleTopping(topping.id)}
                title={topping.name}
                price={`+${topping.price.toFixed(2)} \u20AC`}
              />
            ))}
          </div>
        </Section>

        {/* Toppings - Veggies */}
        <Section title="Add Toppings - Veggies">
          <div className="grid grid-cols-2 gap-3">
            {veggieToppings.map(topping => (
              <ToppingCard
                key={topping.id}
                selected={config.toppings.includes(topping.id)}
                onClick={() => toggleTopping(topping.id)}
                title={topping.name}
                price={`+${topping.price.toFixed(2)} \u20AC`}
              />
            ))}
          </div>
        </Section>

        {/* Special Instructions */}
        <Section title="Special Instructions">
          <Textarea
            placeholder="Any allergies or special requests..."
            value={config.specialInstructions}
            onChange={(e) => updateConfig("specialInstructions", e.target.value)}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground resize-none h-24 rounded-xl"
          />
        </Section>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-inset-bottom">
        <Button
          onClick={handleAddToCart}
          className="w-full h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <span>Add to Order</span>
          <span className="ml-2 px-3 py-1 bg-primary-foreground/20 rounded-lg">
            {price.toFixed(2)} \u20AC
          </span>
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </section>
  )
}

function OptionCard({ 
  selected, 
  onClick, 
  title, 
  subtitle, 
  price 
}: { 
  selected: boolean
  onClick: () => void
  title: string
  subtitle: string
  price: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl text-left transition-all",
        selected
          ? "bg-primary/10 border-2 border-primary"
          : "bg-card border border-border hover:border-primary/50"
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
      <p className="text-primary font-medium mt-2">{price}</p>
    </button>
  )
}

function OptionRow({ 
  selected, 
  onClick, 
  title, 
  price 
}: { 
  selected: boolean
  onClick: () => void
  title: string
  price: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl transition-all",
        selected
          ? "bg-primary/10 border-2 border-primary"
          : "bg-card border border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          selected ? "border-primary bg-primary" : "border-muted-foreground"
        )}>
          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <span className={cn(
        "text-sm font-medium",
        price === "Included" ? "text-muted-foreground" : "text-primary"
      )}>
        {price}
      </span>
    </button>
  )
}

function ToppingCard({ 
  selected, 
  onClick, 
  title, 
  price 
}: { 
  selected: boolean
  onClick: () => void
  title: string
  price: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-between p-4 rounded-xl transition-all",
        selected
          ? "bg-primary/10 border-2 border-primary"
          : "bg-card border border-border hover:border-primary/50"
      )}
    >
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-primary text-xs">{price}</p>
      </div>
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
      )}>
        {selected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </div>
    </button>
  )
}
