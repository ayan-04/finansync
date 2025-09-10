/* ───── src/components/landing/navbar.tsx ───── */
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useUser, useClerk } from "@clerk/nextjs"

export default function Navbar() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  // log-out → land on /
  const handleSignOut = () => { signOut(); router.push("/") }

  // Get first name, else fall back to email, else blank
  const greeting = user?.firstName
    || user?.emailAddresses?.[0]?.emailAddress
    || ""

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">F</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent transition-colors group-hover:from-yellow-500 group-hover:to-orange-400">
            FinanSync
          </span>
        </Link>

        {/* right-side actions */}
        <div className="flex items-center space-x-3">
          {!isLoaded ? null : user ? (
            <>
              <span className="text-sm text-gray-700 hidden sm:inline">
                Hi,&nbsp;{greeting}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/auth/signin")}
              className="font-medium hover:bg-yellow-50 text-yellow-600"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
