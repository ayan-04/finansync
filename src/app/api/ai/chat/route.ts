import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { FinancialAI } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Fetch user's financial data (same as insights route)
    const [budgets, expenses] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: session.user.id },
        include: {
          expenses: { select: { amount: true } }
        }
      }),
      prisma.expense.findMany({
        where: { userId: session.user.id },
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          budget: { select: { name: true } }
        }
      })
    ])

    const processedData = {
      budgets: budgets.map(b => ({
        name: b.name,
        amount: Number(b.amount),
        spent: b.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      })),
      expenses: expenses.map(e => ({
        name: e.name,
        amount: Number(e.amount),
        category: e.budget.name,
        date: e.createdAt.toISOString()
      })),
      monthlySpending: [] // Can add if needed
    }

    // Get AI answer
    const answer = await FinancialAI.answerFinancialQuestion(question, processedData)

    return NextResponse.json({ answer })

  } catch (error) {
    console.error('AI Chat API Error:', error)
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 })
  }
}
