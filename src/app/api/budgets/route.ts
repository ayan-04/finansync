import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReportsService } from '@/lib/services/reports'
import { currentUser } from '@clerk/nextjs/server'

// GET all budgets for user
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      include: {
        expenses: {
          select: {
            id: true,
            amount: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    // Calculate stats
    const budgetsWithStats = budgets.map(budget => {
      const spent = budget.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      )
      const amount = Number(budget.amount)
      const percentage = amount > 0 ? (spent / amount) * 100 : 0
      return {
        ...budget,
        amount,
        spent,
        percentage,
        remaining: amount - spent,
        isOverBudget: spent > amount,
        expenses: undefined // Remove raw expenses list for clean data
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
    const user = await currentUser()
    if (!user?.id) {
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
    // Prevent duplicate budget names per user
    const existingBudget = await prisma.budget.findFirst({
      where: { name, userId: user.id }
    })
    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget with this name already exists' },
        { status: 409 }
      )
    }
    // Create budget
    const budget = await prisma.budget.create({
      data: {
        name,
        amount: parseFloat(amount),
        icon: icon || '💰',
        color: color || '#3b82f6',
        userId: user.id
      }
    })
    // Cache clear
    await ReportsService.clearUserReportsCache(user.id)
    console.log('🗑️ Cache invalidated after budget creation')
    return NextResponse.json(
      {
        ...budget,
        amount: Number(budget.amount),
        spent: 0,
        percentage: 0,
        remaining: Number(budget.amount),
        isOverBudget: false
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
