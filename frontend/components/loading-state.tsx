"use client"

import { motion } from "framer-motion"
import { FileSearch, Database, Brain, Sparkles, Check } from "lucide-react"

const steps = [
  { icon: FileSearch, label: "Parsing PDFs..." },
  { icon: Database, label: "Creating embeddings..." },
  { icon: Brain, label: "Ranking with FAISS..." },
  { icon: Sparkles, label: "Generating AI insights..." },
]

interface LoadingStateProps {
  currentStep: number
}

export function LoadingState({ currentStep }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 opacity-20 blur-xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-16 w-16 rounded-full border-4 border-violet-600/30 border-t-violet-600" />
          </motion.div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index < currentStep
          const isActive = index === currentStep

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 ${
                isCompleted
                  ? "text-green-500"
                  : isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-green-500/20"
                    : isActive
                    ? "bg-violet-600/20"
                    : "bg-muted"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className={`h-5 w-5 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </div>
              <span className={`text-sm font-medium ${isActive ? "animate-pulse" : ""}`}>
                {step.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
