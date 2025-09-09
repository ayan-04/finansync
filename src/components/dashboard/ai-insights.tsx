"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, MessageSquare, TrendingUp, TrendingDown, 
  AlertTriangle, Lightbulb, Trophy, Send, Loader2 
} from 'lucide-react'

interface SpendingInsight {
  type: 'warning' | 'suggestion' | 'achievement' | 'trend'
  title: string
  description: string
  actionable: string
  savings?: number
  category?: string
}

interface AIInsightsProps {
  refreshKey?: number
}

export function AIInsights({ refreshKey }: AIInsightsProps) {
  const [insights, setInsights] = useState<SpendingInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai/insights')
      
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights, refreshKey])

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatQuestion.trim() || chatLoading) return

    setChatLoading(true)
    setChatAnswer('')

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: chatQuestion })
      })

      if (response.ok) {
        const data = await response.json()
        setChatAnswer(data.answer)
      } else {
        setChatAnswer('Sorry, I could not process your question. Please try again.')
      }
    } catch (error) {
      setChatAnswer('Network error. Please check your connection and try again.')
    } finally {
      setChatLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'suggestion': return <Lightbulb className="h-5 w-5 text-blue-600" />
      case 'achievement': return <Trophy className="h-5 w-5 text-green-600" />
      case 'trend': return <TrendingUp className="h-5 w-5 text-orange-600" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-red-200 bg-red-50'
      case 'suggestion': return 'border-blue-200 bg-blue-50'
      case 'achievement': return 'border-green-200 bg-green-50'
      case 'trend': return 'border-orange-200 bg-orange-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Financial Assistant
          </h2>
          <p className="text-gray-600">Smart insights and financial guidance powered by AI</p>
        </div>
        <Button onClick={fetchInsights} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh Insights'}
        </Button>
      </div>

      {/* AI Insights Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-40">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
            <p className="text-gray-600">Add some expenses and budgets to get AI-powered financial insights!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <Card key={index} className={`border-l-4 ${getInsightColor(insight.type)}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{insight.title}</h3>
                      {insight.savings && (
                        <Badge variant="secondary">
                          Save {formatCurrency(insight.savings)}/mo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    <div className="bg-white/80 p-3 rounded border">
                      <p className="text-sm font-medium text-gray-700">💡 Action:</p>
                      <p className="text-sm text-gray-600">{insight.actionable}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ask Your Financial Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <Input
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              placeholder="Ask me about your spending... (e.g., 'How much did I spend on food this month?')"
              className="flex-1"
            />
            <Button type="submit" disabled={chatLoading || !chatQuestion.trim()}>
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          {chatAnswer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">AI Assistant:</p>
                  <p className="text-blue-800 text-sm leading-relaxed">{chatAnswer}</p>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          <div className="flex flex-wrap gap-2">
            {[
              "How much did I spend on food this month?",
              "Which category am I overspending on?",
              "How can I save $200 next month?",
              "Compare my spending to last month"
            ].map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setChatQuestion(question)}
                disabled={chatLoading}
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
