export interface Permission {
  id?: number
  name: string
  description?: string
}

export interface Role {
  id?: number
  name: string
  description?: string
  permissions?: Permission[]
}

export interface User {
  id: number
  uuid: string
  name: string
  username: string
  email: string
  status?: string
  roles?: Role[]
}

export interface AuthTokens {
  token: string
  refreshToken: string
}

export interface LoginPayload {
  identity: string
  password: string
}

export interface ApiResponse<T = any> {
  status: number
  message: string
  data?: T
  err?: {
    type: string
    data?: any
  }
}

export interface LoginResponseData extends AuthTokens {
  user: User
}
