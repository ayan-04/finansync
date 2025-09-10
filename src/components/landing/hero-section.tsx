// src/components/landing/hero-section.tsx
"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export function HeroSection() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const authenticated = !!user

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
      {/* decoration omitted for brevity */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}
          className="text-5xl lg:text-7xl font-extrabold leading-tight"
        >
          Master Your{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            FinanSync
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .8, delay: .1 }}
          className="mt-6 max-w-2xl text-xl text-blue-100 leading-relaxed"
        >
          Real-time budgets, automatic expense tracking and monthly PDF reports—everything you
          need to keep your money on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .8, delay: .2 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Button
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-8 py-4"
            onClick={() => (authenticated ? router.push("/dashboard") : router.push("/auth/signin"))}
          >
            {authenticated ? "Open Dashboard" : "Start Free Trial"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
