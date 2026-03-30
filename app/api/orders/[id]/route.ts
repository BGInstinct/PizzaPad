import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const ORDERS_FILE = path.join(DATA_DIR, "orders.json")

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

async function readOrders() {
  await ensureDataFile()
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeOrders(orders: unknown[]) {
  await ensureDataFile()
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8")
}

// GET - Retrieve a single order by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orders = await readOrders()
    const order = orders.find((o: { id: string }) => o.id === id)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    return NextResponse.json(order)
  } catch (error) {
    console.error("Error reading order:", error)
    return NextResponse.json({ error: "Failed to read order" }, { status: 500 })
  }
}

// PATCH - Update an order (mark as paid, record cash received, change)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()
    const orders = await readOrders()
    const index = orders.findIndex((o: { id: string }) => o.id === id)

    if (index === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    orders[index] = {
      ...orders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    await writeOrders(orders)
    return NextResponse.json(orders[index])
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
