"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { CandidateData } from "@/components/candidate-card"

interface ResumeContextType {
  jobDescription: string
  setJobDescription: (jd: string) => void
  files: File[]
  setFiles: (files: File[]) => void
  candidates: CandidateData[]
  setCandidates: (candidates: CandidateData[]) => void
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void
  currentStep: number
  setCurrentStep: (step: number) => void
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined)

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [jobDescription, setJobDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <ResumeContext.Provider
      value={{
        jobDescription,
        setJobDescription,
        files,
        setFiles,
        candidates,
        setCandidates,
        isAnalyzing,
        setIsAnalyzing,
        currentStep,
        setCurrentStep,
      }}
    >
      {children}
    </ResumeContext.Provider>
  )
}

export function useResume() {
  const context = useContext(ResumeContext)
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider")
  }
  return context
}
