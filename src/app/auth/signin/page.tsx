/* ───────── src/app/auth/signin/page.tsx ───────── */
"use client"

import { useState }               from "react"
import { useRouter }              from "next/navigation"
import { signIn }                 from "next-auth/react"
import Link                       from "next/link"
import { Button }                 from "@/components/ui/button"
import { Input }                  from "@/components/ui/input"
import { Card, CardHeader,
         CardTitle, CardContent } from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()

  /* form state */
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  /* handle submit */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")

    try {
      const res = await signIn("credentials", { redirect:false, email, password })
      res?.error
        ? setError("Invalid credentials – please try again.")
        : router.push("/dashboard")
    } catch {
      setError("Unexpected server error. Please retry.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 p-6">

      <Card className="w-full max-w-md shadow-2xl backdrop-blur-md bg-white/80 border-none">

        {/* heading */}
        <CardHeader>
          <CardTitle className="text-center text-4xl font-extrabold text-gray-900">
            Sign&nbsp;in&nbsp;to&nbsp;FinanSync
          </CardTitle>
          <p className="mt-2 text-center text-gray-700">
            Access your financial workspace
          </p>
        </CardHeader>

        {/* form */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative mt-1">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 shadow-sm"
                />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pr-10 shadow-sm"
                />
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPw(!showPw)}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* error message */}
            {error && (
              <p className="bg-red-100 border border-red-300 text-red-700 text-sm rounded p-2">
                {error}
              </p>
            )}

            {/* submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r
                         from-yellow-400 to-orange-500
                         hover:from-yellow-500 hover:to-orange-600
                         text-black font-semibold py-3 rounded-md shadow-lg
                         active:scale-95 transition-transform"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* test credentials block */}
          <div className="mt-6 bg-gray-100 rounded-md p-4 text-gray-700 text-sm">
            <p className="font-semibold mb-1">Demo credentials</p>
            <p>Email&nbsp;•&nbsp;<code>test@finansync.com</code></p>
            <p>Pass&nbsp;&nbsp;•&nbsp;<code>testpassword</code></p>
          </div>

          {/* footer links */}
          <div className="mt-6 flex justify-between text-sm text-gray-600">
            <Link href="/auth/signup" className="hover:text-gray-900">
              Create an account
            </Link>
            <Link href="/auth/forgot-password" className="hover:text-gray-900">
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
