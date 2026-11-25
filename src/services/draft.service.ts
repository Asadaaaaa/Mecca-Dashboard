import { apiClient } from "@/services/api-client"

export interface FormDraftResponse<T> {
  form_key: string
  data: T
  saved_at: string
}

export const draftService = {
  async getDraft<T>(formKey: string): Promise<FormDraftResponse<T> | null> {
    const res = await apiClient.get(`/drafts/${encodeURIComponent(formKey)}`)
    return res.data?.data || null
  },

  async saveDraft<T>(formKey: string, data: T): Promise<{ form_key: string; saved_at: string } | null> {
    const res = await apiClient.put(`/drafts/${encodeURIComponent(formKey)}`, { data })
    return res.data?.data || null
  },

  async deleteDraft(formKey: string): Promise<void> {
    await apiClient.delete(`/drafts/${encodeURIComponent(formKey)}`)
  },
}
