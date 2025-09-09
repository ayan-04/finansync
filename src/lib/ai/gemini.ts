import OpenAI from 'openai'

const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
})

export interface SpendingInsight {
  type: 'warning' | 'suggestion' | 'achievement' | 'trend'
  title: string
  description: string
  actionable: string
  savings?: number
  category?: string
}

export class FinancialAI {
  // ✅ Fixed JSON cleaning method
  private static cleanJsonResponse(content: string): string {
    if (!content) {
      return '[]'
    }

    let cleaned = content.trim()

    // Remove markdown code fences
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '')
    cleaned = cleaned.replace(/\n?```\s*$/, '')

    // If still contains ``` but with JSON inside, extract manually
    if (cleaned.includes('```')) {
      const startIndex = cleaned.indexOf('[')
      const endIndex = cleaned.lastIndexOf(']')
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, endIndex + 1)
      }
    }

    return cleaned.trim()
  }

  // ✅ Generate insights
  static async generateSpendingInsights(data: {
    budgets: Array<{
      name: string
      amount: number
      spent: number
      percentage: number
    }>
    expenses: Array<{
      name: string
      amount: number
      category: string
      date: string
    }>
    monthlySpending: Array<{
      month: string
      amount: number
    }>
  }): Promise<SpendingInsight[]> {
    const promptText = `You are a personal financial advisor AI. Analyze this spending data and provide 3-5 actionable insights.

SPENDING DATA:
${JSON.stringify(data, null, 2)}

IMPORTANT: Respond with ONLY a valid JSON array. No markdown, no code blocks, no explanations. Just the JSON array.

Format:
[
  {
    "type": "warning",
    "title": "Brief insight title",
    "description": "Detailed explanation of the pattern/issue",
    "actionable": "Specific action the user can take",
    "savings": 50,
    "category": "budget_category_if_relevant"
  }
]

Focus on budget overruns, spending patterns, money-saving opportunities, and achievements.`

    try {
      const response = await geminiClient.chat.completions.create({
        model: 'gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert personal financial advisor. Always respond with valid JSON array only. No markdown formatting, no code blocks, no additional text.'
          },
          {
            role: 'user',
            content: promptText
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })

      // ✅ Correct response access
      const content = response.choices?.[0]?.message?.content
      if (!content) {
        console.warn('No response from AI, using fallback insights')
        return this.getFallbackInsights(data)
      }

      console.log('📤 Raw AI Response:', content)

      // ✅ Clean the response before parsing
      const cleanedContent = this.cleanJsonResponse(content)
      console.log('🧹 Cleaned Content:', cleanedContent)

      try {
        const insights: SpendingInsight[] = JSON.parse(cleanedContent)

        if (!Array.isArray(insights)) {
          console.warn('AI returned non-array response, wrapping in array')
          return [insights as SpendingInsight]
        }

        const validInsights = insights.filter(
          (insight: any) =>
            insight &&
            typeof insight === 'object' &&
            insight.title &&
            insight.description &&
            insight.actionable
        )

        console.log('✅ Successfully parsed', validInsights.length, 'insights')
        return validInsights.length > 0
          ? validInsights
          : this.getFallbackInsights(data)
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError)
        console.error('📄 Content that failed to parse:', cleanedContent)
        return this.getFallbackInsights(data)
      }
    } catch (error) {
      console.error('AI Insights API Error:', error)
      return this.getFallbackInsights(data)
    }
  }

  // ✅ Answer financial question
  static async answerFinancialQuestion(
    question: string,
    data: {
      budgets: any[]
      expenses: any[]
      monthlySpending: any[]
    }
  ): Promise<string> {
    const promptText = `You are a helpful personal financial advisor. Answer this question about the user's finances.

QUESTION: "${question}"

FINANCIAL DATA:
${JSON.stringify(data, null, 2)}

Provide a helpful, conversational answer with specific insights from their data. Include numbers, trends, and actionable advice when relevant. Keep the response under 200 words and friendly in tone.`

    try {
      const response = await geminiClient.chat.completions.create({
        model: 'gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content:
              'You are a friendly personal financial advisor. Be helpful, encouraging, and specific.'
          },
          {
            role: 'user',
            content: promptText
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })

      // ✅ Correct response access
      const answer = response.choices?.[0]?.message?.content?.trim()
      return (
        answer ||
        'I apologize, but I cannot analyze your finances right now. Please try again later.'
      )
    } catch (error) {
      console.error('AI Question Error:', error)
      return 'I apologize, but I cannot process your question right now. Please check your spending data and try again.'
    }
  }

  // ✅ Fallback insights
  private static getFallbackInsights(data: any): SpendingInsight[] {
    const insights: SpendingInsight[] = []

    if (data.budgets && data.budgets.length > 0) {
      data.budgets.forEach((budget: any) => {
        if (budget.percentage > 100) {
          insights.push({
            type: 'warning',
            title: `${budget.name} Budget Exceeded`,
            description: `You've spent ${budget.percentage.toFixed(
              0
            )}% of your ${budget.name} budget this month.`,
            actionable: `Review recent ${budget.name} expenses and look for areas to cut back.`,
            category: budget.name
          })
        }
      })
    }

    if (insights.length === 0) {
      insights.push({
        type: 'suggestion',
        title: 'Start Tracking Expenses',
        description: 'Add more expenses to get personalized financial insights.',
        actionable: 'Create budgets and log your daily expenses consistently.'
      })
    }

    return insights
  }
}
