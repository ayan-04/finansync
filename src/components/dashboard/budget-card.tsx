"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MoreVertical, TrendingUp, TrendingDown, Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface BudgetCardProps {
  id: string
  name: string
  amount: number
  spent: number
  icon?: string
  color?: string
  remaining: number
  percentage: number
  isOverBudget?: boolean
  onAddExpense?: (budgetId: string) => void
  onEditBudget?: (budgetId: string, data: any) => void
  onDeleteBudget?: (budgetId: string) => void
  onRefresh?: () => void
  onBudgetDeleted?: (budgetId: string) => void // ✅ New prop for optimistic updates
    onDeleteError?: (budgetId: string, originalBudgets: any[]) => void // ✅ Add this missing property

}

export function BudgetCard({
  id,
  name,
  amount,
  spent,
  icon = "💰",
  color = "#3b82f6",
  remaining,
  percentage,
  isOverBudget = false,
  onAddExpense,
  onEditBudget,
  onDeleteBudget,
  onRefresh,
    onDeleteError, // ✅ Add this to destructuring

  onBudgetDeleted
}: BudgetCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ name, amount: amount.toString() })
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const getStatusColor = () => {
    if (isOverBudget) return 'text-red-600'
    if (percentage > 80) return 'text-orange-600'
    if (percentage > 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getBadgeVariant = () => {
    if (isOverBudget) return 'destructive'
    if (percentage > 80) return 'warning'
    return 'secondary'
  }

  const handleSaveEdit = async () => {
    if (!editData.name || !editData.amount) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          amount: parseFloat(editData.amount)
        })
      })

      if (response.ok) {
        setIsEditing(false)
        onRefresh?.()
        alert('Budget updated successfully!')
      } else {
        throw new Error('Failed to update budget')
      }
    } catch (error) {
      alert('Error updating budget')
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIX: Add the missing handleCancelEdit function
  const handleCancelEdit = () => {
    setEditData({ name, amount: amount.toString() })
    setIsEditing(false)
  }

 
const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${name}" budget?`)) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onBudgetDeleted?.(id)
        onRefresh?.()
        alert('Budget deleted successfully!')
      } else {
        throw new Error('Delete failed')
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      // ✅ Call onDeleteError if delete fails
      onDeleteError?.(id, []) // Pass empty array or original state if available
      alert(`Error deleting budget: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card className="relative overflow-hidden h-full hover:shadow-lg transition-all duration-300 border-l-4" 
          style={{ borderLeftColor: color }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-2xl">{icon}</div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="text-lg font-semibold"
                    placeholder="Budget name"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.amount}
                      onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                      className="text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-lg font-semibold">{name}</CardTitle>
                  <p className="text-sm text-gray-500">Budget: {formatCurrency(amount)}</p>
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-green-600"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-600"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <Badge variant={getBadgeVariant()}>
              {percentage.toFixed(0)}%
            </Badge>
          </div>
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Spent: {formatCurrency(spent)}</span>
            <span className={getStatusColor()}>
              {isOverBudget ? 'Over by ' : 'Remaining: '}
              {formatCurrency(Math.abs(remaining))}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-sm">
            {isOverBudget ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
            <span className={getStatusColor()}>
              {isOverBudget ? 'Over Budget' : 'On Track'}
            </span>
          </div>
          
          <div className="flex gap-1">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 px-2">
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{icon} {name} Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Total Budget</label>
                      <p className="text-lg font-bold">{formatCurrency(amount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Amount Spent</label>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(spent)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Remaining</label>
                      <p className={`text-lg font-bold ${getStatusColor()}`}>
                        {formatCurrency(Math.abs(remaining))}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Usage</label>
                      <p className="text-lg font-bold">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Progress value={Math.min(percentage, 100)} className="h-3" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              size="sm" 
              className="h-8 px-2"
              onClick={() => onAddExpense?.(id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
