"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { BudgetOverview } from '@/components/dashboard/budget-overview'
import { ExpenseList } from '@/components/dashboard/expense-list'
import { BudgetCharts } from '@/components/dashboard/budget-charts'
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard'
import { AIInsights } from '@/components/dashboard/ai-insights'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportsDashboard } from '@/components/dashboard/reports-dashboard'


export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [budgets, setBudgets] = useState([])
  const [activeTab, setActiveTab] = useState('overview') // ✅ Track active tab
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchBudgets()
    }
  }, [status, router])

  // ✅ Refresh data when switching to overview tab
  useEffect(() => {
    if (activeTab === 'overview' && session) {
      console.log('🔄 Refreshing overview tab data')
      handleGlobalDataChange()
    }
  }, [activeTab, session])

  // ✅ Auto-refresh data every 30 seconds when on overview
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (activeTab === 'overview' && session) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing dashboard data')
        fetchBudgets()
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTab, session])

  const fetchBudgets = useCallback(async () => {
    try {
      console.log('📊 Fetching latest budget data')
      const response = await fetch('/api/budgets')
      if (response.ok) {
        const data = await response.json()
        const processedBudgets = data.map((budget: any) => ({
          ...budget,
          amount: Number(budget.amount),
          spent: Number(budget.spent || 0),
          percentage: budget.amount > 0 ? (Number(budget.spent || 0) / Number(budget.amount)) * 100 : 0,
          remaining: Number(budget.amount) - Number(budget.spent || 0),
          color: budget.color || '#3b82f6',
          icon: budget.icon || '💰'
        }))
        setBudgets(processedBudgets)
        console.log('✅ Budget data updated:', processedBudgets.length, 'budgets')
      }
    } catch (error) {
      console.error('❌ Error fetching budgets:', error)
    }
  }, [])

  const handleGlobalDataChange = useCallback(() => {
    console.log('🔄 Global data change - refreshing all components')
    setRefreshKey(prev => prev + 1)
    fetchBudgets()
  }, [fetchBudgets])

  // ✅ Handle tab changes
  const handleTabChange = (value: string) => {
    console.log('📑 Switching to tab:', value)
    setActiveTab(value)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FinanSync Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.user?.name || session.user?.email}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium">Just now</p>
              </div>
              {/* ✅ Manual refresh button */}
              <button 
                onClick={handleGlobalDataChange}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <BudgetOverview 
              onCreateBudget={handleGlobalDataChange}
              onAddExpense={handleGlobalDataChange}
              onDataChange={handleGlobalDataChange}
              key={`budget-overview-${refreshKey}`} // ✅ Force re-render on refresh
            />
            <BudgetCharts 
              budgets={budgets}
              key={`budget-charts-${refreshKey}`} // ✅ Force re-render on refresh
            />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsDashboard refreshKey={refreshKey} />
          </TabsContent>
          
          <TabsContent value="ai">
            <AIInsights refreshKey={refreshKey} />
          </TabsContent>
          
          <TabsContent value="expenses">
            <ExpenseList
              onExpenseUpdated={handleGlobalDataChange} // ✅ Notify when expense changes
              key={`expense-list-${refreshKey}`}
            />
          </TabsContent>
          
         <TabsContent value="reports">
  <ReportsDashboard refreshKey={refreshKey} />
</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
