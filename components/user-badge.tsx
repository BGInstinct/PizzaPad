"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { AuthModal } from "./auth-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Gift, Sparkles } from "lucide-react"

export function UserBadge() {
  const { user, isGuest, logout } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Not logged in and not guest - show login button
  if (!user && !isGuest) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Sign In</span>
        </Button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    )
  }

  // Guest mode
  if (isGuest) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="hidden sm:inline">Guest</span>
              <span className="text-xs text-primary font-medium">5% off</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Guest Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                You get 5% off all orders
              </p>
              <p className="mt-2 text-xs">
                Sign up to earn points and get even more rewards!
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setAuthModalOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Sign Up for Points
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Exit Guest Mode
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    )
  }

  // Logged in user
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-3 h-3 text-primary" />
            </div>
            <span className="hidden sm:inline max-w-[80px] truncate">{user?.name}</span>
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              {user?.points}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-3">
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Points</span>
                <span className="text-lg font-bold text-primary">{user?.points}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Worth {((user?.points || 0) / 10).toFixed(2)} € in discounts</p>
                <p className="mt-1">Earn 1 point per 1 € spent</p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}
