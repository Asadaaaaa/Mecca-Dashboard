import axios, { type InternalAxiosRequestConfig } from "axios"

export const TOKEN_KEY = "mecca_token"
export const REFRESH_TOKEN_KEY = "mecca_refresh_token"
export const USER_KEY = "mecca_user"
export const LAST_REFRESH_TIME_KEY = "mecca_last_refresh_time"

// 90 minutes in milliseconds (1.5 hours activity refresh trigger)
const REFRESH_INTERVAL_MS = 90 * 60 * 1000

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/primary/v1"

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

// Request Interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    // Bypass auth endpoints from sliding refresh
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh-token")
    ) {
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    }

    if (token && refreshToken) {
      const lastRefresh = parseInt(
        localStorage.getItem(LAST_REFRESH_TIME_KEY) || "0",
        10
      )
      const now = Date.now()

      // If active after 1.5 hours since last token refresh/login, silently refresh token (Sliding Session)
      if (now - lastRefresh >= REFRESH_INTERVAL_MS) {
        if (!isRefreshing) {
          isRefreshing = true
          try {
            const res = await axios.post(
              `${BASE_URL}/auth/refresh-token`,
              { refreshToken },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            if (res.data?.data?.token) {
              const newToken = res.data.data.token
              const newRefreshToken = res.data.data.refreshToken || refreshToken
              localStorage.setItem(TOKEN_KEY, newToken)
              localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
              localStorage.setItem(LAST_REFRESH_TIME_KEY, Date.now().toString())
              onTokenRefreshed(newToken)
            }
          } catch {
            // If refresh fails, clear credentials and let subsequent check handle or continue
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(REFRESH_TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
            localStorage.removeItem(LAST_REFRESH_TIME_KEY)
            if (window.location.pathname !== "/login") {
              window.location.replace("/login?expired=1")
            }
          } finally {
            isRefreshing = false
          }
        } else {
          // Wait until refresh completes
          await new Promise<string>((resolve) => {
            addRefreshSubscriber((newToken: string) => {
              resolve(newToken)
            })
          })
        }
      }

      const activeToken = localStorage.getItem(TOKEN_KEY)
      if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token & user data
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(LAST_REFRESH_TIME_KEY)

      // Redirect immediately to /login if not already there
      if (window.location.pathname !== "/login") {
        window.location.replace("/login?expired=1")
      }
    }
    return Promise.reject(error)
  }
)
