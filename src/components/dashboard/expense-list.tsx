"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, Filter, Calendar, Plus, Edit, Trash2, 
  MoreVertical, CalendarDays, DollarSign 
} from 'lucide-react'

interface Expense {
  id: string
  name: string
  amount: number
  description?: string
  createdAt: string
  budget: {
    id: string
    name: string
    icon?: string
    color?: string
  }
}

interface Budget {
  id: string
  name: string
  icon?: string
  color?: string
}

interface ExpenseListProps {
  onAddExpense?: () => void
  onEditExpense?: (expenseId: string) => void
  onDeleteExpense?: (expenseId: string) => void
  onExpenseUpdated?: () => void
}

export function ExpenseList({ 
  onAddExpense, 
  onEditExpense, 
  onDeleteExpense,
  onExpenseUpdated 
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBudget, setSelectedBudget] = useState<string>('all') // ✅ Changed from '' to 'all'
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    budgetId: '',
    description: ''
  })

  // Fetch expenses with real-time updates
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/expenses')
      
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
        console.log('📊 Loaded', data.length, 'expenses')
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch budgets for dropdowns
  const fetchBudgets = useCallback(async () => {
    try {
      const response = await fetch('/api/budgets')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
    fetchBudgets()
  }, [fetchExpenses, fetchBudgets])

  // ✅ Updated filtering logic to handle 'all' value
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBudget = selectedBudget === 'all' || expense.budget.id === selectedBudget // ✅ Fixed logic
    
    return matchesSearch && matchesBudget
  })

  // Create new expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.amount || !formData.budgetId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          amount: parseFloat(formData.amount),
          budgetId: formData.budgetId,
          description: formData.description
        })
      })

      if (response.ok) {
        setIsAddModalOpen(false)
        setFormData({ name: '', amount: '', budgetId: '', description: '' })
        fetchExpenses()
        onExpenseUpdated?.()
        alert('Expense created successfully!')
      }
    } catch (error) {
      alert('Error creating expense')
    }
  }

  // Update existing expense
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingExpense || !formData.name || !formData.amount || !formData.budgetId) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          amount: parseFloat(formData.amount),
          budgetId: formData.budgetId,
          description: formData.description
        })
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setEditingExpense(null)
        fetchExpenses()
        onExpenseUpdated?.()
        alert('Expense updated successfully!')
      }
    } catch (error) {
      alert('Error updating expense')
    }
  }

  // Delete expense with confirmation
  const handleDeleteExpense = async (expense: Expense) => {
    if (!window.confirm(`Are you sure you want to delete "${expense.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchExpenses()
        onExpenseUpdated?.()
        alert('Expense deleted successfully!')
      } else if (response.status === 404) {
        fetchExpenses()
        alert('Expense was already deleted')
      }
    } catch (error) {
      alert('Error deleting expense')
    }
  }

  // Start editing an expense
  const startEditing = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      budgetId: expense.budget.id,
      description: expense.description || ''
    })
    setIsEditModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading expenses...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
            <p className="text-sm text-gray-600">
              {filteredExpenses.length} transactions
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <CalendarDays className="h-4 w-4 mr-2" />
              Date Range
            </Button>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* ✅ FIXED SELECT COMPONENT */}
          <Select value={selectedBudget} onValueChange={setSelectedBudget}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem> {/* ✅ Changed from "" to "all" */}
              {budgets.map(budget => (
                <SelectItem key={budget.id} value={budget.id}>
                  <div className="flex items-center gap-2">
                    <span>{budget.icon}</span>
                    <span>{budget.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Expense List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💸</div>
            <h3 className="text-lg font-semibold mb-2">No Expenses Yet</h3>
            <p className="text-gray-600 mb-4">
              {expenses.length === 0 
                ? "Start tracking your spending by adding your first expense"
                : "No expenses match your current filters"
              }
            </p>
            {expenses.length === 0 && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div 
                key={expense.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: expense.budget.color + '20', color: expense.budget.color }}
                  >
                    {expense.budget.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{expense.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="secondary">{expense.budget.name}</Badge>
                      <span>•</span>
                      <span>{formatDate(expense.createdAt)}</span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(expense.amount)}</div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => startEditing(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600"
                      onClick={() => handleDeleteExpense(expense)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Expense Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <Label htmlFor="name">Expense Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter expense name"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget Category</Label>
              {/* ✅ FIXED SELECT IN MODAL - No empty string values */}
              <Select 
                value={formData.budgetId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, budgetId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map(budget => (
                    <SelectItem key={budget.id} value={budget.id}>
                      <div className="flex items-center gap-2">
                        <span>{budget.icon}</span>
                        <span>{budget.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Expense</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateExpense} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Expense Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter expense name"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-budget">Budget Category</Label>
              <Select 
                value={formData.budgetId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, budgetId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map(budget => (
                    <SelectItem key={budget.id} value={budget.id}>
                      <div className="flex items-center gap-2">
                        <span>{budget.icon}</span>
                        <span>{budget.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Expense</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
