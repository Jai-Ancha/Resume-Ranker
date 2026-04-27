"use client"

import { useCallback, useState } from "react"
import { Upload, FileText, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
  onFilesChange: (files: File[]) => void
  files: File[]
}

export function UploadZone({ onFilesChange, files }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf"
    )
    onFilesChange([...files, ...droppedFiles])
  }, [files, onFilesChange])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type === "application/pdf"
      )
      onFilesChange([...files, ...selectedFiles])
    }
  }, [files, onFilesChange])

  const removeFile = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }, [files, onFilesChange])

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300",
          isDragging
            ? "border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            : "border-border hover:border-violet-500/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300",
            isDragging 
              ? "bg-violet-600/30" 
              : "bg-gradient-to-br from-violet-600/20 to-purple-600/20"
          )}>
            <Upload className={cn(
              "h-7 w-7 transition-colors duration-300",
              isDragging 
                ? "text-violet-500" 
                : "text-violet-600 dark:text-violet-400"
            )} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop PDF resumes here or <span className="text-violet-600 dark:text-violet-400 underline underline-offset-2">browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports multiple PDF files
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <Badge className="bg-violet-600 text-white hover:bg-violet-700">
                {files.length} resume{files.length > 1 ? "s" : ""} selected
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="rounded-full p-0.5 hover:bg-muted transition-colors"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
