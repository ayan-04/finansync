import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { ReportsService } from '@/lib/services/reports' // ✅ Add this import

// GET single budget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: budgetId } = await params

    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: session.user.id
      },
      include: {
        expenses: {
          select: {
            id: true,
            amount: true,
            name: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Calculate spent amount and percentage
    const spent = budget.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    )

    const numericAmount = budget.amount.toNumber() // Convert Decimal → number
    const percentage = numericAmount > 0 ? (spent / numericAmount) * 100 : 0

    const budgetWithStats = {
      ...budget,
      amount: numericAmount,
      spent,
      percentage,
      remaining: numericAmount - spent,
      isOverBudget: spent > numericAmount
    }

    return NextResponse.json(budgetWithStats)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// UPDATE budget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: budgetId } = await params
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

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: session.user.id
      }
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Check if new name conflicts with other budgets (excluding current one)
    if (name !== existingBudget.name) {
      const nameConflict = await prisma.budget.findFirst({
        where: {
          name,
          userId: session.user.id,
          id: { not: budgetId }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Budget with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update the budget
    const budget = await prisma.budget.update({
      where: {
        id: budgetId,
        userId: session.user.id
      },
      data: {
        name,
        amount: parseFloat(amount),
        icon: icon || existingBudget.icon,
        color: color || existingBudget.color
      },
      include: {
        expenses: {
          select: {
            amount: true
          }
        }
      }
    })

    // Calculate spent amount and percentage
    const spent = budget.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    )

    const numericAmount = budget.amount.toNumber() // Convert Decimal → number
    const percentage = numericAmount > 0 ? (spent / numericAmount) * 100 : 0

    // ✅ Clear reports cache after budget update
    await ReportsService.clearUserReportsCache(session.user.id)
    console.log('🗑️ Cache invalidated after budget update')

    return NextResponse.json({
      ...budget,
      amount: numericAmount,
      spent,
      percentage,
      remaining: numericAmount - spent,
      isOverBudget: spent > numericAmount,
      expenses: undefined // Remove expenses from response
    })
  } catch (error) {
    console.error('Error updating budget:', error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: budgetId } = await params

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: session.user.id
      },
      include: {
        expenses: {
          select: { id: true }
        }
      }
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Check if budget has expenses
    if (existingBudget.expenses.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete budget with existing expenses. Delete expenses first.'
        },
        { status: 409 }
      )
    }

    // Delete the budget
    await prisma.budget.delete({
      where: {
        id: budgetId,
        userId: session.user.id
      }
    })

    // ✅ Clear reports cache after budget deletion
    await ReportsService.clearUserReportsCache(session.user.id)
    console.log('🗑️ Cache invalidated after budget deletion')

    return NextResponse.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget:', error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
