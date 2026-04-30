/**
 * API Service
 * Mobile app API client
 */

import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.API_URL || 'https://api.bluedxp.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Would add auth token from storage
    // const token = await AsyncStorage.getItem('authToken')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export async function fetchDashboardData(): Promise<any> {
  const response = await apiClient.get('/api/dashboard?tenantId=default')
  return response.data
}

export async function fetchWMSData(): Promise<any> {
  const response = await apiClient.get('/api/wms/dashboard?tenantId=default')
  return response.data
}

export async function fetchFinanceData(): Promise<any> {
  const response = await apiClient.get('/api/finance/dashboard?tenantId=default')
  return response.data
}

export async function fetchCRMData(): Promise<any> {
  const response = await apiClient.get('/api/crm/dashboard?tenantId=default')
  return response.data
}

