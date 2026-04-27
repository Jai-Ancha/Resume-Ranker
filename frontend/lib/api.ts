// lib/api.ts
// Single place for all API URLs
// When we deploy, only this file needs updating

const API_BASE = 
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export const API_ENDPOINTS = {
  rankWithAI: `${API_BASE}/rank-with-ai`,
  rank: `${API_BASE}/rank`,
  atsAnalysis: `${API_BASE}/ats-analysis`,
  interviewQuestions: `${API_BASE}/interview-questions`,
  health: `${API_BASE}/`,
}