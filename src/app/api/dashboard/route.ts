import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis, CACHE_KEYS } from '@/lib/redis'
import { withAuth, handleApiError } from '@/lib/api-helpers'

export const GET = withAuth(async (userId: string, request: NextRequest) => {
  try {
    // Check cache first
    const cacheKey = CACHE_KEYS.dashboard(userId)
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      console.log(`🟢 Dashboard cache HIT for user ${userId}`)
      return NextResponse.json(JSON.parse(cached))
    }
    
    console.log(`🔴 Dashboard cache MISS for user ${userId} - querying DB`)
    
    // Fetch all data in parallel for performance
    const [budgets, expenses, recentExpenses] = await Promise.all([
      // Budgets with expense aggregation
      prisma.budget.findMany({
        where: { userId },
        include: {
          expenses: {
            select: { amount: true }
          }
        }
      }),
      
      // Total expenses for current month
      prisma.expense.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        select: { amount: true }
      }),
      
      // Recent expenses for activity feed
      prisma.expense.findMany({
        where: { userId },
        include: {
          budget: {
            select: { name: true, icon: true, color: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])
    
    // Calculate dashboard metrics
    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0)
    const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    
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
    
    const dashboardData = {
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
    
    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(dashboardData))
    
    return NextResponse.json(dashboardData)
  } catch (error) {
    return handleApiError(error)
  }
})
