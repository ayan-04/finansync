import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { ReportsService } from '@/lib/services/reports'
import { currentUser } from '@clerk/nextjs/server'

// GET single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenseId = params.id

    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId: user.id
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// UPDATE expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenseId = params.id
    const { name, amount, budgetId, description } = await request.json()

    if (!name || !amount || !budgetId) {
      return NextResponse.json(
        { error: 'Name, amount, and budgetId are required' }, 
        { status: 400 }
      )
    }

    // Verify expense belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId: user.id
      }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Verify budget belongs to user
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: user.id
      }
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const updatedExpense = await prisma.expense.update({
      where: {
        id: expenseId,
        userId: user.id
      },
      data: {
        name,
        amount: parseFloat(amount),
        budgetId,
        description: description || null
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })

    // ✅ Clear reports cache after expense update
    await ReportsService.clearUserReportsCache(user.id)
    console.log('🗑️ Cache invalidated after expense update')

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenseId = params.id

    // Verify expense belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId: user.id
      }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: {
        id: expenseId,
        userId: user.id
      }
    })

    // ✅ Clear reports cache after expense deletion
    await ReportsService.clearUserReportsCache(user.id)
    console.log('🗑️ Cache invalidated after expense deletion')

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
