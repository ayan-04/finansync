import { NextRequest, NextResponse } from 'next/server'
import { ReportsService } from '@/lib/services/reports'
import puppeteer from 'puppeteer'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only read the reportType etc.
    const { reportType, month, year } = await request.json()
    console.log('📄 Generating server-side PDF for:', reportType)

    // Get report data
    let reportData: unknown
    if (reportType === 'monthly') {
      const date = month ? new Date(`${month}-01`) : new Date()
      reportData = await ReportsService.generateMonthlyReport(user.id, date)
    } else {
      reportData = await ReportsService.generateYearlyReport(user.id, year)
    }

    // Generate HTML template
    const htmlContent = generateReportHTML(reportData, reportType)

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        bottom: '2cm',
        left: '2cm',
        right: '2cm',
      },
    })

    await browser.close()

    console.log('✅ Server PDF generated successfully')
    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="finansync-report-${reportType}-${Date.now()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('❌ Server PDF generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

// Generate HTML for the PDF
function generateReportHTML(reportData: unknown, reportType: string) {
  const data = reportData as {
    period?: string
    year?: number
    totalExpenses: number
    netSavings: number
    topCategories?: { category: string; amount: number; percentage: number }[]
    categoryTotals?: { category: string; amount: number; percentage: number }[]
    budgetPerformance?: { name: string; spent: number; budgetAmount: number; percentage: number }[]
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>FinanSync Financial Report - ${reportType}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f9fafb; }
        .header { padding: 24px; background: #1e293b; color: #fff; text-align: center; }
        .summary-grid { display: flex; gap: 24px; justify-content: center; margin: 20px 0; }
        .summary-card { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(30,41,59,0.06); min-width: 240px; }
        .summary-card h3 { margin: 0; font-size: 1.1rem; color: #64748b; }
        .amount { font-size: 1.8rem; font-weight: bold; }
        .amount.positive { color: #10b981; }
        .amount.negative { color: #ef4444; }
        .category-section { margin: 32px 0 16px 0; }
        .category-list { list-style: none; margin: 0; padding: 0; }
        .category-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
        .category-name { font-weight: 500; color: #334155; }
        .category-amount { font-variant-numeric: tabular-nums; color: #475569; }
        .footer { text-align: center; font-size: 0.98rem; margin-top: 24px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FinanSync Financial Report</h1>
        <h2 style="color: #6b7280; margin: 0;">${reportType === 'monthly' ? data.period : `Year ${data.year}`}</h2>
        <p style="color: #9ca3af; margin: 10px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Expenses</h3>
          <div class="amount negative">
            ${formatCurrency(data.totalExpenses)}
          </div>
        </div>
        <div class="summary-card">
          <h3>Net Savings</h3>
          <div class="amount ${data.netSavings >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(data.netSavings)}
          </div>
        </div>
      </div>
      <div class="category-section">
        <h3>Top Spending Categories</h3>
        <ul class="category-list">
          ${reportType === 'monthly'
            ? (data.topCategories ?? []).slice(0, 5).map(cat =>
                `<li class="category-item">
                  <span class="category-name">${cat.category}</span>
                  <span class="category-amount">${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)</span>
                </li>`
              ).join('')
            : (data.categoryTotals ?? []).slice(0, 5).map(cat =>
                `<li class="category-item">
                  <span class="category-name">${cat.category}</span>
                  <span class="category-amount">${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)</span>
                </li>`
              ).join('')
          }
        </ul>
      </div>
      ${reportType === 'monthly' ? `
        <div class="category-section">
          <h3>Budget Performance Summary</h3>
          <ul class="category-list">
            ${(data.budgetPerformance ?? []).map(budget => `
              <li class="category-item">
                <span class="category-name">${budget.name}</span>
                <span class="category-amount">${formatCurrency(budget.spent)} / ${formatCurrency(budget.budgetAmount)} (${budget.percentage.toFixed(1)}%)</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      <div class="footer">
        <p>Generated by FinanSync Financial Management System</p>
        <p>For questions about this report, please contact support.</p>
      </div>
    </body>
    </html>
  `
}
