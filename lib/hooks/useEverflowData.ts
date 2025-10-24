import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function usePublishers(params?: Record<string, string>) {
  const queryString = params ? new URLSearchParams(params).toString() : ''
  const url = `/api/everflow/mock-publishers${queryString ? `?${queryString}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  return {
    publishers: data?.data || [],
    error,
    isLoading,
    mutate
  }
}

export function useOffers(params?: Record<string, string>) {
  const queryString = params ? new URLSearchParams(params).toString() : ''
  const url = `/api/everflow/offers${queryString ? `?${queryString}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  return {
    offers: data?.data || [],
    error,
    isLoading,
    mutate
  }
}

export function useAnalytics(params?: Record<string, string>) {
  const queryString = params ? new URLSearchParams(params).toString() : ''
  const url = `/api/everflow/mock-analytics${queryString ? `?${queryString}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  })

  return {
    analytics: data?.data || [],
    error,
    isLoading,
    mutate
  }
}
