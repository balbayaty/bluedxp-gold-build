/**
 * Client-side export utilities
 * Uses export service for PDF, CSV, Excel exports
 */

import type { ExportConfig, ExportResult } from '@/lib/services/export/exportService'

/**
 * Export data to PDF (client-side)
 * Uses HTML generation that can be printed to PDF
 */
export async function exportToPDF(config: {
  data: Record<string, any>[] | Record<string, any>
  filename?: string
  title?: string
  description?: string
  columns?: Array<{ key: string; label: string; type?: string; align?: 'left' | 'center' | 'right'; visible?: boolean }>
  companyName?: string
  footer?: string
  includeTimestamp?: boolean
}): Promise<void> {
  const data = Array.isArray(config.data) ? config.data : [config.data]
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  const columns = config.columns || inferColumns(data[0])
  const filename = config.filename || `export-${Date.now()}`

  // Create HTML content for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${config.title || 'Export'}</title>
      <style>
        @media print {
          @page { margin: 1cm; }
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          margin: 20px;
          color: #333;
        }
        h1 { color: #333; margin-bottom: 10px; font-size: 24px; }
        h2 { color: #666; margin-bottom: 5px; font-size: 18px; }
        p { color: #666; margin-bottom: 20px; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
        }
        th { 
          background-color: #4A5568; 
          color: #fff; 
          padding: 10px; 
          text-align: left; 
          font-weight: bold;
        }
        td { 
          border: 1px solid #E2E8F0; 
          padding: 8px; 
        }
        tr:nth-child(even) { 
          background-color: #F7FAFC; 
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 20px; 
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          color: #666; 
          font-size: 10px; 
          border-top: 1px solid #E2E8F0;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${config.companyName ? `<h2>${config.companyName}</h2>` : ''}
          ${config.title ? `<h1>${config.title}</h1>` : ''}
          ${config.description ? `<p>${config.description}</p>` : ''}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            ${columns.filter(c => c.visible !== false).map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.filter(c => c.visible !== false).map(c => {
                const value = formatValue(row[c.key], c)
                const align = c.align || 'left'
                return `<td style="text-align: ${align}">${escapeHtml(String(value))}</td>`
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${config.includeTimestamp !== false ? `<div class="footer">Generated on ${new Date().toLocaleString()}</div>` : ''}
      ${config.footer ? `<div class="footer">${config.footer}</div>` : ''}
    </body>
    </html>
  `

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print()
      // Optionally close after print
      // printWindow.close()
    }, 250)
  } else {
    // Fallback: download as HTML
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// exportToCSV is now an alias defined after exportToExcel function below

/**
 * Infer columns from data
 */
function inferColumns(data: Record<string, any>): Array<{ key: string; label: string; visible?: boolean }> {
  return Object.keys(data).map(key => ({
    key,
    label: key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase()),
    visible: true,
  }))
}

/**
 * Format value based on column type
 */
function formatValue(value: any, column: { type?: string }): string {
  if (value === null || value === undefined) return ''
  
  if (column.type === 'date' && value instanceof Date) {
    return value.toLocaleDateString()
  }
  
  if (column.type === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }
  
  if (column.type === 'percentage' && typeof value === 'number') {
    return `${value.toFixed(2)}%`
  }
  
  if (column.type === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  
  return String(value)
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Export data to Excel (client-side)
 * Creates CSV that can be opened in Excel
 */
export async function exportToExcel(config: {
  data: Record<string, any>[] | Record<string, any>
  filename?: string
  columns?: Array<{ key: string; label: string }>
}): Promise<void> {
  const data = Array.isArray(config.data) ? config.data : [config.data]
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  const columns = config.columns || inferColumns(data[0])
  const filename = config.filename || `export-${Date.now()}.csv`

  // Create CSV content
  const headers = columns.map(c => c.label).join(',')
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key]
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  })

  const csv = [headers, ...rows].join('\n')

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Export data to CSV (alias for exportToExcel)
 */
export const exportToCSV = exportToExcel
