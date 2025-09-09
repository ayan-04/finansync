import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { FinancialAI } from '@/lib/ai/gemini'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's financial data
    const [budgets, expenses] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: session.user.id },
        include: {
          expenses: {
            select: { amount: true }
          }
        }
      }),
      prisma.expense.findMany({
        where: { userId: session.user.id },
        take: 50, // Last 50 expenses
        orderBy: { createdAt: 'desc' },
        include: {
          budget: { select: { name: true } }
        }
      })
    ])

    // Process data for AI analysis
    const processedBudgets = budgets.map(budget => {
      const spent = budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
      const amount = Number(budget.amount)
      const percentage = amount > 0 ? (spent / amount) * 100 : 0

      return {
        name: budget.name,
        amount,
        spent,
        percentage
      }
    })

    const processedExpenses = expenses.map(expense => ({
      name: expense.name,
      amount: Number(expense.amount),
      category: expense.budget.name,
      date: expense.createdAt.toISOString()
    }))

    // Calculate monthly spending
    const monthlySpending = expenses.reduce((acc, expense) => {
      const month = expense.createdAt.toISOString().slice(0, 7) // YYYY-MM format
      if (!acc[month]) acc[month] = 0
      acc[month] += Number(expense.amount)
      return acc
    }, {} as Record<string, number>)

    const monthlyData = Object.entries(monthlySpending).map(([month, amount]) => ({
      month,
      amount
    }))

    // Generate AI insights
    const insights = await FinancialAI.generateSpendingInsights({
      budgets: processedBudgets,
      expenses: processedExpenses,
      monthlySpending: monthlyData
    })

    return NextResponse.json({ insights })

  } catch (error) {
    console.error('AI Insights API Error:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
