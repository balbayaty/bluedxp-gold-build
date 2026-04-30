/**
 * Enhanced ERPNext Client
 * 
 * Complete ERPNext client with hazardous materials, compliance, and inventory management
 * 
 * Migrated from: flex-vision-erpnext/src/lib/erpnext/client.ts
 * Enhanced existing: lib/adapters/erpnext/api.ts
 */

import axios, { AxiosInstance } from 'axios'
import { eventBus } from '@/lib/services/event-store'

interface ERPNextConfig {
  url: string
  apiKey: string
  apiSecret: string
}

export class EnhancedERPNextClient {
  private client: AxiosInstance
  private config: ERPNextConfig

  constructor() {
    this.config = {
      url: process.env.ERPNEXT_URL || process.env.ERP_NEXT_API_URL || 'http://165.232.148.39',
      apiKey: process.env.ERPNEXT_API_KEY || process.env.ERP_NEXT_API_KEY || '',
      apiSecret: process.env.ERPNEXT_API_SECRET || process.env.ERP_NEXT_API_SECRET || '',
    }

    this.client = axios.create({
      baseURL: this.config.url,
      headers: {
        Authorization: `token ${this.config.apiKey}:${this.config.apiSecret}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  /**
   * Test ERPNext connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/method/frappe.auth.get_logged_user')
      await eventBus.publish('erpnext.connection.tested', {
        success: response.status === 200,
        timestamp: new Date(),
      })
      return response.status === 200
    } catch (error) {
      await eventBus.publish('erpnext.connection.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      })
      console.error('ERPNext connection failed:', error)
      return false
    }
  }

  /**
   * Get document from ERPNext
   */
  async getDocument(doctype: string, name: string) {
    try {
      const response = await this.client.get(`/api/resource/${doctype}/${name}`)
      return response.data
    } catch (error) {
      console.error(`Failed to get ${doctype} ${name}:`, error)
      throw error
    }
  }

  /**
   * List documents from ERPNext
   */
  async listDocuments(doctype: string, filters?: any, fields?: string[]) {
    try {
      const params: any = {}
      if (filters) params.filters = JSON.stringify(filters)
      if (fields) params.fields = JSON.stringify(fields)
      params.limit_page_length = 100

      const response = await this.client.get(`/api/resource/${doctype}`, { params })
      return response.data
    } catch (error) {
      console.error(`Failed to list ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Create document in ERPNext
   */
  async createDocument(doctype: string, data: any) {
    try {
      const response = await this.client.post(`/api/resource/${doctype}`, data)
      await eventBus.publish('erpnext.document.created', {
        doctype,
        name: response.data?.data?.name,
        timestamp: new Date(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to create ${doctype}:`, error)
      throw error
    }
  }

  /**
   * Update document in ERPNext
   */
  async updateDocument(doctype: string, name: string, data: any) {
    try {
      const response = await this.client.put(`/api/resource/${doctype}/${name}`, data)
      await eventBus.publish('erpnext.document.updated', {
        doctype,
        name,
        timestamp: new Date(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to update ${doctype} ${name}:`, error)
      throw error
    }
  }

  /**
   * Delete document from ERPNext
   */
  async deleteDocument(doctype: string, name: string) {
    try {
      const response = await this.client.delete(`/api/resource/${doctype}/${name}`)
      await eventBus.publish('erpnext.document.deleted', {
        doctype,
        name,
        timestamp: new Date(),
      })
      return response.data
    } catch (error) {
      console.error(`Failed to delete ${doctype} ${name}:`, error)
      throw error
    }
  }

  /**
   * Call ERPNext method
   */
  async callMethod(method: string, args?: any) {
    try {
      const response = await this.client.post(`/api/method/${method}`, args)
      return response.data
    } catch (error) {
      console.error(`Failed to call method ${method}:`, error)
      throw error
    }
  }

  /**
   * Create hazardous material in ERPNext
   */
  async createHazardousMaterial(data: {
    material_name: string
    cas_number?: string
    un_number?: string
    hazard_class?: string
    packing_group?: string
    quantity?: number
    unit?: string
    supplier?: string
    storage_location?: string
    msds_link?: string
  }) {
    const materialData = {
      doctype: 'Item',
      item_code: `HAZ-${data.material_name.replace(/\s+/g, '-')}-${Date.now()}`,
      item_name: data.material_name,
      item_group: 'Hazardous Materials',
      stock_uom: data.unit || 'Kg',
      is_stock_item: 1,
      custom_cas_number: data.cas_number,
      custom_un_number: data.un_number,
      custom_hazard_class: data.hazard_class,
      custom_packing_group: data.packing_group,
      custom_msds_link: data.msds_link,
      default_supplier: data.supplier,
      default_warehouse: data.storage_location,
    }

    return await this.createDocument('Item', materialData)
  }

  /**
   * Get compliance checks
   */
  async getComplianceChecks(material_name?: string) {
    const filters = material_name ? { item_name: material_name } : {}
    return await this.listDocuments('Quality Inspection', filters)
  }

  /**
   * Create compliance record
   */
  async createComplianceRecord(data: {
    material_name: string
    inspection_type: string
    status: 'Accepted' | 'Rejected' | 'In Process'
    remarks?: string
    inspector?: string
    date?: string
  }) {
    const inspectionData = {
      doctype: 'Quality Inspection',
      inspection_type: data.inspection_type || 'In Process',
      item_code: data.material_name,
      sample_size: 1,
      inspected_by: data.inspector || 'System',
      report_date: data.date || new Date().toISOString().split('T')[0],
      status: data.status,
      remarks: data.remarks,
    }

    return await this.createDocument('Quality Inspection', inspectionData)
  }

  /**
   * Get safety data sheets
   */
  async getSafetyDataSheets() {
    return await this.listDocuments('File', {
      attached_to_doctype: 'Item',
      file_url: ['like', '%msds%'],
    })
  }

  /**
   * Get inventory
   */
  async getInventory() {
    return await this.listDocuments(
      'Stock Ledger Entry',
      {},
      ['item_code', 'warehouse', 'actual_qty', 'qty_after_transaction', 'posting_date']
    )
  }

  /**
   * Get warehouses
   */
  async getWarehouses() {
    return await this.listDocuments('Warehouse', {}, ['name', 'warehouse_name'])
  }

  /**
   * Get suppliers
   */
  async getSuppliers() {
    return await this.listDocuments('Supplier', {}, ['name', 'supplier_name'])
  }
}

export const enhancedERPNextClient = new EnhancedERPNextClient()





