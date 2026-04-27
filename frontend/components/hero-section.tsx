"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <div className="relative py-12 text-center sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
          <Sparkles className="h-4 w-4" />
          AI-Powered Resume Analysis
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Rank Resumes with{" "}
          <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            AI
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
          Upload a Job Description and resumes — AI ranks, scores, and explains every candidate
        </p>
      </motion.div>

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 blur-3xl" />
      </div>
    </div>
  )
}
