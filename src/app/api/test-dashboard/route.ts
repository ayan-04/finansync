import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first user for testing
    const testUser = await prisma.user.findFirst()
    
    if (!testUser) {
      return NextResponse.json({ 
        error: 'No users found. Create a test user first.',
        hint: 'Visit /api/create-test-user'
      }, { status: 404 })
    }

    // Fetch dashboard data for test user
    const [budgets, expenses, recentExpenses] = await Promise.all([
      // Budgets with expense aggregation
      prisma.budget.findMany({
        where: { userId: testUser.id },
        include: {
          expenses: {
            select: { amount: true }
          }
        }
      }),
      
      // All expenses for totals
      prisma.expense.findMany({
        where: { userId: testUser.id },
        select: { amount: true }
      }),
      
      // Recent expenses with budget info
      prisma.expense.findMany({
        where: { userId: testUser.id },
        include: {
          budget: {
            select: { name: true, icon: true, color: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    // Calculate totals
    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0)
    const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Calculate budget progress
    const budgetProgress = budgets.map(budget => {
      const spent = budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
      return {
        id: budget.id,
        name: budget.name,
        amount: Number(budget.amount),
        spent,
        percentage: Number(budget.amount) > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0,
        icon: budget.icon,
        color: budget.color,
        remaining: Number(budget.amount) - spent
      }
    })

    return NextResponse.json({
      success: true,
      testUser: { 
        id: testUser.id, 
        email: testUser.email,
        name: testUser.name 
      },
      dashboard: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        spentPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        budgetProgress,
        recentExpenses: recentExpenses.map(expense => ({
          id: expense.id,
          name: expense.name,
          amount: Number(expense.amount),
          description: expense.description,
          createdAt: expense.createdAt,
          budget: expense.budget
        })),
        summary: {
          budgetCount: budgets.length,
          expenseCount: expenses.length,
          averageExpense: expenses.length > 0 ? totalSpent / expenses.length : 0
        }
      }
    })
  } catch (error) {
    console.error('Test dashboard error:', error)
    return NextResponse.json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
