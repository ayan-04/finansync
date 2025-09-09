import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@finansync.com' }
    })

    if (existingUser) {
      return NextResponse.json({ 
        message: 'Test user already exists', 
        user: { id: existingUser.id, email: existingUser.email, name: existingUser.name }
      })
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 12)
    
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@finansync.com',
        password: hashedPassword
      }
    })

    // Create sample budgets
    const budgets = await prisma.budget.createMany({
      data: [
        {
          name: 'Food & Dining',
          amount: 500,
          icon: '🍕',
          color: '#ef4444',
          userId: user.id
        },
        {
          name: 'Transportation',
          amount: 300,
          icon: '🚗',
          color: '#3b82f6',
          userId: user.id
        },
        {
          name: 'Entertainment',
          amount: 200,
          icon: '🎬',
          color: '#8b5cf6',
          userId: user.id
        }
      ]
    })

    // Create sample expenses
    const foodBudget = await prisma.budget.findFirst({
      where: { userId: user.id, name: 'Food & Dining' }
    })

    if (foodBudget) {
      await prisma.expense.createMany({
        data: [
          {
            name: 'Grocery Shopping',
            amount: 85.50,
            description: 'Weekly groceries',
            budgetId: foodBudget.id,
            userId: user.id
          },
          {
            name: 'Restaurant Dinner',
            amount: 45.00,
            description: 'Date night',
            budgetId: foodBudget.id,
            userId: user.id
          }
        ]
      })
    }

    return NextResponse.json({ 
      message: 'Test user and sample data created successfully! 🎉',
      user: { id: user.id, email: user.email, name: user.name },
      credentials: {
        email: 'test@finansync.com',
        password: 'testpassword'
      },
      sampleData: {
        budgets: 3,
        expenses: 2
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Test user creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create test user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
