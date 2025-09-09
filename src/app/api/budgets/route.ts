import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { ReportsService } from '@/lib/services/reports' // ✅ Add this import

// GET all budgets for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        expenses: {
          select: {
            id: true,
            amount: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate spent amounts and percentages
const budgetsWithStats = budgets.map(budget => {
  const spent = budget.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  const amount = budget.amount.toNumber()  // Convert Decimal → number
  const percentage = amount > 0 ? (spent / amount) * 100 : 0
      return {
        ...budget,
        amount: Number(budget.amount),
        spent,
        percentage,
        remaining: Number(budget.amount) - spent,
        isOverBudget: spent > Number(budget.amount),
        expenses: undefined // Remove expenses from response for cleaner data
      }
    })

    return NextResponse.json(budgetsWithStats)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// CREATE new budget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, amount, icon, color } = await request.json()

    if (!name || !amount) {
      return NextResponse.json(
        { error: 'Name and amount are required' }, 
        { status: 400 }
      )
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' }, 
        { status: 400 }
      )
    }

    // Check if budget name already exists for this user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        name,
        userId: session.user.id
      }
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget with this name already exists' }, 
        { status: 409 }
      )
    }

    // Create the budget
    const budget = await prisma.budget.create({
      data: {
        name,
        amount: parseFloat(amount),
        icon: icon || '💰',
        color: color || '#3b82f6',
        userId: session.user.id
      }
    })

    // ✅ Clear reports cache after budget creation
    await ReportsService.clearUserReportsCache(session.user.id)
    console.log('🗑️ Cache invalidated after budget creation')

    return NextResponse.json({
      ...budget,
      amount: Number(budget.amount),
      spent: 0,
      percentage: 0,
      remaining: Number(budget.amount),
      isOverBudget: false
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating budget:', error)
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
