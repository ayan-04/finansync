export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  percentage: number
  remaining: number
  icon?: string
  color?: string
  createdAt: Date
}

export interface Expense {
  id: string
  name: string
  amount: number
  description?: string
  createdAt: Date
  budget: {
    name: string
    icon?: string
    color?: string
  }
}

export interface DashboardData {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  spentPercentage: number
  budgetProgress: Budget[]
  recentExpenses: Expense[]
  summary: {
    budgetCount: number
    expenseCount: number
    averageExpense: number
  }
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success?: boolean
}
