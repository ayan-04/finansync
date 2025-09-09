"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { Download, Calendar, TrendingUp, TrendingDown, AlertTriangle, FileText, Printer } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
import { useReactToPrint } from 'react-to-print'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658']

// Type definitions
interface MonthlyReport {
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
    expensesTrend: number
    savingsTrend: number
  }
}

interface YearlyReport {
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

interface ReportsDashboardProps {
  refreshKey?: number
}

export function ReportsDashboard({ refreshKey }: ReportsDashboardProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState('monthly')
  const [exportLoading, setExportLoading] = useState(false)

  // Fetch monthly report
  const fetchMonthlyReport = async (month?: string) => {
    try {
      const targetMonth = month || selectedMonth
      const response = await fetch(`/api/reports/monthly?month=${targetMonth}`)
      if (response.ok) {
        const data = await response.json()
        setMonthlyReport(data)
        console.log('📊 Monthly report loaded')
      }
    } catch (error) {
      console.error('Error fetching monthly report:', error)
    }
  }

  // Fetch yearly report
  const fetchYearlyReport = async (year?: number) => {
    try {
      const targetYear = year || selectedYear
      const response = await fetch(`/api/reports/yearly?year=${targetYear}`)
      if (response.ok) {
        const data = await response.json()
        setYearlyReport(data)
        console.log('📊 Yearly report loaded')
      }
    } catch (error) {
      console.error('Error fetching yearly report:', error)
    }
  }

  // Load reports on mount and when refreshKey changes
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      await Promise.all([
        fetchMonthlyReport(),
        fetchYearlyReport()
      ])
      setLoading(false)
    }
    
    loadReports()
  }, [refreshKey, selectedMonth, selectedYear])

  // ✅ Client-side PDF export using html2canvas + jsPDF
  const exportToPDF = async () => {
    if (!reportRef.current) return
    
    try {
      setExportLoading(true)
      console.log('📄 Generating PDF...')
      
      // Create canvas from HTML
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: reportRef.current.scrollHeight,
        width: reportRef.current.scrollWidth
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      // Handle multi-page PDFs
      let heightLeft = pdfHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }
      
      const fileName = `finansync-report-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      console.log('✅ PDF exported successfully')
    } catch (error) {
      console.error('❌ PDF export failed:', error)
    } finally {
      setExportLoading(false)
    }
  }

  // ✅ Fixed print functionality
const handlePrint = useReactToPrint({
  contentRef: reportRef,
  documentTitle: `FinanSync ${activeTab} Report - ${new Date().toLocaleDateString()}`,
  onBeforePrint: async () => {
    console.log('📄 Preparing content for print...')
  },
  onAfterPrint: () => {
    console.log('✅ Print dialog closed')
  }
})



  // ✅ Server-side PDF generation
  const exportServerPDF = async () => {
    try {
      setExportLoading(true)
      console.log('📄 Generating server-side PDF...')
      
      const response = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: activeTab,
          month: selectedMonth,
          year: selectedYear
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `finansync-${activeTab}-report-${activeTab === 'monthly' ? selectedMonth : selectedYear}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        console.log('✅ Server PDF exported successfully')
      } else {
        throw new Error('Failed to generate PDF')
      }
    } catch (error) {
      console.error('❌ Server PDF export failed:', error)
      // Fallback to client-side export
      await exportToPDF()
    } finally {
      setExportLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Financial Reports</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with working export buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
          <p className="text-gray-600">Comprehensive analysis of your spending patterns</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date/Year Selector */}
          <div className="flex items-center gap-2 mr-4">
            {activeTab === 'monthly' ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>

          {/* ✅ Working PDF Export Buttons */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToPDF}
            disabled={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Generating...' : 'Export PDF'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportServerPDF}
            disabled={exportLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Server PDF
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* ✅ Report content wrapped in ref for PDF export */}
      <div ref={reportRef} className="bg-white p-6 rounded-lg shadow-sm">
        {/* Report Header for PDF */}
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">FinanSync Financial Report</h1>
          <p className="text-lg text-gray-600 mt-2">
            {activeTab === 'monthly' && monthlyReport ? monthlyReport.period : `Year ${selectedYear}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 no-print">
            <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
            <TabsTrigger value="yearly">Yearly Report</TabsTrigger>
          </TabsList>

          {/* Monthly Report Tab */}
          <TabsContent value="monthly" className="space-y-6">
            {monthlyReport && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                          <div className="flex items-center mt-1">
                            <p className="text-2xl font-bold text-red-600">
                              {formatCurrency(monthlyReport.totalExpenses)}
                            </p>
                            {monthlyReport.trends.expensesTrend !== 0 && (
                              <div className={`flex items-center ml-2 ${
                                monthlyReport.trends.expensesTrend > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {monthlyReport.trends.expensesTrend > 0 ? 
                                  <TrendingUp className="h-4 w-4" /> : 
                                  <TrendingDown className="h-4 w-4" />
                                }
                                <span className="text-sm ml-1">
                                  {formatPercentage(Math.abs(monthlyReport.trends.expensesTrend))}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Net Savings</p>
                          <p className={`text-2xl font-bold mt-1 ${
                            monthlyReport.netSavings >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(monthlyReport.netSavings)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Budget Alerts</p>
                        <div className="flex items-center mt-1">
                          <p className="text-2xl font-bold text-orange-600">
                            {monthlyReport.budgetPerformance.filter(b => b.status === 'over').length}
                          </p>
                          <AlertTriangle className="h-5 w-5 text-orange-600 ml-2" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Over budget categories</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Top Category</p>
                        <p className="text-lg font-bold mt-1 text-blue-600">
                          {monthlyReport.topCategories[0]?.category || 'None'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(monthlyReport.topCategories[0]?.amount || 0)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Categories Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={monthlyReport.topCategories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {monthlyReport.topCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Budget Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Budget Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={monthlyReport.budgetPerformance} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                          <Legend />
                          <Bar dataKey="budgetAmount" fill="#e2e8f0" name="Budget" />
                          <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Budget Performance Table */}
                <Card className="print-break">
                  <CardHeader>
                    <CardTitle>Detailed Budget Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Budget Category</th>
                            <th className="text-right py-2">Budget Amount</th>
                            <th className="text-right py-2">Spent</th>
                            <th className="text-right py-2">Remaining</th>
                            <th className="text-center py-2">Progress</th>
                            <th className="text-center py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyReport.budgetPerformance.map((budget, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 font-medium">{budget.name}</td>
                              <td className="text-right py-2">{formatCurrency(budget.budgetAmount)}</td>
                              <td className="text-right py-2">{formatCurrency(budget.spent)}</td>
                              <td className="text-right py-2">
                                {formatCurrency(budget.budgetAmount - budget.spent)}
                              </td>
                              <td className="text-center py-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      budget.percentage > 100 ? 'bg-red-500' : 
                                      budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs mt-1">{budget.percentage.toFixed(1)}%</span>
                              </td>
                              <td className="text-center py-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  budget.status === 'over' ? 'bg-red-100 text-red-800' :
                                  budget.status === 'on-track' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {budget.status === 'over' ? 'Over Budget' :
                                   budget.status === 'on-track' ? 'On Track' : 'Under Budget'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Yearly Report Tab */}
          <TabsContent value="yearly" className="space-y-6">
            {yearlyReport && (
              <>
                {/* Yearly Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Annual Expenses</p>
                        <p className="text-3xl font-bold text-red-600 mt-1">
                          {formatCurrency(yearlyReport.totalExpenses)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Monthly</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">
                          {formatCurrency(yearlyReport.totalExpenses / 12)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Budget Utilization</p>
                        <p className="text-3xl font-bold text-purple-600 mt-1">
                          {yearlyReport.budgetAnalysis.averageUtilization.toFixed(1)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Spending Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={yearlyReport.monthlyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          name="Expenses" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="print-break">
                  <CardHeader>
                    <CardTitle>Annual Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={yearlyReport.categoryTotals} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                        <Bar dataKey="amount" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Budget Analysis Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Annual Budget Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Average Utilization</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {yearlyReport.budgetAnalysis.averageUtilization.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Most Overspent</p>
                        <p className="text-lg font-semibold text-red-600">
                          {yearlyReport.budgetAnalysis.mostOverspent}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Most Underspent</p>
                        <p className="text-lg font-semibold text-green-600">
                          {yearlyReport.budgetAnalysis.mostUnderspent}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
