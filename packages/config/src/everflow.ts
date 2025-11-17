export const EVERFLOW_CONFIG = {
  API_BASE_URL: process.env.EVERFLOW_API_URL || 'https://api.eflow.team/v1',
  API_KEY: process.env.EVERFLOW_API_KEY || '',
} as const

export interface EverflowApiOptions {
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: Record<string, any>
  params?: Record<string, string | number>
}

export interface EverflowApiResponse<T = any> {
  data?: T
  total?: number
  page?: number
  per_page?: number
  [key: string]: any
}

export class EverflowApiClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = EVERFLOW_CONFIG.API_BASE_URL
    this.apiKey = EVERFLOW_CONFIG.API_KEY

    if (!this.apiKey) {
      console.warn('Everflow API key is not configured. Set EVERFLOW_API_KEY in your environment variables.')
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    // Ensure baseUrl doesn't end with / and endpoint starts with /
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = new URL(`${base}${path}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })
    }
    
    return url.toString()
  }

  async request<T = any>(options: EverflowApiOptions): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Everflow API key is not configured')
    }

    const url = this.buildUrl(options.endpoint, options.params)
    const method = options.method || 'GET'

    const headers: HeadersInit = {
      'X-Eflow-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    console.log(`[Everflow API] ${method} ${url}`)
    console.log(`[Everflow API] Headers:`, { 'X-Eflow-API-Key': this.apiKey ? '***configured***' : 'MISSING' })

    try {
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        let errorMessage = `Everflow API error (${response.status}): ${response.statusText}`
        let errorDetails: any = {}
        try {
          const errorData = await response.json()
          errorDetails = errorData
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error || errorMessage
          }
        } catch {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText}`
            errorDetails = { raw: errorText }
          }
        }
        console.error(`[Everflow API] Error response:`, {
          status: response.status,
          statusText: response.statusText,
          url,
          details: errorDetails
        })
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      const text = await response.text()
      return text as any
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Everflow API request failed: ${error.message}`)
      }
      throw error
    }
  }

  async getPublishers(params?: Record<string, string | number>) {
    return this.request({
      endpoint: '/networks/publishers',
      method: 'GET',
      params,
    })
  }

  async getPublisher(publisherId: string | number) {
    return this.request({
      endpoint: `/networks/publishers/${publisherId}`,
      method: 'GET',
    })
  }

  async getOffers(params?: Record<string, string | number>) {
    return this.request({
      endpoint: '/networks/offers',
      method: 'GET',
      params,
    })
  }

  async getOffer(offerId: string | number) {
    return this.request({
      endpoint: `/networks/offers/${offerId}`,
      method: 'GET',
    })
  }

  async getAdvertisers(params?: Record<string, string | number>) {
    return this.request({
      endpoint: '/networks/advertisers',
      method: 'GET',
      params,
    })
  }

  async getAdvertiser(advertiserId: string | number) {
    return this.request({
      endpoint: `/networks/advertisers/${advertiserId}`,
      method: 'GET',
    })
  }

  async getAdvertisersList(params?: Record<string, string | number>) {
    return this.request({
      endpoint: '/networks/advertisers',
      method: 'GET',
      params,
    })
  }

  async getAnalytics(params?: Record<string, string | number>) {
    return this.request({
      endpoint: '/networks/reporting',
      method: 'GET',
      params,
    })
  }

  async getAffiliates(params?: Record<string, string | number>) {
    return this.request({
      endpoint: '/networks/affiliates',
      method: 'GET',
      params,
    })
  }

  async getAffiliate(affiliateId: string | number) {
    return this.request({
      endpoint: `/networks/affiliates/${affiliateId}`,
      method: 'GET',
    })
  }
}

export const everflowClient = new EverflowApiClient()

