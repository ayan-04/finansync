"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react'

export interface BudgetData {
  id: string
  name: string
  amount: number
  spent: number
  percentage: number
  remaining: number
  color?: string
  icon?: string
}

interface ExpenseData {
  id: string
  name: string
  amount: number
  createdAt: string
  budget: {
    name: string
    color?: string
    icon?: string
  }
}

interface BudgetChartsProps {
  budgets: BudgetData[]
}

export function BudgetCharts({ budgets }: BudgetChartsProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading] = useState(false)

  // Process data when budgets or chart type changes
  useEffect(() => {
    processChartData(budgets)
    // eslint-disable-next-line
  }, [budgets, chartType])

  const processChartData = (budgetData: BudgetData[]) => {
    switch (chartType) {
      case 'bar':
        setFilteredData(budgetData.map(budget => ({
          name: budget.name,
          budgeted: budget.amount,
          spent: budget.spent,
          remaining: Math.max(0, budget.amount - budget.spent),
          fill: budget.color || '#3b82f6'
        })))
        break
      case 'pie':
        setFilteredData(budgetData
          .filter(budget => budget.spent > 0)
          .map(budget => ({
            name: budget.name,
            value: budget.spent,
            fill: budget.color || '#3b82f6'
          })))
        break
      case 'line':
        setFilteredData(generateSampleTrend(budgetData))
        break
    }
  }

  const generateSampleTrend = (budgetData: BudgetData[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
    const totalSpent = budgetData.reduce((sum, budget) => sum + budget.spent, 0)
    return months.map((month, index) => ({
      month,
      amount: totalSpent * (0.7 + Math.random() * 0.6) // Simulate variation
    }))
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => {
            const value = Number(entry.value) || 0
            return (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: ${value.toFixed(2)}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading chart data...</span>
        </div>
      )
    }
    if (filteredData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No data available
        </div>
      )
    }
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="budgeted" name="Budgeted" fill="#e5e7eb" />
              <Bar dataKey="spent" name="Spent" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
             label={({ name, value }) => {
  const numValue = Number(value)
  return `${name}: $${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`
}}

                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Spending"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Spending Analytics
            </CardTitle>
            <p className="text-sm text-gray-600">
              Visual breakdown of your budget usage
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  )
}
