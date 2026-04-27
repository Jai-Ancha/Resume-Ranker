"use client"

import { useState } from "react"
import { X, Loader2, MessageSquare } from "lucide-react"

interface InterviewModalProps {
  isOpen: boolean
  onClose: () => void
  questions: string[]
  filename: string
  isLoading: boolean
}

export default function InterviewModal({
  isOpen,
  onClose,
  questions,
  filename,
  isLoading,
}: InterviewModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 
                    flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-purple-500/30 rounded-2xl 
                      p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto
                      shadow-2xl shadow-purple-500/10">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl 
                           flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Interview Questions
              </h2>
              <p className="text-gray-400 text-sm truncate max-w-xs">
                {filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors
                       w-8 h-8 flex items-center justify-center rounded-lg
                       hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-gray-400 text-sm">
              Generating personalized questions...
            </p>
          </div>
        )}

        {/* Questions */}
        {!isLoading && questions.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-gray-400 text-sm mb-2">
              {questions.length} tailored questions based on JD + resume
            </p>
            {questions.map((q, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 bg-gray-800/60 rounded-xl 
                           border border-gray-700/50 hover:border-purple-500/30
                           transition-colors"
              >
                <div className="min-w-7 h-7 bg-purple-600 rounded-full 
                               flex items-center justify-center 
                               text-white font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && questions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">
              Could not generate questions. Please try again.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 
                       text-white rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}