/**
 * Microsoft Dynamics Connector for Process Lifecycle
 * Integration with Dynamics 365
 */

import { BaseConnector, ConnectorConfig, ConnectorRequest, ConnectorResponse } from './connectorFramework'

export class DynamicsConnector extends BaseConnector {
  private accessToken?: string

  constructor(config: ConnectorConfig) {
    super(config)
    this.capabilities = {
      read: true,
      write: true,
      subscribe: true,
      batch: true,
      realTime: true,
      webhooks: true,
    }
  }

  async execute(request: ConnectorRequest): Promise<ConnectorResponse> {
    await this.ensureAuthenticated()

    const dynamicsPath = this.mapToDynamicsPath(request.path)

    const headers = {
      ...request.headers,
      'Authorization': `Bearer ${this.accessToken}`,
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Accept': 'application/json',
    }

    const url = `${this.config.endpoint}${dynamicsPath}`
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    })

    const body = await response.json().catch(() => ({}))

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: this.transformDynamicsResponse(body),
      timestamp: new Date(),
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureAuthenticated()
      const response = await this.execute({
        method: 'GET',
        path: '/WhoAmI',
      })
      return response.status === 200
    } catch {
      return false
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken) return

    // Azure AD OAuth2
    const credentials = this.config.authentication.credentials
    const response = await fetch(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: `${this.config.endpoint}/.default`,
        grant_type: 'client_credentials',
      }),
    })

    const data = await response.json()
    this.accessToken = data.access_token
  }

  private mapToDynamicsPath(path: string): string {
    const mappings: Record<string, string> = {
      '/sales-orders': '/api/data/v9.2/salesorders',
      '/opportunities': '/api/data/v9.2/opportunities',
      '/accounts': '/api/data/v9.2/accounts',
    }
    return mappings[path] || path
  }

  private transformDynamicsResponse(body: any): any {
    if (body.value) {
      return body.value
    }
    return body
  }
}











