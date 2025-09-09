import { prisma } from '@/lib/prisma'
import { CacheHelpers } from '@/lib/redis'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths, subYears } from 'date-fns'

export interface MonthlyReport {
  period: string
  totalIncome: number
  totalExpenses: number
  netSavings: number
  topCategories: Array<{
    category: string
    amount: number
    percentage: number
    budgetId: string
  }>
  budgetPerformance: Array<{
    name: string
    budgetAmount: number
    spent: number
    percentage: number
    status: 'under' | 'over' | 'on-track'
  }>
  trends: {
    expensesTrend: number // % change from last month
    savingsTrend: number
  }
}

export interface YearlyReport {
  year: number
  totalIncome: number
  totalExpenses: number
  netSavings: number
  monthlyBreakdown: Array<{
    month: string
    expenses: number
    income: number
    savings: number
  }>
  categoryTotals: Array<{
    category: string
    amount: number
    percentage: number
  }>
  budgetAnalysis: {
    averageUtilization: number
    mostOverspent: string
    mostUnderspent: string
  }
}

export class ReportsService {
  
  // ✅ Generate Monthly Report with Redis Caching
  static async generateMonthlyReport(userId: string, date?: Date): Promise<MonthlyReport> {
    const reportDate = date || new Date()
    const monthKey = format(reportDate, 'yyyy-MM')
    const cacheKey = CacheHelpers.userKey(userId, 'monthly-report', monthKey)
    
    // Try cache first (cache for 1 hour)
    const cached = await CacheHelpers.get(cacheKey)
    if (cached) {
      console.log('📊 Retrieved monthly report from cache')
      return cached
    }

    console.log('📊 Generating fresh monthly report')
    
    const startDate = startOfMonth(reportDate)
    const endDate = endOfMonth(reportDate)
    
    // Get all expenses for the month
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        budget: {
          select: { name: true, amount: true, id: true }
        }
      }
    })

    // Get budgets for performance analysis
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: {
        expenses: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    // Get previous month data for trends
    const prevMonthStart = startOfMonth(subMonths(reportDate, 1))
    const prevMonthEnd = endOfMonth(subMonths(reportDate, 1))
    
    const prevExpenses = await prisma.expense.findMany({
      where: {
        userId,
        createdAt: {
          gte: prevMonthStart,
          lte: prevMonthEnd
        }
      }
    })

    // Calculate metrics
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const prevTotalExpenses = prevExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    
    // For now, assume income tracking will be added later
    const totalIncome = 0 // TODO: Add income tracking
    const netSavings = totalIncome - totalExpenses
    const prevNetSavings = 0 - prevTotalExpenses

    // Top categories analysis
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.budget.name
      acc[category] = (acc[category] || 0) + Number(expense.amount)
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        budgetId: expenses.find(e => e.budget.name === category)?.budgetId || ''
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Budget performance analysis
    const budgetPerformance = budgets.map(budget => {
      const spent = budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
      const budgetAmount = Number(budget.amount)
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      
      let status: 'under' | 'over' | 'on-track' = 'on-track'
      if (percentage > 100) status = 'over'
      else if (percentage < 80) status = 'under'
      
      return {
        name: budget.name,
        budgetAmount,
        spent,
        percentage,
        status
      }
    })

    // Calculate trends
    const expensesTrend = prevTotalExpenses > 0 
      ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 
      : 0
    const savingsTrend = prevNetSavings !== 0 
      ? ((netSavings - prevNetSavings) / Math.abs(prevNetSavings)) * 100 
      : 0

    const report: MonthlyReport = {
      period: format(reportDate, 'MMMM yyyy'),
      totalIncome,
      totalExpenses,
      netSavings,
      topCategories,
      budgetPerformance,
      trends: {
        expensesTrend,
        savingsTrend
      }
    }

    // Cache the report for 1 hour
    await CacheHelpers.setWithExpiry(cacheKey, report, 3600)
    console.log('✅ Monthly report cached successfully')

    return report
  }

  // ✅ Generate Yearly Report with Redis Caching
  static async generateYearlyReport(userId: string, year?: number): Promise<YearlyReport> {
    const reportYear = year || new Date().getFullYear()
    const cacheKey = CacheHelpers.userKey(userId, 'yearly-report', reportYear.toString())
    
    // Try cache first (cache for 6 hours)
    const cached = await CacheHelpers.get(cacheKey)
    if (cached) {
      console.log('📊 Retrieved yearly report from cache')
      return cached
    }

    console.log('📊 Generating fresh yearly report')
    
    const startDate = startOfYear(new Date(reportYear, 0, 1))
    const endDate = endOfYear(new Date(reportYear, 0, 1))

    // Get all expenses for the year
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        budget: {
          select: { name: true, amount: true }
        }
      }
    })

    // Get budgets for analysis
    const budgets = await prisma.budget.findMany({
      where: { userId }
    })

    const totalIncome = 0 // TODO: Add income tracking
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const netSavings = totalIncome - totalExpenses

    // Monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(reportYear, i, 1)
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthExpenses = expenses.filter(expense => 
        expense.createdAt >= monthStart && expense.createdAt <= monthEnd
      )
      
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
      
      return {
        month: format(month, 'MMM'),
        expenses: monthTotal,
        income: 0, // TODO: Add income tracking
        savings: 0 - monthTotal
      }
    })

    // Category totals
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.budget.name
      acc[category] = (acc[category] || 0) + Number(expense.amount)
      return acc
    }, {} as Record<string, number>)

    const categoryTotalsArray = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount)

    // Budget analysis
    const budgetUtilizations = budgets.map(budget => {
      const budgetExpenses = expenses.filter(e => e.budgetId === budget.id)
      const spent = budgetExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
      const budgetAmount = Number(budget.amount) * 12 // Yearly budget
      return {
        name: budget.name,
        utilization: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      }
    })

    const averageUtilization = budgetUtilizations.reduce((sum, b) => sum + b.utilization, 0) / budgetUtilizations.length
    const mostOverspent = budgetUtilizations.filter(b => b.utilization > 100).sort((a, b) => b.utilization - a.utilization)[0]?.name || 'None'
    const mostUnderspent = budgetUtilizations.filter(b => b.utilization < 50).sort((a, b) => a.utilization - b.utilization)[0]?.name || 'None'

    const report: YearlyReport = {
      year: reportYear,
      totalIncome,
      totalExpenses,
      netSavings,
      monthlyBreakdown,
      categoryTotals: categoryTotalsArray,
      budgetAnalysis: {
        averageUtilization,
        mostOverspent,
        mostUnderspent
      }
    }

    // Cache for 6 hours
    await CacheHelpers.setWithExpiry(cacheKey, report, 21600)
    console.log('✅ Yearly report cached successfully')

    return report
  }

  // ✅ Clear user's report cache (call when data changes)
  static async clearUserReportsCache(userId: string) {
    const patterns = [
      CacheHelpers.userKey(userId, 'monthly-report', '*'),
      CacheHelpers.userKey(userId, 'yearly-report', '*'),
      CacheHelpers.userKey(userId, 'ai-insights', '*')
    ]
    
    // In production, you'd use Redis SCAN for better performance
    // For now, we'll clear specific known keys
    const currentMonth = format(new Date(), 'yyyy-MM')
    const currentYear = new Date().getFullYear().toString()
    
    await Promise.all([
      CacheHelpers.delete(CacheHelpers.userKey(userId, 'monthly-report', currentMonth)),
      CacheHelpers.delete(CacheHelpers.userKey(userId, 'yearly-report', currentYear))
    ])
    
    console.log('🗑️ Cleared user reports cache')
  }
}
