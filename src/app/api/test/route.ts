import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Simple database test
    const userCount = await prisma.user.count()
    
    return NextResponse.json({ 
      message: 'FinanSync API is working!',
      userCount,
      timestamp: new Date().toISOString(),
      database: 'Connected ✅'
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: 'Check your DATABASE_URL and ensure PostgreSQL is running'
    }, { status: 500 })
  }
}
