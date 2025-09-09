// src/components/landing/cta-section.tsx
"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export function CTASection() {
  const { data: session } = useSession()
  const router             = useRouter()

  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
      {/* faint diagonal lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
           style={{backgroundImage:
            "repeating-linear-gradient(135deg,rgba(255,255,255,.06)0,rgba(255,255,255,.06)2px,transparent 2px,transparent 12px)"}}/>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* headline */}
        <motion.h2
          initial={{opacity:0,y:20}}
          whileInView={{opacity:1,y:0}}
          transition={{duration:.7}}
          className="text-4xl lg:text-5xl font-extrabold leading-tight"
        >
          Turn Every Rupee&nbsp;
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            into a plan
          </span>
        </motion.h2>

        {/* sub-copy */}
        <motion.p
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
          transition={{duration:.7,delay:.1}}
          className="mt-6 text-xl text-blue-100"
        >
          FinanSync keeps your budgets live, bills on time and month-end
          reports ready—so you can focus on everything else.
        </motion.p>

        {/* three-bullet promise */}
        <div className="mt-10 grid sm:grid-cols-3 gap-6 justify-items-center">
          {["Always up-to-date", "Actionable insights", "Simple to switch"]
            .map((text, i) => (
              <motion.div
                key={text}
                initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
                transition={{duration:.5,delay:.15+i*0.05}}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5 text-green-400"/>
                <span className="text-blue-100">{text}</span>
              </motion.div>
          ))}
        </div>

        {/* single CTA button */}
        <motion.div
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
          transition={{duration:.7,delay:.25}}
          className="mt-14"
        >
          <Button
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-10 py-4 text-lg shadow-lg"
            onClick={() => session ? router.push("/dashboard")
                                    : router.push("/auth/signin")}
          >
            {session ? "Open My Dashboard" : "Start Managing Money"}
            <ArrowRight className="ml-3 w-5 h-5"/>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
