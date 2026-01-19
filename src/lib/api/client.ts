import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'

// API base URL - uses Vite proxy in development
const API_BASE_URL = '/api/v1'

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState()

      // If we have a refresh token, try to refresh
      if (authStore.refreshToken && originalRequest) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: authStore.refreshToken,
          })

          const { accessToken, refreshToken } = response.data
          authStore.setTokens(accessToken, refreshToken)

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return apiClient(originalRequest)
        } catch {
          // Refresh failed, logout user
          authStore.logout()
        }
      } else {
        // No refresh token, logout user
        authStore.logout()
      }
    }

    return Promise.reject(error)
  }
)

// API error type
export interface ApiError {
  statusCode: number
  message: string
  error?: string
}

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError
    return apiError?.message || error.message || 'An error occurred'
  }
  return 'An unexpected error occurred'
}
