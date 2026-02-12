"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { TypingText } from "@/components/typing-text"

export type TerminalLine = {
  type: "prompt" | "output" | "success" | "blank"
  text: string
  visible: boolean
  typing?: boolean
  onTypingComplete?: () => void
}

interface TerminalProps {
  lines: TerminalLine[]
  className?: string
}

function LineContent({ line }: { line: TerminalLine }) {
  if (line.type === "blank") {
    return <div className="h-3" />
  }

  if (line.type === "prompt") {
    return (
      <div className="flex gap-1.5">
        <span className="text-neutral-400 select-none">$</span>
        {line.typing ? (
          <TypingText
            text={line.text}
            speed={45}
            onComplete={line.onTypingComplete}
            className="text-neutral-800"
          />
        ) : (
          <span className="text-neutral-800">{line.text}</span>
        )}
      </div>
    )
  }

  if (line.type === "success") {
    return (
      <div className="flex gap-1.5">
        <span className="text-green-600">✓</span>
        <span className="text-neutral-600">{line.text}</span>
      </div>
    )
  }

  // output
  return <div className="text-neutral-500">{line.text}</div>
}

export function Terminal({ lines, className }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const visibleLines = lines.filter((l) => l.visible)

  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [visibleLines.length])

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden border border-neutral-200 flex flex-col shadow-sm",
        className
      )}
      style={{ width: 280 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0efed] border-b border-neutral-200">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
          <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <div className="w-2 h-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[9px] text-neutral-400 ml-1">Claude Code</span>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="bg-[#faf9f7] p-3 font-mono text-[10px] leading-relaxed"
      >
        <AnimatePresence initial={false}>
          {visibleLines.map((line, i) => (
            <motion.div
              key={`${i}-${line.text}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <LineContent line={line} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
