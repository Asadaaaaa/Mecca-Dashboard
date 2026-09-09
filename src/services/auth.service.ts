import {
  apiClient,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  LAST_REFRESH_TIME_KEY,
} from "./api-client"
import type {
  LoginPayload,
  ApiResponse,
  LoginResponseData,
  User,
} from "@/types/auth.types"

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>(
      "/auth/login",
      payload
    )

    const data = response.data.data
    if (!data) {
      throw new Error(response.data.message || "Login failed")
    }

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    localStorage.setItem(LAST_REFRESH_TIME_KEY, Date.now().toString())

    return data
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(LAST_REFRESH_TIME_KEY)
    window.location.replace("/login")
  },

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY)
    return Boolean(token && token.trim().length > 0)
  },

  async getProfile(): Promise<User | null> {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me")
    if (response.data?.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data))
      return response.data.data
    }
    return null
  },
}
