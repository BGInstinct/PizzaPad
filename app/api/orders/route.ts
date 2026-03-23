import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const ORDERS_FILE = path.join(DATA_DIR, "orders.json")

// Ensure data directory and file exist
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    try {
      await fs.access(ORDERS_FILE)
    } catch {
      await fs.writeFile(ORDERS_FILE, JSON.stringify([]), "utf-8")
    }
  } catch (error) {
    console.error("Error ensuring data file:", error)
  }
}

// Read orders from file
async function readOrders() {
  await ensureDataFile()
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Write orders to file
async function writeOrders(orders: unknown[]) {
  await ensureDataFile()
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8")
}

// GET - Retrieve all orders
export async function GET() {
  try {
    const orders = await readOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error reading orders:", error)
    return NextResponse.json({ error: "Failed to read orders" }, { status: 500 })
  }
}

// POST - Create a new order
export async function POST(request: Request) {
  try {
    const orderData = await request.json()
    
    // Generate a unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    const newOrder = {
      id: orderId,
      ...orderData,
      created_at: new Date().toISOString(),
    }
    
    const orders = await readOrders()
    orders.push(newOrder)
    await writeOrders(orders)
    
    return NextResponse.json({ id: orderId, success: true })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
