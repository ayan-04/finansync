"use client"

import { useEffect, useState, useCallback } from 'react'
import { BudgetCard } from './budget-card'
import { CreateBudgetModal } from './create-budget-modal'
import { CreateExpenseModal } from './create-expense-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Filter, BarChart3, RefreshCw } from 'lucide-react'

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  percentage: number
  remaining: number
  icon?: string
  color?: string
}

interface BudgetOverviewProps {
  onCreateBudget?: () => void
  onAddExpense?: (budgetId: string) => void
  onDataChange?: () => void // ✅ Added missing prop
}

export function BudgetOverview({ onCreateBudget, onAddExpense, onDataChange }: BudgetOverviewProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBudgetForExpense, setSelectedBudgetForExpense] = useState<string>('')

  // ✅ Single fetchBudgets function
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true)
      console.log('📡 Fetching budgets...')
      
      const response = await fetch('/api/budgets', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch budgets')
      }
      
      const apiData = await response.json()
      console.log('📊 Fresh data from API:', apiData.length, 'budgets')
      
      // Process the data to add calculated fields
      const processedBudgets: Budget[] = apiData.map((budget: any) => {
        const amount = Number(budget.amount) || 0
        const spent = Number(budget.spent) || 0
        const percentage = amount > 0 ? (spent / amount) * 100 : 0
        const remaining = amount - spent

        return {
          ...budget,
          amount,
          spent,
          percentage,
          remaining,
          color: budget.color || '#3b82f6',
          icon: budget.icon || '💰'
        }
      })
      
      setBudgets(processedBudgets)
      console.log('✅ UI updated with', processedBudgets.length, 'budgets')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Budget fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ Single useEffect for initial load
  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  // ✅ Force refresh function that updates state immediately
  const handleRefresh = useCallback(() => {
    console.log('🔄 Refreshing budgets...')
    console.log('📊 Current budgets before refresh:', budgets.length)
    fetchBudgets()
    onDataChange?.() // ✅ Notify parent of data change
  }, [fetchBudgets, onDataChange])

  // ✅ Optimistic delete - remove from UI immediately, then refresh
  const handleBudgetDeleted = useCallback((deletedBudgetId: string) => {
    console.log('🗑️ Budget deleted, updating UI:', deletedBudgetId)
    
    // Optimistically remove from UI
    setBudgets(currentBudgets => 
      currentBudgets.filter(budget => budget.id !== deletedBudgetId)
    )
    
    // Notify parent components of the change
    onDataChange?.()
    
    // Also refresh to ensure data consistency
    setTimeout(() => {
      fetchBudgets()
    }, 500)
  }, [fetchBudgets, onDataChange])

  // ✅ Error rollback function if delete fails
  const handleDeleteError = useCallback((budgetId: string, originalBudgets: Budget[]) => {
    console.log('❌ Delete failed, rolling back UI for budget:', budgetId)
    setBudgets(originalBudgets) // Rollback to original state
  }, [])

  const handleBudgetCreated = useCallback(() => {
    console.log('➕ Budget created, refreshing...')
    fetchBudgets().then(() => {
      onCreateBudget?.()
      onDataChange?.()
    })
  }, [fetchBudgets, onCreateBudget, onDataChange])

  const handleExpenseCreated = useCallback(() => {
    console.log('💰 Expense created, refreshing...')
    fetchBudgets().then(() => {
      setSelectedBudgetForExpense('')
      onDataChange?.()
    })
  }, [fetchBudgets, onDataChange])

  const handleAddExpenseClick = useCallback((budgetId: string) => {
    setSelectedBudgetForExpense(budgetId)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Budget Overview</h2>
            <p className="text-gray-600">Loading your budgets...</p>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">Error loading budgets: {error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Overview</h2>
          <p className="text-gray-600">
            {budgets.length} active budgets • {overallPercentage.toFixed(1)}% of total budget used
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <CreateBudgetModal onBudgetCreated={handleBudgetCreated} />
        </div>
      </div>

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">No Budgets Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first budget to start tracking your spending
            </p>
            <CreateBudgetModal onBudgetCreated={handleBudgetCreated} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              id={budget.id}
              name={budget.name}
              amount={budget.amount}
              spent={budget.spent}
              remaining={budget.remaining}
              percentage={budget.percentage}
              icon={budget.icon}
              color={budget.color}
              isOverBudget={budget.spent > budget.amount}
              onAddExpense={handleAddExpenseClick}
              onRefresh={handleRefresh}
              onBudgetDeleted={handleBudgetDeleted} // ✅ FIXED: Now passing the delete handler
              onDeleteError={handleDeleteError} // ✅ NEW: Error handling for failed deletes
            />
          ))}
        </div>
      )}

      {/* Expense Modal */}
      {selectedBudgetForExpense && (
        <CreateExpenseModal
          budgetId={selectedBudgetForExpense}
          onExpenseCreated={handleExpenseCreated}
        />
      )}
    </div>
  )
}
