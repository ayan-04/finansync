import { NextRequest, NextResponse } from 'next/server'
import { ReportsService } from '@/lib/services/reports'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const date = month ? new Date(month + '-01') : new Date()

    const report = await ReportsService.generateMonthlyReport(user.id, date)

    return NextResponse.json(report)

  } catch (error) {
    console.error('Monthly Report API Error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
