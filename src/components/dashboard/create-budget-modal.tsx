"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

const budgetCategories = [
  { name: 'Food & Dining', icon: '🍕', color: '#ef4444' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { name: 'Shopping', icon: '🛍️', color: '#f59e0b' },
  { name: 'Healthcare', icon: '🏥', color: '#10b981' },
  { name: 'Education', icon: '📚', color: '#6366f1' },
  { name: 'Travel', icon: '✈️', color: '#ec4899' },
  { name: 'Other', icon: '💰', color: '#6b7280' }
]

interface CreateBudgetModalProps {
  onBudgetCreated?: () => void
}

export function CreateBudgetModal({ onBudgetCreated }: CreateBudgetModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    icon: '💰',
    color: '#3b82f6'
  })

  const handleCategorySelect = (categoryName: string) => {
    const category = budgetCategories.find(cat => cat.name === categoryName)
    if (category) {
      setFormData(prev => ({
        ...prev,
        name: category.name,
        icon: category.icon,
        color: category.color
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.amount) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          amount: parseFloat(formData.amount),
          icon: formData.icon,
          color: formData.color
        })
      })

      if (response.ok) {
        setOpen(false)
        setFormData({ name: '', amount: '', icon: '💰', color: '#3b82f6' })
        onBudgetCreated?.()
        alert('Budget created successfully!')
      } else {
        throw new Error('Failed to create budget')
      }
    } catch (error) {
      alert('Error creating budget. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Budget Category</Label>
            <Select onValueChange={handleCategorySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {budgetCategories.map(category => (
                  <SelectItem key={category.name} value={category.name}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter budget name"
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Budget Amount</Label>
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

          <div className="flex items-center gap-4">
            <div>
              <Label>Icon</Label>
              <div className="text-2xl mt-1">{formData.icon}</div>
            </div>
            <div>
              <Label>Color</Label>
              <div 
                className="w-8 h-8 rounded border mt-1" 
                style={{ backgroundColor: formData.color }}
              ></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
