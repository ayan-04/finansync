import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { ReportsService } from '@/lib/services/reports'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const reportYear = year ? parseInt(year) : new Date().getFullYear()

    const report = await ReportsService.generateYearlyReport(session.user.id, reportYear)

    return NextResponse.json(report)

  } catch (error) {
    console.error('Yearly Report API Error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
