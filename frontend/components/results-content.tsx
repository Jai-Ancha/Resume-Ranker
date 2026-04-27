"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SummaryBar } from "@/components/summary-bar"
import { CandidateCard } from "@/components/candidate-card"
import { useResume } from "@/lib/resume-context"

export function ResultsContent() {
  const router = useRouter()
  const { candidates, files } = useResume()

  useEffect(() => {
    if (candidates.length === 0) {
      router.push("/")
    }
  }, [candidates, router])

  if (candidates.length === 0) {
    return null
  }

  const topMatch = candidates[0]
  const averageScore = Math.round(
    candidates.reduce((sum, c) => sum + c.atsScore, 0) / candidates.length
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Analysis Results
        </h1>
        <p className="mt-2 text-muted-foreground">
          AI-powered ranking of {files.length} candidates
        </p>
      </motion.div>

      <SummaryBar
        totalResumes={candidates.length}
        topMatchName={topMatch.filename.replace(".pdf", "")}
        topMatchPercentage={topMatch.matchPercentage}
        averageScore={averageScore}
      />

      <div className="space-y-4">
        {candidates.map((candidate, index) => (
          <CandidateCard key={candidate.id} candidate={candidate} index={index} />
        ))}
      </div>
    </div>
  )
}
