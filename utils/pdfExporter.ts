// PDF Exporter for Customer SLA & KPI Documents
// Generates professional, industry-standard PDF documents

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CustomerSLA } from '@/types/asn'
import { KPI } from '@/types/asn'
import { format } from 'date-fns'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

// FLEX Logo SVG (converted to base64-compatible format)
const FLEX_LOGO_SVG = `
<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="28" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#FF6600" transform="skewX(-5)">
    FLEX
  </text>
  <text x="0" y="38" font-family="Arial, sans-serif" font-size="8" font-weight="300" fill="#CCCCCC" transform="skewX(-5)">
    EMPOWERING LOGISTICS
  </text>
</svg>
`

/**
 * Convert SVG to base64 data URL
 */
function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml;base64,${btoa(unescape(encoded))}`
}

/**
 * Format duration in seconds to human-readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Export Customer SLA & KPI Document as PDF
 */
export function exportSLAKPIPDF(
  customerNumber: string,
  customerName: string,
  slas: CustomerSLA[],
  kpis: KPI[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // ========== HEADER SECTION ==========
  // Logo and Company Info
  doc.setFillColor(0, 0, 0)
  doc.rect(0, 0, pageWidth, 50, 'F')

  // FLEX Logo (text-based for PDF compatibility)
  doc.setTextColor(255, 102, 0) // Orange #FF6600
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('FLEX', margin, 20)
  
  doc.setTextColor(204, 204, 204) // Light gray
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('EMPOWERING LOGISTICS', margin, 28)

  // Document Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SERVICE LEVEL AGREEMENT', pageWidth - margin, 20, { align: 'right' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('& KEY PERFORMANCE INDICATORS', pageWidth - margin, 28, { align: 'right' })

  yPosition = 60

  // ========== CUSTOMER INFORMATION SECTION ==========
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CUSTOMER INFORMATION', margin + 5, yPosition + 8)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Customer Number: ${customerNumber}`, margin + 5, yPosition + 15)
  doc.text(`Customer Name: ${customerName}`, margin + 5, yPosition + 20)

  // Document Metadata
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Document Date: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth - margin - 5, yPosition + 15, { align: 'right' })
  doc.text(`Document Version: 1.0`, pageWidth - margin - 5, yPosition + 20, { align: 'right' })

  yPosition += 35

  // ========== EXECUTIVE SUMMARY ==========
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(200, 200, 200)
  doc.roundedRect(margin, yPosition, contentWidth, 30, 3, 3, 'FD')

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('EXECUTIVE SUMMARY', margin + 5, yPosition + 8)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const summaryText = `This document outlines the Service Level Agreements (SLAs) and Key Performance Indicators (KPIs) established between FLEX Logistics and ${customerName}. These metrics define the operational performance standards and measurement criteria for logistics operations, ensuring transparency, accountability, and continuous improvement in service delivery.`
  
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 10)
  doc.text(summaryLines, margin + 5, yPosition + 15)

  yPosition += 40

  // ========== SERVICE LEVEL AGREEMENTS SECTION ==========
  if (slas.length > 0) {
    doc.setFillColor(255, 102, 0)
    doc.roundedRect(margin, yPosition, contentWidth, 8, 3, 3, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('SERVICE LEVEL AGREEMENTS (SLAs)', margin + 5, yPosition + 6)

    yPosition += 12

    slas.forEach((sla, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      // SLA Card
      doc.setFillColor(250, 250, 250)
      doc.setDrawColor(220, 220, 220)
      doc.roundedRect(margin, yPosition, contentWidth, 45, 3, 3, 'FD')

      // SLA Header
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`SLA ${index + 1}: ${sla.name}`, margin + 5, yPosition + 7)

      // Status Badge
      doc.setFillColor(sla.isActive ? 34 : 200, sla.isActive ? 197 : 200, sla.isActive ? 94 : 200)
      doc.roundedRect(pageWidth - margin - 25, yPosition + 2, 20, 6, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(sla.isActive ? 'ACTIVE' : 'INACTIVE', pageWidth - margin - 15, yPosition + 6, { align: 'center' })

      // SLA Details
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      if (sla.description) {
        const descLines = doc.splitTextToSize(sla.description, contentWidth - 10)
        doc.text(descLines, margin + 5, yPosition + 15)
      }

      // Metrics Table
      const metricsData = [
        ['Metric Type', sla.metric.toUpperCase().replace('_', ' ')],
        ['Target Duration', formatDuration(sla.targetDuration)],
        ['Warning Threshold', `${sla.warningThreshold}%`],
        ['Critical Threshold', `${sla.criticalThreshold}%`],
      ]

      if (sla.metric === 'custom' && sla.customFormula) {
        metricsData.push(['Custom Formula', sla.customFormula])
      }

      autoTable(doc, {
        startY: yPosition + 20,
        head: [['Parameter', 'Value']],
        body: metricsData,
        theme: 'plain',
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: margin + 5, right: margin + 5 },
        tableWidth: contentWidth - 10,
      })

      yPosition = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 5 : yPosition + 30

      // Conditions
      if (sla.conditions && sla.conditions.length > 0) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('Conditions:', margin + 5, yPosition + 3)
        
        sla.conditions.forEach((condition, condIndex) => {
          doc.setFont('helvetica', 'normal')
          doc.text(
            `  • ${condition.field} ${condition.operator} ${condition.value}`,
            margin + 5,
            yPosition + 8 + condIndex * 4
          )
        })
        yPosition += 8 + sla.conditions.length * 4
      }

      yPosition += 5
    })
  }

  // ========== KEY PERFORMANCE INDICATORS SECTION ==========
  // Filter KPIs for this specific customer
  const customerKPIs = kpis.filter(kpi => 
    !kpi.id.startsWith('kpi-internal-') && 
    (kpi.customerNumber === customerNumber || (!kpi.customerNumber && customerNumber === 'CUST-SIKA-001'))
  )
  
  if (customerKPIs.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(255, 102, 0)
    doc.roundedRect(margin, yPosition, contentWidth, 8, 3, 3, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('KEY PERFORMANCE INDICATORS (KPIs)', margin + 5, yPosition + 6)

    yPosition += 12

    // KPI Table
    const kpiTableData = customerKPIs.map((kpi) => [
      kpi.name,
      kpi.category.toUpperCase(),
      `${kpi.target} ${kpi.unit}`,
      kpi.formula,
      kpi.isActive ? 'ACTIVE' : 'INACTIVE',
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['KPI Name', 'Category', 'Target', 'Formula', 'Status']],
      body: kpiTableData,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 102, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
    })

      yPosition = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : yPosition + 30

    // KPI Details
    customerKPIs.forEach((kpi, index) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFillColor(250, 250, 250)
      doc.setDrawColor(220, 220, 220)
      doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'FD')

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`KPI ${index + 1}: ${kpi.name}`, margin + 5, yPosition + 7)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      if (kpi.description) {
        const descLines = doc.splitTextToSize(kpi.description, contentWidth - 10)
        doc.text(descLines, margin + 5, yPosition + 13)
      }

      doc.setFont('helvetica', 'bold')
      doc.text(`Target: ${kpi.target} ${kpi.unit}`, margin + 5, yPosition + 20)
      doc.text(`Formula: ${kpi.formula}`, margin + contentWidth / 2, yPosition + 20)

      yPosition += 30
    })
  }

  // ========== FOOTER SECTION ==========
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    // Footer line
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    
    // Footer text
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `FLEX Logistics - Confidential & Proprietary`,
      margin,
      pageHeight - 10
    )
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
    doc.text(
      `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // ========== SIGNATURE SECTION ==========
  doc.addPage()
  yPosition = margin

  doc.setFillColor(245, 245, 245)
  doc.roundedRect(margin, yPosition, contentWidth, pageHeight - 2 * margin, 3, 3, 'F')

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURE PAGE', pageWidth / 2, yPosition + 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const signatureText = `This document represents the agreed Service Level Agreements and Key Performance Indicators between FLEX Logistics and ${customerName}. By signing below, both parties acknowledge acceptance of the terms and conditions outlined in this document.`
  const sigLines = doc.splitTextToSize(signatureText, contentWidth - 20)
  doc.text(sigLines, pageWidth / 2, yPosition + 30, { align: 'center', maxWidth: contentWidth - 20 })

  // Signature boxes
  yPosition = pageHeight / 2

  // FLEX Logistics Signature
  doc.setDrawColor(200, 200, 200)
  doc.roundedRect(margin + 10, yPosition, contentWidth / 2 - 15, 50, 3, 3, 'D')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('FLEX LOGISTICS', margin + 10 + (contentWidth / 2 - 15) / 2, yPosition + 10, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Authorized Representative', margin + 10 + (contentWidth / 2 - 15) / 2, yPosition + 20, { align: 'center' })
  doc.text('_________________________', margin + 10 + (contentWidth / 2 - 15) / 2, yPosition + 30, { align: 'center' })
  doc.text('Signature', margin + 10 + (contentWidth / 2 - 15) / 2, yPosition + 35, { align: 'center' })
  doc.text('Date: _______________', margin + 10 + (contentWidth / 2 - 15) / 2, yPosition + 42, { align: 'center' })

  // Customer Signature
  doc.roundedRect(pageWidth / 2 + 5, yPosition, contentWidth / 2 - 15, 50, 3, 3, 'D')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(customerName.toUpperCase(), pageWidth / 2 + 5 + (contentWidth / 2 - 15) / 2, yPosition + 10, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Authorized Representative', pageWidth / 2 + 5 + (contentWidth / 2 - 15) / 2, yPosition + 20, { align: 'center' })
  doc.text('_________________________', pageWidth / 2 + 5 + (contentWidth / 2 - 15) / 2, yPosition + 30, { align: 'center' })
  doc.text('Signature', pageWidth / 2 + 5 + (contentWidth / 2 - 15) / 2, yPosition + 35, { align: 'center' })
  doc.text('Date: _______________', pageWidth / 2 + 5 + (contentWidth / 2 - 15) / 2, yPosition + 42, { align: 'center' })

  // Footer for signature page
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.text(
    `FLEX Logistics - Confidential & Proprietary`,
    margin,
    pageHeight - 10
  )
  doc.text(
    `Page ${totalPages + 1} of ${totalPages + 1}`,
    pageWidth - margin,
    pageHeight - 10,
    { align: 'right' }
  )

  // ========== SAVE PDF ==========
  const fileName = `SLA_KPI_${customerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(fileName)
}

