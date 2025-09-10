import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12')
    const startDate = subMonths(new Date(), months)

    // Get monthly spending trends
    const monthlySpending = await getMonthlySpending(user.id, startDate)
    
    // Get category breakdown
    const categoryBreakdown = await getCategoryBreakdown(user.id, startDate)
    
    // Get budget vs actual comparison
    const budgetComparison = await getBudgetComparison(user.id)
    
    // Get daily spending for current month
    const dailySpending = await getDailySpending(user.id)
    
    // Calculate financial metrics
    const metrics = await getFinancialMetrics(user.id, startDate)

    return NextResponse.json({
      monthlySpending,
      categoryBreakdown,
      budgetComparison,
      dailySpending,
      metrics
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getMonthlySpending(userId: string, startDate: Date) {
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      createdAt: { gte: startDate }
    },
    include: {
      budget: {
        select: { name: true, color: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const monthlyData = expenses.reduce((acc, expense) => {
    const month = format(expense.createdAt, 'MMM yyyy')
    if (!acc[month]) {
      acc[month] = 0
    }
    acc[month] += Number(expense.amount) // Convert Prisma Decimal to number
    return acc
  }, {} as Record<string, number>)

  return Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount: Number(amount.toFixed(2)),
    expenses: expenses.filter(e => format(e.createdAt, 'MMM yyyy') === month).length
  }))
}

async function getCategoryBreakdown(userId: string, startDate: Date) {
  const result = await prisma.expense.groupBy({
    by: ['budgetId'],
    where: {
      userId,
      createdAt: { gte: startDate }
    },
    _sum: {
      amount: true
    },
    _count: {
      id: true
    }
  })

  const budgets = await prisma.budget.findMany({
    where: {
      id: { in: result.map(r => r.budgetId) }
    },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true
    }
  })

  return result.map(item => {
    const budget = budgets.find(b => b.id === item.budgetId)
    const amount = Number(item._sum.amount || 0) // Prisma Decimal to number
    return {
      category: budget?.name || 'Unknown',
      amount: Number(amount.toFixed(2)),
      count: item._count.id,
      color: budget?.color || '#8884d8',
      icon: budget?.icon || '💰'
    }
  }).filter(item => item.amount > 0)
}

async function getBudgetComparison(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: {
      expenses: {
        select: { amount: true }
      }
    }
  })

  return budgets.map(budget => {
    const budgetAmount = Number(budget.amount)
    const spent = budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const remaining = budgetAmount - spent
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

    return {
      category: budget.name,
      budgeted: Number(budgetAmount.toFixed(2)),
      spent: Number(spent.toFixed(2)),
      remaining: Number(remaining.toFixed(2)),
      percentage: Number(percentage.toFixed(1)),
      status: spent > budgetAmount ? 'over' : spent > budgetAmount * 0.8 ? 'warning' : 'good',
      color: budget.color || '#8884d8',
      icon: budget.icon || '💰'
    }
  })
}

async function getDailySpending(userId: string) {
  const startOfCurrentMonth = startOfMonth(new Date())
  const endOfCurrentMonth = endOfMonth(new Date())

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfCurrentMonth,
        lte: endOfCurrentMonth
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const dailyData = expenses.reduce((acc, expense) => {
    const day = format(expense.createdAt, 'MMM dd')
    if (!acc[day]) {
      acc[day] = 0
    }
    acc[day] += Number(expense.amount) // Prisma Decimal to number
    return acc
  }, {} as Record<string, number>)

  return Object.entries(dailyData).map(([day, amount]) => ({
    day,
    amount: Number(amount.toFixed(2))
  }))
}

async function getFinancialMetrics(userId: string, startDate: Date) {
  const totalExpenses = await prisma.expense.aggregate({
    where: {
      userId,
      createdAt: { gte: startDate }
    },
    _sum: { amount: true },
    _count: { id: true }
  })

  const totalBudgets = await prisma.budget.aggregate({
    where: { userId },
    _sum: { amount: true },
    _count: { id: true }
  })

  const currentMonthExpenses = await prisma.expense.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfMonth(new Date()) }
    },
    _sum: { amount: true }
  })

  const lastMonthExpenses = await prisma.expense.aggregate({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth(subMonths(new Date(), 1)),
        lt: startOfMonth(new Date())
      }
    },
    _sum: { amount: true }
  })

  // Prisma Decimal to numbers
  const totalSpentDecimal = totalExpenses._sum.amount || 0
  const totalBudgetDecimal = totalBudgets._sum.amount || 0
  const currentMonthDecimal = currentMonthExpenses._sum.amount || 0
  const lastMonthDecimal = lastMonthExpenses._sum.amount || 0

  const totalSpent = Number(totalSpentDecimal)
  const totalBudget = Number(totalBudgetDecimal)
  const currentMonth = Number(currentMonthDecimal)
  const lastMonth = Number(lastMonthDecimal)
  
  const monthlyChange = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0

  return {
    totalSpent: Number(totalSpent.toFixed(2)),
    totalBudget: Number(totalBudget.toFixed(2)),
    totalTransactions: totalExpenses._count.id,
    averageTransaction:
      totalExpenses._count.id > 0 ?
        Number((totalSpent / totalExpenses._count.id).toFixed(2)) : 0,
    currentMonthSpending: Number(currentMonth.toFixed(2)),
    lastMonthSpending: Number(lastMonth.toFixed(2)),
    monthlyChangePercentage: Number(monthlyChange.toFixed(1)),
    budgetUtilization: totalBudget > 0 ?
      Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0
  }
}
