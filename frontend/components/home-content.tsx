"use client"

import { API_ENDPOINTS } from "@/lib/api"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Zap, CheckCircle2, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { HeroSection } from "@/components/hero-section"
import { UploadZone } from "@/components/upload-zone"
import { LoadingState } from "@/components/loading-state"
import { useResume } from "@/lib/resume-context"
import { generateMockCandidates } from "@/lib/mock-data"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type StatusType = "idle" | "loading" | "success" | "error"

export function HomeContent() {
  const router = useRouter()
  const {
    jobDescription,
    setJobDescription,
    files,
    setFiles,
    setCandidates,
    isAnalyzing,
    setIsAnalyzing,
    currentStep,
    setCurrentStep,
  } = useResume()
  const [localJd, setLocalJd] = useState(jobDescription)
  const [localFiles, setLocalFiles] = useState<File[]>(files)
  const [status, setStatus] = useState<StatusType>("idle")
  const [analyzedCount, setAnalyzedCount] = useState(0)

  const isButtonDisabled = !localJd.trim() || localFiles.length === 0

  const handleAnalyze = useCallback(async () => {
    if (isButtonDisabled) return

    setJobDescription(localJd)
    setFiles(localFiles)
    setIsAnalyzing(true)
    setCurrentStep(0)
    setStatus("loading")

    try {
      // 1. Pack the UI data into a FormData object
      const formData = new FormData()
      formData.append("job_description", localJd)
      localFiles.forEach((file) => {
        formData.append("resumes", file) 
      })

      // Move UI progress bar to "Creating embeddings..."
      setCurrentStep(1)

      // 2. Shoot the data to your Python AI Engine
      const response = await fetch(API_ENDPOINTS.rankWithAI, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.status}`)
      }

      // Move UI progress bar to "Generating AI insights..."
      setCurrentStep(3)

      // 3. Receive the JSON from FastAPI
      const backendData = await response.json()

      // --- DEFENSIVE UI SHIELD STARTS HERE ---
      // Safety check: if OpenRouter failed, stop here so React doesn't crash
      if (!backendData || !backendData.rankings || backendData.rankings.length === 0) {
        throw new Error("Empty response from backend")
      }

      // 4. Map the backend JSON to fit the UI safely
      const realCandidates = backendData.rankings.map((r: any, index: number) => {
        const safeMatchPercentage = r.match_percentage ?? 50;
        
        return {
          id: `cand-${index}`,
          rank: r.rank ?? index + 1,
          filename: r.filename ?? `Resume_${index + 1}.pdf`,
          matchPercentage: Math.round(safeMatchPercentage),
          atsScore: r.ats_score ?? Math.round(safeMatchPercentage),
          
          // Verdict normalization
          verdict: (["STRONG MATCH", "GOOD MATCH", "WEAK MATCH"].includes(r.verdict))
            ? r.verdict
            : safeMatchPercentage >= 70 ? "STRONG MATCH"
            : safeMatchPercentage >= 50 ? "GOOD MATCH" 
            : "WEAK MATCH",
          
          matchedSkills: Array.isArray(r.matched_skills) ? r.matched_skills : [],
          missingSkills: Array.isArray(r.missing_skills) ? r.missing_skills : [],
          experienceAlignment: r.experience_alignment ?? "See resume for details.",
          strengths: Array.isArray(r.strengths) ? r.strengths : [],
          improvements: Array.isArray(r.improvements) ? r.improvements : [],
          
          // Interview recommendation handling
          interviewRecommendation: (r.interview_recommendation === true || 
            r.interview_recommendation === "Recommended" ||
            r.interview_recommendation === "Highly Recommended")
            ? "Recommended" 
            : "Not Recommended",
          
          atsBreakdown: {
            skillsMatch: Math.round(safeMatchPercentage),
            experienceMatch: r.ats_score ?? Math.round(safeMatchPercentage),
            educationMatch: 85,
            keywordDensity: Math.max(0, Math.round(safeMatchPercentage - 5))
          }
        };
      })
      // --- DEFENSIVE UI SHIELD ENDS HERE ---

      setCurrentStep(4) // Mark loading as fully complete

      // 5. Inject the real AI data into the React state
      setCandidates(realCandidates)
      setAnalyzedCount(localFiles.length)
      setStatus("success")
      setIsAnalyzing(false)
      
      // Navigate to the beautiful results dashboard
      setTimeout(() => {
        router.push("/results")
      }, 1000)

    } catch (error) {
      console.error("FastAPI connection failed:", error)
      setStatus("error")
      setIsAnalyzing(false)
    }
  }, [localJd, localFiles, isButtonDisabled, setJobDescription, setFiles, setCandidates, setIsAnalyzing, setCurrentStep, router])

  if (isAnalyzing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState currentStep={currentStep} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
      <HeroSection />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Job Description */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-semibold">Job Description</h2>
          </div>
          <Textarea
            placeholder="Paste the job description here..."
            value={localJd}
            onChange={(e) => setLocalJd(e.target.value)}
            className="min-h-[250px] resize-none"
          />
        </div>

        {/* Upload Resumes */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-semibold">Upload Resumes</h2>
          </div>
          <UploadZone files={localFiles} onFilesChange={setLocalFiles} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  onClick={handleAnalyze}
                  disabled={isButtonDisabled}
                  size="lg"
                  className={`w-full py-6 text-lg font-semibold shadow-lg transition-all ${
                    isButtonDisabled
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
                  }`}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Analyze Resumes
                </Button>
              </div>
            </TooltipTrigger>
            {isButtonDisabled && (
              <TooltipContent side="bottom" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Add JD and resumes to continue
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Status Area */}
        <AnimatePresence mode="wait">
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                Analysis complete — {analyzedCount} resume{analyzedCount > 1 ? "s" : ""} ranked
              </span>
            </motion.div>
          )}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-600 dark:text-red-400"
            >
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                Could not analyze resumes. Please check your backend is running or API key is valid.
              </span>
            </motion.div>
          )}
          {status === "idle" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-center text-sm text-muted-foreground"
            >
              AI will rank and score each resume against the job description
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
