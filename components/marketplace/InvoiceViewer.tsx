"use client";

import { Download, Printer, Share2 } from "lucide-react";
import type { Invoice } from "@/lib/services/marketplace/invoiceService";

interface InvoiceViewerProps {
  invoice: Invoice;
  onDownload?: () => void;
  onPrint?: () => void;
}

export default function InvoiceViewer({
  invoice,
  onDownload,
  onPrint,
}: InvoiceViewerProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/marketplace/invoices/${invoice.id}?export=pdf`,
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error("Failed to download invoice:", error);
    }
  };

  const handlePrint = () => {
    window.print();
    if (onPrint) {
      onPrint();
    }
  };

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 print:p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice</h1>
          <div className="text-gray-600">
            <div>Invoice #: {invoice.invoiceNumber}</div>
            <div>
              Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
            </div>
            <div>
              Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handleDownload}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Print"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            invoice.status,
          )}`}
        >
          {invoice.status.toUpperCase()}
        </span>
      </div>

      {/* Invoice Items */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Description
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Quantity
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Unit Price
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-4">{item.description}</td>
                <td className="py-3 px-4 text-right">{item.quantity}</td>
                <td className="py-3 px-4 text-right">
                  {item.unitPrice.toLocaleString()} {invoice.currency}
                </td>
                <td className="py-3 px-4 text-right">
                  {item.total.toLocaleString()} {invoice.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">
              {invoice.subtotal.toLocaleString()} {invoice.currency}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Tax (VAT)</span>
            <span className="font-medium">
              {invoice.tax.toLocaleString()} {invoice.currency}
            </span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-200 font-bold text-lg">
            <span>Total</span>
            <span>
              {invoice.total.toLocaleString()} {invoice.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {invoice.paymentId && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div>Payment ID: {invoice.paymentId}</div>
            {invoice.paymentMethod && (
              <div>Payment Method: {invoice.paymentMethod}</div>
            )}
            {invoice.paidAt && (
              <div>Paid At: {new Date(invoice.paidAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
          <p className="text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center pt-6 border-t border-gray-200">
        This is a computer-generated invoice. No signature required.
      </div>
    </div>
  );
}
