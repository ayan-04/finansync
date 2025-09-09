import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first user for testing
    const firstUser = await prisma.user.findFirst()
    
    if (!firstUser) {
      return NextResponse.json({ 
        message: 'No users found - create a test user first',
        hint: 'POST to /api/create-test-user'
      })
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: firstUser.id },
      include: {
        expenses: {
          select: { amount: true }
        }
      }
    })

    const budgetsWithSpent = budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      amount: Number(budget.amount),
      icon: budget.icon,
      color: budget.color,
      createdAt: budget.createdAt,
      spent: budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    }))

    return NextResponse.json({
      message: 'Test budgets retrieved successfully!',
      user: firstUser.email,
      budgets: budgetsWithSpent,
      count: budgetsWithSpent.length
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, amount } = body

    // Get first user for testing
    const firstUser = await prisma.user.findFirst()
    
    if (!firstUser) {
      return NextResponse.json({ error: 'No test user found' }, { status: 400 })
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        amount: Number(amount),
        icon: '💰',
        color: '#3b82f6',
        userId: firstUser.id
      }
    })

    return NextResponse.json({
      message: 'Test budget created successfully!',
      budget
    }, { status: 201 })
  } catch (error) {
    console.error('Test budget creation error:', error)
    return NextResponse.json({ 
      error: 'Creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
