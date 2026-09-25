import { apiClient } from "@/services/api-client"
import type {
  SystemSettings,
  PinUpdatePayload,
  ForceSOUpdatePayload,
} from "@/types/settings.types"

export const settingService = {
  async getSystemSettings(): Promise<SystemSettings> {
    const res = await apiClient.get("/settings/system")
    return res.data?.data || {
      security_pin_enabled: false,
      has_pin_configured: false,
      force_sales_order_enabled: false,
    }
  },

  async updatePin(data: PinUpdatePayload): Promise<SystemSettings> {
    const res = await apiClient.put("/settings/system/pin", data)
    return res.data?.data
  },

  async updateForceSalesOrder(data: ForceSOUpdatePayload): Promise<SystemSettings> {
    const res = await apiClient.put("/settings/system/force-sales-order", data)
    return res.data?.data
  },

  async verifyPin(pin: string): Promise<{ valid: boolean }> {
    const res = await apiClient.post("/settings/system/verify-pin", { pin })
    return res.data?.data
  },
}
