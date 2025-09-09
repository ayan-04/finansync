"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

interface Budget {
  id: string
  name: string
  icon?: string
  color?: string
}

interface CreateExpenseModalProps {
  budgetId?: string
  onExpenseCreated?: () => void
}

export function CreateExpenseModal({ budgetId, onExpenseCreated }: CreateExpenseModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    budgetId: budgetId || '',
    description: ''
  })

  useEffect(() => {
    if (budgetId) {
      setFormData(prev => ({ ...prev, budgetId }))
    }
  }, [budgetId])

  useEffect(() => {
    if (open) {
      fetchBudgets()
    }
  }, [open])

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.amount || !formData.budgetId) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          amount: parseFloat(formData.amount),
          budgetId: formData.budgetId,
          description: formData.description || undefined
        })
      })

      if (response.ok) {
        setOpen(false)
        setFormData({ name: '', amount: '', budgetId: budgetId || '', description: '' })
        onExpenseCreated?.()
        alert('Expense added successfully!')
      } else {
        throw new Error('Failed to create expense')
      }
    } catch (error) {
      alert('Error creating expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="expense-name">Expense Name</Label>
            <Input
              id="expense-name"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
