export const SIZES = [
  { id: "small", name: "Small", description: '25 cm', price: 6.59 },
  { id: "medium", name: "Medium", description: '30 cm', price: 8.39 },
  { id: "large", name: "Large", description: '35 cm', price: 10.19 },
  { id: "xlarge", name: "X-Large", description: '40 cm', price: 11.99 },
] as const

export const CRUSTS = [
  { id: "thin", name: "Thin Crust", price: 0 },
  { id: "classic", name: "Classic Hand-Tossed", price: 0 },
  { id: "thick", name: "Thick & Fluffy", price: 0.90 },
  { id: "stuffed", name: "Cheese Stuffed", price: 1.80 },
] as const

export const SAUCES = [
  { id: "marinara", name: "Classic Marinara", price: 0 },
  { id: "garlic", name: "Garlic Parmesan", price: 0.30 },
  { id: "bbq", name: "Smoky BBQ", price: 0.30 },
  { id: "buffalo", name: "Buffalo", price: 0.30 },
  { id: "none", name: "No Sauce", price: 0 },
] as const

export const CHEESE_AMOUNTS = [
  { id: "light", name: "Light", price: 0 },
  { id: "normal", name: "Normal", price: 0 },
  { id: "extra", name: "Extra", price: 1.20 },
  { id: "none", name: "No Cheese", price: -0.60 },
] as const

export const TOPPINGS = [
  { id: "pepperoni", name: "Pepperoni", price: 0.90, category: "meats" },
  { id: "sausage", name: "Italian Sausage", price: 0.90, category: "meats" },
  { id: "bacon", name: "Crispy Bacon", price: 1.05, category: "meats" },
  { id: "ham", name: "Ham", price: 0.90, category: "meats" },
  { id: "chicken", name: "Grilled Chicken", price: 1.20, category: "meats" },
  { id: "mushrooms", name: "Mushrooms", price: 0.60, category: "veggies" },
  { id: "onions", name: "Red Onions", price: 0.45, category: "veggies" },
  { id: "peppers", name: "Bell Peppers", price: 0.45, category: "veggies" },
  { id: "olives", name: "Black Olives", price: 0.60, category: "veggies" },
  { id: "jalapenos", name: "Jalapenos", price: 0.45, category: "veggies" },
  { id: "tomatoes", name: "Fresh Tomatoes", price: 0.60, category: "veggies" },
  { id: "spinach", name: "Fresh Spinach", price: 0.60, category: "veggies" },
  { id: "pineapple", name: "Pineapple", price: 0.60, category: "veggies" },
] as const

export type SizeId = typeof SIZES[number]["id"]
export type CrustId = typeof CRUSTS[number]["id"]
export type SauceId = typeof SAUCES[number]["id"]
export type CheeseId = typeof CHEESE_AMOUNTS[number]["id"]
export type ToppingId = typeof TOPPINGS[number]["id"]

export interface PizzaConfig {
  size: SizeId
  crust: CrustId
  sauce: SauceId
  cheese: CheeseId
  toppings: ToppingId[]
  specialInstructions: string
}

export interface CartItem {
  id: string
  pizza: PizzaConfig
  quantity: number
  price: number
}

export function calculatePizzaPrice(config: PizzaConfig): number {
  const size = SIZES.find(s => s.id === config.size)
  const crust = CRUSTS.find(c => c.id === config.crust)
  const sauce = SAUCES.find(s => s.id === config.sauce)
  const cheese = CHEESE_AMOUNTS.find(c => c.id === config.cheese)
  
  let price = size?.price || 0
  price += crust?.price || 0
  price += sauce?.price || 0
  price += cheese?.price || 0
  
  config.toppings.forEach(toppingId => {
    const topping = TOPPINGS.find(t => t.id === toppingId)
    price += topping?.price || 0
  })
  
  return Math.round(price * 100) / 100
}

export function getPizzaDescription(config: PizzaConfig): string {
  const size = SIZES.find(s => s.id === config.size)
  const crust = CRUSTS.find(c => c.id === config.crust)
  const sauce = SAUCES.find(s => s.id === config.sauce)
  const cheese = CHEESE_AMOUNTS.find(c => c.id === config.cheese)
  const toppingNames = config.toppings.map(t => TOPPINGS.find(top => top.id === t)?.name).filter(Boolean)
  
  const parts = [
    `${size?.name} ${size?.description}`,
    crust?.name,
    sauce?.name,
    `${cheese?.name} cheese`,
  ]
  
  if (toppingNames.length > 0) {
    parts.push(toppingNames.join(", "))
  }
  
  return parts.join(" • ")
}

export const DEFAULT_PIZZA: PizzaConfig = {
  size: "medium",
  crust: "classic",
  sauce: "marinara",
  cheese: "normal",
  toppings: [],
  specialInstructions: "",
}
