/**
 * ERPNext API Integration for ISO IMS
 * Connects Hazalyze Platform with ERPNext backend
 * 
 * Source: chemcheck-ai/lib/erpnext-api.ts
 * Adapted for Hazalyze Platform
 */

// ERPNext API Configuration
// SECURITY: All credentials MUST come from environment variables
// Never hardcode passwords, API keys, or secrets in source code
const ERP_URL = process.env.ERP_NEXT_API_URL || "https://erp.hazalyze.com";

// Require environment variables - fail fast if not set
const ERP_EMAIL = process.env.ERP_NEXT_API_KEY;
if (!ERP_EMAIL) {
  throw new Error(
    "ERP_NEXT_API_KEY environment variable is required. Set it in your .env.local file.",
  );
}

const ERP_PASSWORD = process.env.ERP_NEXT_API_SECRET;
if (!ERP_PASSWORD) {
  throw new Error(
    "ERP_NEXT_API_SECRET environment variable is required. Set it in your .env.local file.",
  );
}

export class ERPNextAPI {
  private session: any;
  private headers: Record<string, string> = {};

  constructor() {
    this.session = null;
  }

  /**
   * Login to ERPNext
   */
  async login() {
    try {
      const response = await fetch(`${ERP_URL}/api/method/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          usr: ERP_EMAIL,
          pwd: ERP_PASSWORD,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const cookies = response.headers.get('set-cookie');
        return { success: true, cookies };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
  }

  /**
   * Get ISO Documents
   */
  async getDocuments() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/File?fields=["name","file_name","file_url","creation","modified"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get documents error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get NCRs (Non-Conformance Reports)
   */
  async getNCRs() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Issue?fields=["name","subject","status","priority","creation"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get NCRs error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get CAPAs (Corrective & Preventive Actions)
   */
  async getCAPAs() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Task?fields=["name","subject","status","priority","exp_end_date"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get CAPAs error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get Audits
   */
  async getAudits() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Event?fields=["name","subject","starts_on","ends_on","status"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get audits error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Create new ISO Document
   */
  async createDocument(documentData: any) {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/File`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      }

      return { success: false, error: 'Failed to create document' };
    } catch (error) {
      console.error('Create document error:', error);
      return { success: false, error };
    }
  }

  /**
   * Create new NCR
   */
  async createNCR(ncrData: any) {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: 'Issue',
          ...ncrData
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      }

      return { success: false, error: 'Failed to create NCR' };
    } catch (error) {
      console.error('Create NCR error:', error);
      return { success: false, error };
    }
  }

  /**
   * Create new CAPA
   */
  async createCAPA(capaData: any) {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: 'Task',
          ...capaData
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      }

      return { success: false, error: 'Failed to create CAPA' };
    } catch (error) {
      console.error('Create CAPA error:', error);
      return { success: false, error };
    }
  }

  /**
   * Update CAPA
   */
  async updateCAPA(capaName: string, updates: any) {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Task/${capaName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      }

      return { success: false, error: 'Failed to update CAPA' };
    } catch (error) {
      console.error('Update CAPA error:', error);
      return { success: false, error };
    }
  }

  /**
   * Get Users
   */
  async getUsers() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/User?fields=["name","email","full_name","user_type"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get Customers
   */
  async getCustomers() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Customer?fields=["name","customer_name","customer_type","territory"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get customers error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get Suppliers
   */
  async getSuppliers() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Supplier?fields=["name","supplier_name","supplier_type","territory"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get suppliers error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get Warehouses
   */
  async getWarehouses() {
    try {
      const response = await fetch(`${ERP_URL}/api/resource/Warehouse?fields=["name","warehouse_name","warehouse_type","company"]&limit_page_length=1000`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Get warehouses error:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * Get Dashboard Statistics
   */
  async getDashboardStats() {
    try {
      const [docs, ncrs, capas, audits] = await Promise.all([
        this.getDocuments(),
        this.getNCRs(),
        this.getCAPAs(),
        this.getAudits()
      ]);

      const stats = {
        total_documents: docs.data.length,
        total_ncrs: ncrs.data.length,
        open_ncrs: ncrs.data.filter((n: any) => n.status !== 'Closed').length,
        total_capas: capas.data.length,
        open_capas: capas.data.filter((c: any) => c.status !== 'Completed').length,
        total_audits: audits.data.length,
        compliance_score: this.calculateComplianceScore(ncrs.data, capas.data)
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, stats: null, error };
    }
  }

  /**
   * Calculate AI-powered compliance score
   */
  private calculateComplianceScore(ncrs: any[], capas: any[]) {
    const openNCRs = ncrs.filter(n => n.status !== 'Closed').length;
    const totalCAPAs = capas.length;
    const completedCAPAs = capas.filter(c => c.status === 'Completed').length;
    
    const capaCompletionRate = totalCAPAs > 0 ? (completedCAPAs / totalCAPAs) * 100 : 100;
    const ncrPenalty = openNCRs * 5; // 5 points penalty per open NCR
    
    const score = Math.max(0, Math.min(100, capaCompletionRate - ncrPenalty));
    
    return Math.round(score);
  }

  /**
   * Send Email via ERPNext
   */
  async sendEmail(data: {
    to: string
    subject: string
    message: string
    reference_doctype?: string
    reference_name?: string
    cc?: string
    bcc?: string
    attachments?: Array<{ file_url: string; file_name: string }>
  }) {
    try {
      // Ensure we're logged in
      await this.login()

      // Create Communication document in ERPNext
      const communicationData = {
        doctype: 'Communication',
        communication_type: 'Communication',
        communication_medium: 'Email',
        recipients: data.to,
        subject: data.subject,
        content: data.message,
        status: 'Open',
        sent_or_received: 'Sent',
        ...(data.reference_doctype && { reference_doctype: data.reference_doctype }),
        ...(data.reference_name && { reference_name: data.reference_name }),
        ...(data.cc && { cc: data.cc }),
        ...(data.bcc && { bcc: data.bcc }),
      }

      const response = await fetch(`${ERP_URL}/api/resource/Communication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(communicationData),
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        
        // Try to send email via ERPNext email queue
        try {
          await fetch(`${ERP_URL}/api/method/frappe.core.doctype.communication.communication.send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: result.data.name
            }),
            credentials: 'include',
          })
        } catch (emailError) {
          console.log('[erpnext] Email queued but send method may not be available')
        }

        return { success: true, data: result.data, messageId: result.data.name }
      }

      return { success: false, error: 'Failed to create communication' }
    } catch (error) {
      console.error('Send email error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
    }
  }
}

// Export singleton instance
export const erpNextAPI = new ERPNextAPI();



