/* ── src/components/dashboard/Navbar.tsx ── */
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RefreshCcw, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, useClerk, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

const tabs = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/ai", label: "AI Assistant" },
  { href: "/dashboard/expenses", label: "Expenses" },
  { href: "/dashboard/reports", label: "Reports" }
]

export default function Navbar() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const goto = (url: string) => { setMobileOpen(false); router.push(url) }
  const handleOut = () => { signOut(); router.push("/") }

  // Get user's display name initial
  const userInitial = user?.firstName?.[0]?.toUpperCase()
    || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()
    || "U"

  /* ─ UI ─────────────────────────────────────────────── */
  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <nav className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Brand */}
        <Link href="/dashboard" className="text-xl font-extrabold text-blue-700">
          FinanSync
        </Link>

        {/* Tabs (desktop) */}
        <ul className="hidden lg:flex items-center space-x-6">
          {tabs.map(t => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right-hand cluster */}
        <div className="flex items-center space-x-4">
          {/* Last-updated & refresh */}
          <div className="hidden md:flex flex-col items-end leading-none">
            <span className="text-[11px] text-gray-400">Last updated</span>
            <span className="text-xs font-semibold text-gray-700">Just now</span>
          </div>
          <Button size="icon" variant="outline" onClick={() => router.refresh()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>

          {/* Avatar / auth */}
          {!isLoaded ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-blue-600 text-white grid place-content-center font-semibold"
                aria-label="Account menu"
              >
                {userInitial}
              </button>
              {/* dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => goto("/dashboard/profile")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleOut}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-gray-300 text-gray-700 grid place-content-center font-semibold"
                aria-label="Account menu"
              >
                U
              </button>
              {/* dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-1 z-50">
                  <SignInButton>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Get started
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          )}

          {/* Burger (mobile) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle nav"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="lg:hidden bg-white border-t shadow-md">
          {tabs.map(t => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              {t.label}
            </Link>
          ))}
          <div className="border-t p-4">
            {user ? (
              <>
                <Button className="w-full mb-2" onClick={() => goto("/dashboard/profile")}>
                  Profile
                </Button>
                <Button className="w-full" variant="outline" onClick={handleOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <SignInButton>
                  <Button className="w-full mb-2">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Get started
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
