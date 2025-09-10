"use client"

import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/nextjs'
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
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [budgets, setBudgets] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/auth/signin')
    } else if (isLoaded && user) {
      fetchBudgets()
    }
    // eslint-disable-next-line
  }, [isLoaded, user, router])

  useEffect(() => {
    if (activeTab === 'overview' && user) {
      handleGlobalDataChange()
    }
    // eslint-disable-next-line
  }, [activeTab, user])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (activeTab === 'overview' && user) {
      interval = setInterval(() => {
        fetchBudgets()
      }, 30000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line
  }, [activeTab, user])

  const fetchBudgets = useCallback(async () => {
    try {
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
      }
    } catch (error) {
      console.error('❌ Error fetching budgets:', error)
    }
  }, [])

  const handleGlobalDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    fetchBudgets()
  }, [fetchBudgets])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Loader for delayed Clerk user
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">FinanSync Dashboard</h1>
                  <p className="text-gray-600">
                    Welcome back, {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'user'}!
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last updated</p>
                    <p className="text-sm font-medium">Just now</p>
                  </div>
                  {/* Manual refresh button */}
                  <button 
                    onClick={handleGlobalDataChange}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'U').toUpperCase()}
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
                  key={`budget-overview-${refreshKey}`}
                />
                <BudgetCharts 
                  budgets={budgets}
                  key={`budget-charts-${refreshKey}`}
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
                  onExpenseUpdated={handleGlobalDataChange}
                  key={`expense-list-${refreshKey}`}
                />
              </TabsContent>
              
              <TabsContent value="reports">
                <ReportsDashboard refreshKey={refreshKey} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
