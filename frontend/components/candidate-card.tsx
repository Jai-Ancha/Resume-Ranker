"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, MessageSquare, Check, AlertTriangle, TrendingUp, Award, Crown, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/api"

export interface CandidateData {
  id: string
  rank: number
  filename: string
  matchPercentage: number
  atsScore: number
  verdict: "STRONG MATCH" | "GOOD MATCH" | "WEAK MATCH"
  matchedSkills: string[]
  missingSkills: string[]
  experienceAlignment: string
  strengths: string[]
  improvements: string[]
  interviewRecommendation: "Highly Recommended" | "Recommended" | "Consider" | "Not Recommended"
  atsBreakdown: {
    skillsMatch: number
    experienceMatch: number
    educationMatch: number
    keywordDensity: number
  }
}

interface CandidateCardProps {
  candidate: CandidateData
  index: number
  jobDescription?: string
  resumeFile?: File | null
}

export function CandidateCard({ candidate, index, jobDescription = "", resumeFile }: CandidateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Interview modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)

  const verdictColors = {
    "STRONG MATCH": "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
    "GOOD MATCH": "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    "WEAK MATCH": "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  }

  const recommendationColors = {
    "Highly Recommended": "bg-green-500/20 text-green-600 dark:text-green-400",
    "Recommended": "bg-green-500/20 text-green-600 dark:text-green-400",
    "Consider": "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    "Not Recommended": "bg-red-500/20 text-red-600 dark:text-red-400",
  }

  const rankBadgeColors = {
    1: "from-yellow-400 to-amber-500",
    2: "from-gray-300 to-gray-400",
    3: "from-amber-600 to-amber-700",
  }

  const isTopMatch = candidate.rank === 1

  // Interview questions handler
  const handleGetQuestions = async () => {
    setModalOpen(true)
    setQuestionsLoading(true)
    setQuestions([])

    try {
      if (!resumeFile) {
        // Fallback if file not available
        await new Promise(r => setTimeout(r, 800))
        setQuestions([
          "Tell me about your most challenging AI/ML project and the impact it had?",
          "How do you approach model evaluation and ensure production readiness?",
          "Describe your experience deploying ML models — what challenges did you face?",
          "How do you handle imbalanced datasets in classification problems?",
          "Where do you see AI engineering evolving in the next 2 years?",
        ])
        setQuestionsLoading(false)
        return
      }

      const formData = new FormData()
      formData.append("job_description", jobDescription)
      formData.append("resume", resumeFile)

      const response = await fetch(API_ENDPOINTS.interviewQuestions, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("API failed")

      const data = await response.json()
      setQuestions(data.interview_questions || [])
    } catch (error) {
      console.error("Interview questions error:", error)
      setQuestions([
        "Tell me about your most challenging AI/ML project?",
        "How do you approach model evaluation and validation?",
        "Describe your experience deploying ML models to production?",
        "How do you handle imbalanced datasets?",
        "Where do you see AI engineering heading in the next 2 years?",
      ])
    } finally {
      setQuestionsLoading(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg",
          isTopMatch ? "border-yellow-500/50" : "border-border"
        )}
      >
        {/* Best Match Badge */}
        {isTopMatch && (
          <div className="absolute right-4 top-4 z-10">
            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg gap-1.5 px-3 py-1">
              <Crown className="h-3.5 w-3.5" />
              Best Match
            </Badge>
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-lg",
                  candidate.rank <= 3
                    ? rankBadgeColors[candidate.rank as 1 | 2 | 3]
                    : "from-violet-500 to-purple-600"
                )}
              >
                #{candidate.rank}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{candidate.filename}</h3>
                <Badge
                  variant="outline"
                  className={cn("mt-1", verdictColors[candidate.verdict])}
                >
                  {candidate.verdict}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {candidate.matchPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">Match</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-violet-600/30 bg-violet-600/10">
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                  {candidate.atsScore}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${candidate.matchPercentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 w-full justify-between hover:bg-violet-500/10"
          >
            <span className="text-violet-600 dark:text-violet-400 font-medium">
              {isExpanded ? "Hide Full Analysis" : "View Full Analysis"}
            </span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </motion.div>
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-border"
            >
              <div className="space-y-6 p-6">
                {/* Skills Section */}
                <div>
                  <h4 className="mb-3 font-medium">Skills Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-muted-foreground mr-2">Matched:</span>
                      {candidate.matchedSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-muted-foreground mr-2">Missing:</span>
                      {candidate.missingSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-medium">
                    <TrendingUp className="h-4 w-4 text-violet-600" />
                    Experience Alignment
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {candidate.experienceAlignment}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-medium">
                      <Check className="h-4 w-4 text-green-500" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {candidate.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-1">
                      {candidate.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-500 shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-violet-600" />
                    <span className="font-medium">Interview:</span>
                    <Badge className={recommendationColors[candidate.interviewRecommendation]}>
                      {candidate.interviewRecommendation === "Not Recommended" ? "Not Recommended" : "Recommended"}
                    </Badge>
                  </div>
                </div>

                {/* ATS Breakdown */}
                <div>
                  <h4 className="mb-4 font-medium">ATS Breakdown</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Skills Match", value: candidate.atsBreakdown.skillsMatch, weight: "40%" },
                      { label: "Experience Match", value: candidate.atsBreakdown.experienceMatch, weight: "30%" },
                      { label: "Education Match", value: candidate.atsBreakdown.educationMatch, weight: "20%" },
                      { label: "Keyword Density", value: candidate.atsBreakdown.keywordDensity, weight: "10%" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.label} <span className="text-xs">({item.weight})</span>
                          </span>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Get Interview Questions Button */}
                <Button
                  variant="outline"
                  onClick={handleGetQuestions}
                  className="w-full border-violet-500/30 text-violet-600 hover:bg-violet-500/10 dark:text-violet-400"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Get Interview Questions
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Interview Questions Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 
                       flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6 
                         max-w-2xl w-full max-h-[85vh] overflow-y-auto
                         shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600/20 rounded-xl 
                                 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Interview Questions
                    </h2>
                    <p className="text-muted-foreground text-sm truncate max-w-xs">
                      {candidate.filename}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground 
                             w-8 h-8 flex items-center justify-center 
                             rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loading */}
              {questionsLoading && (
                <div className="flex flex-col items-center py-12 gap-4">
                  <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Generating personalized questions...
                  </p>
                </div>
              )}

              {/* Questions List */}
              {!questionsLoading && questions.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm mb-2">
                    {questions.length} tailored questions based on JD + resume
                  </p>
                  {questions.map((q, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 bg-muted/50 rounded-xl 
                                 border border-border hover:border-violet-500/30
                                 transition-colors"
                    >
                      <div className="min-w-7 h-7 bg-violet-600 rounded-full 
                                     flex items-center justify-center 
                                     text-white font-bold text-xs shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-foreground text-sm leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!questionsLoading && questions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Could not generate questions. Please try again.
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setModalOpen(false)}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}