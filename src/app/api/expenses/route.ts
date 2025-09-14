import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReportsService } from '@/lib/services/reports'
import { currentUser } from '@clerk/nextjs/server'

// GET all expenses for user
export async function GET() {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id },
      include: {
        budget: {
          select: { id: true, name: true, icon: true, color: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// CREATE new expense
export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { name, amount, budgetId, description } = await request.json()
    if (!name || !amount || !budgetId) {
      return NextResponse.json(
        { error: 'Name, amount, and budgetId are required' },
        { status: 400 }
      )
    }
    // Verify the budget belongs to the user
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId: user.id }
    })
    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }
    const expense = await prisma.expense.create({
      data: {
        name,
        amount: parseFloat(amount),
        description: description || null,
        userId: user.id,
        budgetId
      },
      include: {
        budget: { select: { id: true, name: true, icon: true, color: true } }
      }
    })
    await ReportsService.clearUserReportsCache(user.id)
    console.log('🗑️ Cache invalidated after expense creation')
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
