// src/components/landing/features-section.tsx
"use client"

import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, CalendarCheck, FileText } from "lucide-react"

const productFeatures = [
  {
    icon: DollarSign,
    title: "Budget Automation",
    description:
      "Create monthly budgets in seconds. Set limits and let FinanSync categorise every expense for you.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: TrendingUp,
    title: "Live Spend Tracking",
    description:
      "See every purchase appear in real-time across web and mobile. Instant insights, no refresh needed.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    icon: CalendarCheck,
    title: "Smart Reminders",
    description:
      "Get notified when you approach a limit or a bill is due. Stay one step ahead of overspending.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: FileText,
    title: "Monthly PDF Reports",
    description:
      "FinanSync emails you a clean, share-ready PDF summary at the end of each month. No manual export.",
    color: "from-purple-500 to-fuchsia-500",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}
          className="text-center text-4xl lg:text-5xl font-bold text-gray-900 mb-16"
        >
          Everything Your Money Needs
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {productFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: .5, delay: i * 0.1 }}
            >
              <Card className="h-full border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${f.color} p-3 mb-4`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{f.title}</CardTitle>
                </CardHeader>

                <CardContent className="text-gray-600">{f.description}</CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
