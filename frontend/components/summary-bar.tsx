"use client"

import { motion } from "framer-motion"
import { Users, Trophy, TrendingUp } from "lucide-react"

interface SummaryBarProps {
  totalResumes: number
  topMatchName: string
  topMatchPercentage: number
  averageScore: number
}

export function SummaryBar({ totalResumes, topMatchName, topMatchPercentage, averageScore }: SummaryBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 grid gap-4 sm:grid-cols-3"
    >
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
          <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <p className="text-2xl font-bold">{totalResumes}</p>
          <p className="text-sm text-muted-foreground">Resumes Analyzed</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
          <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p className="text-lg font-bold">
            Top Match: <span className="text-violet-600 dark:text-violet-400">{topMatchPercentage}%</span>
          </p>
          <p className="text-sm text-muted-foreground truncate max-w-[150px]">{topMatchName}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-bold">{averageScore}</p>
          <p className="text-sm text-muted-foreground">Avg ATS Score</p>
        </div>
      </div>
    </motion.div>
  )
}
