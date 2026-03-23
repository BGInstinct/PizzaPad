"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  name: string
  points: number
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isGuest: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  continueAsGuest: () => void
  addPoints: (amount: number) => void
  redeemPoints: (points: number) => number // returns euro discount
  getPointsValue: (points: number) => number // converts points to euros
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple hash function for demo purposes (in production, use bcrypt on server)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "pizzapad_salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const USERS_KEY = "pizzapad_users"
const CURRENT_USER_KEY = "pizzapad_current_user"
const GUEST_KEY = "pizzapad_guest"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem(CURRENT_USER_KEY)
    const storedGuest = localStorage.getItem(GUEST_KEY)
    
    if (storedUserId) {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
      const foundUser = users.find((u: User & { passwordHash: string }) => u.id === storedUserId)
      if (foundUser) {
        const { passwordHash, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
      }
    } else if (storedGuest === "true") {
      setIsGuest(true)
    }
    
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
    const hashedPassword = await hashPassword(password)
    
    const foundUser = users.find(
      (u: User & { passwordHash: string }) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hashedPassword
    )
    
    if (!foundUser) {
      return { success: false, error: "Invalid email or password" }
    }
    
    const { passwordHash, ...userWithoutPassword } = foundUser
    setUser(userWithoutPassword)
    setIsGuest(false)
    localStorage.setItem(CURRENT_USER_KEY, foundUser.id)
    localStorage.removeItem(GUEST_KEY)
    
    return { success: true }
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
    
    // Check if email already exists
    if (users.some((u: User) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "Email already registered" }
    }
    
    const hashedPassword = await hashPassword(password)
    const newUser = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      points: 0,
      createdAt: new Date().toISOString(),
      passwordHash: hashedPassword,
    }
    
    users.push(newUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    
    const { passwordHash, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    setIsGuest(false)
    localStorage.setItem(CURRENT_USER_KEY, newUser.id)
    localStorage.removeItem(GUEST_KEY)
    
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsGuest(false)
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem(GUEST_KEY)
  }, [])

  const continueAsGuest = useCallback(() => {
    setUser(null)
    setIsGuest(true)
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.setItem(GUEST_KEY, "true")
  }, [])

  const addPoints = useCallback((amount: number) => {
    if (!user) return
    
    const pointsToAdd = Math.floor(amount) // 1 point per 1 euro
    const updatedUser = { ...user, points: user.points + pointsToAdd }
    setUser(updatedUser)
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
    const userIndex = users.findIndex((u: User) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], points: updatedUser.points }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
  }, [user])

  const getPointsValue = useCallback((points: number): number => {
    // 10 points = 1 euro
    return points / 10
  }, [])

  const redeemPoints = useCallback((points: number): number => {
    if (!user || points > user.points) return 0
    
    const euroValue = getPointsValue(points)
    const updatedUser = { ...user, points: user.points - points }
    setUser(updatedUser)
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
    const userIndex = users.findIndex((u: User) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], points: updatedUser.points }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
    
    return euroValue
  }, [user, getPointsValue])

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isLoading,
        login,
        signup,
        logout,
        continueAsGuest,
        addPoints,
        redeemPoints,
        getPointsValue,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
