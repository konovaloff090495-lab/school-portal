export interface SubmissionData {
  school: string; type: string; format: string; city: string; region: string; address: string
  description: string; grades: number[]; age: string; price: string; priceFrom?: number
  license: string; features: string; admission: string; website: string
  schoolPhone: string; schoolEmail: string; name: string; role: string; email: string
  pd_agreed: boolean; marketing_agreed: boolean; rights: boolean
}
export interface SubmissionPhoto { file: string; caption: string }
export type SubmissionStatus = 'unconfirmed' | 'pending' | 'changes' | 'published' | 'rejected'
export interface SchoolApplication {
  id: string; status: SubmissionStatus; data: SubmissionData; photos: SubmissionPhoto[]
  comment: string; created: number; updated: number; confirmed: number | null
  published: number | null; url: string | null; marketing: number
  subscribed: number | null; unsubscribed: number | null; score: number | null; feedback: string | null
  emails: { kind: string; state: string; attempts: number; sent: number | null; error: string | null }[]
  history?: { event: string; at: number; detail: string }[]
}
export interface SubmissionReceipt { id: string; token: string; error?: string }
export interface PublishedSchool { id: string; data: SubmissionData; photos: SubmissionPhoto[]; published: number }
