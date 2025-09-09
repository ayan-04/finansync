/* ── src/components/dashboard/Navbar.tsx ── */
"use client"

import { useState }                   from "react"
import Link                           from "next/link"
import { useRouter }                  from "next/navigation"
import { useSession, signOut }        from "next-auth/react"
import { RefreshCcw, Menu, X }        from "lucide-react"
import { Button }                     from "@/components/ui/button"

const tabs = [
  { href: "/dashboard",             label: "Overview" },
  { href: "/dashboard/analytics",   label: "Analytics" },
  { href: "/dashboard/ai",          label: "AI Assistant" },
  { href: "/dashboard/expenses",    label: "Expenses" },
  { href: "/dashboard/reports",     label: "Reports" }
]

export default function Navbar() {
  const { data: session, status } = useSession()
  const router                    = useRouter()

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)

  const goto      = (url:string) => { setMobileOpen(false); router.push(url) }
  const handleOut = ()            => signOut({ callbackUrl: "/" })

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
          {status === "loading" ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-blue-600 text-white grid place-content-center font-semibold"
                aria-label="Account menu"
              >
                {session ? session.user?.name?.[0].toUpperCase() : "U"}
              </button>

              {/* dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-1 z-50">
                  {session && (
                    <>
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
                    </>
                  )}
                  {!session && (
                    <>
                      <button
                        onClick={() => goto("/auth/signin")}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => goto("/auth/signup")}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Get started
                      </button>
                    </>
                  )}
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
            {mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5" />}
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
            {session ? (
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
                <Button className="w-full mb-2" onClick={() => goto("/auth/signin")}>
                  Sign in
                </Button>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => goto("/auth/signup")}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
