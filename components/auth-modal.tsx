"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Lock, Gift, ArrowRight, Sparkles } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { login, signup, continueAsGuest } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === "login") {
        const result = await login(email, password)
        if (result.success) {
          onOpenChange(false)
          resetForm()
        } else {
          setError(result.error || "Login failed")
        }
      } else {
        if (!name.trim()) {
          setError("Please enter your name")
          setIsLoading(false)
          return
        }
        const result = await signup(email, password, name)
        if (result.success) {
          onOpenChange(false)
          resetForm()
        } else {
          setError(result.error || "Signup failed")
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestCheckout = () => {
    continueAsGuest()
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setName("")
    setError(null)
    setMode("login")
  }

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to earn points and redeem rewards"
              : "Join to start earning points on every order"}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits Banner */}
        <div className="bg-primary/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Member Benefits</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li className="flex items-center gap-2">
              <Gift className="w-3 h-3 text-primary" />
              Earn 1 point for every 1 euro spent
            </li>
            <li className="flex items-center gap-2">
              <Gift className="w-3 h-3 text-primary" />
              Redeem 10 points for 1 euro off
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              "Loading..."
            ) : mode === "login" ? (
              <span className="flex items-center gap-2">
                Sign In <ArrowRight className="w-4 h-4" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create Account <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-12"
          onClick={handleGuestCheckout}
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            Continue as Guest
            <span className="text-xs text-primary font-normal">(5% discount)</span>
          </span>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              {"Don't have an account? "}
              <button
                type="button"
                onClick={switchMode}
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  )
}
