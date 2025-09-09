import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { ReportsService } from '@/lib/services/reports'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reportType, month, year } = await request.json()
    
    console.log('📄 Generating server-side PDF for:', reportType)
    
    // Get report data
    let reportData
    if (reportType === 'monthly') {
      const date = month ? new Date(month + '-01') : new Date()
      reportData = await ReportsService.generateMonthlyReport(session.user.id, date)
    } else {
      reportData = await ReportsService.generateYearlyReport(session.user.id, year)
    }

    // Generate HTML template
    const htmlContent = generateReportHTML(reportData, reportType)
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        right: '2cm'
      }
    })
    
    await browser.close()
    
    console.log('✅ Server PDF generated successfully')
    
    // ✅ SIMPLEST FIX: Use Buffer.from() directly
    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="finansync-report-${reportType}-${Date.now()}.pdf"`
      }
    })

  } catch (error) {
    console.error('❌ Server PDF generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

// Your existing generateReportHTML function remains the same...
function generateReportHTML(reportData: any, reportType: string) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>FinanSync Financial Report - ${reportType}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px;
          background: white;
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1f2937;
          margin-bottom: 10px;
          font-size: 28px;
        }
        .summary-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 20px; 
          margin-bottom: 40px;
        }
        .summary-card { 
          border: 2px solid #e5e7eb; 
          border-radius: 12px; 
          padding: 24px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .summary-card h3 {
          margin-top: 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-card .amount {
          font-size: 24px;
          font-weight: bold;
          margin-top: 8px;
        }
        .amount.positive { color: #16a34a; }
        .amount.negative { color: #dc2626; }
        .amount.neutral { color: #3b82f6; }
        .category-section {
          margin-bottom: 40px;
        }
        .category-section h3 {
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .category-list {
          list-style: none;
          padding: 0;
          background: #f9fafb;
          border-radius: 8px;
          overflow: hidden;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          margin-bottom: 1px;
        }
        .category-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .category-name {
          font-weight: 600;
          color: #374151;
        }
        .category-amount {
          font-weight: bold;
          color: #1f2937;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FinanSync Financial Report</h1>
        <h2 style="color: #6b7280; margin: 0;">${reportType === 'monthly' ? reportData.period : `Year ${reportData.year}`}</h2>
        <p style="color: #9ca3af; margin: 10px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Expenses</h3>
          <div class="amount negative">
            ${formatCurrency(reportData.totalExpenses)}
          </div>
        </div>
        <div class="summary-card">
          <h3>Net Savings</h3>
          <div class="amount ${reportData.netSavings >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(reportData.netSavings)}
          </div>
        </div>
      </div>
      
      <div class="category-section">
        <h3>Top Spending Categories</h3>
        <ul class="category-list">
          ${reportType === 'monthly' 
            ? reportData.topCategories.slice(0, 5).map((cat: any) => `
                <li class="category-item">
                  <span class="category-name">${cat.category}</span>
                  <span class="category-amount">${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)</span>
                </li>
              `).join('')
            : reportData.categoryTotals.slice(0, 5).map((cat: any) => `
                <li class="category-item">
                  <span class="category-name">${cat.category}</span>
                  <span class="category-amount">${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)</span>
                </li>
              `).join('')
          }
        </ul>
      </div>
      
      ${reportType === 'monthly' ? `
        <div class="category-section">
          <h3>Budget Performance Summary</h3>
          <ul class="category-list">
            ${reportData.budgetPerformance.map((budget: any) => `
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
