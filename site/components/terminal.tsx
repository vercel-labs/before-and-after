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
  title?: string
}

function LineContent({ line }: { line: TerminalLine }) {
  if (line.type === "blank") {
    return <div className="h-3" />
  }

  if (line.type === "prompt") {
    return (
      <div className="flex gap-1.5">
        <span className="select-none" style={{ color: "rgba(0,0,0,0.35)" }}>$</span>
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
        <span style={{ color: "rgba(0,0,0,0.6)" }}>{line.text}</span>
      </div>
    )
  }

  // output
  return <div style={{ color: "rgba(0,0,0,0.5)" }}>{line.text}</div>
}

function ClaudeWelcomeSVG() {
  return (
    <svg
      viewBox="0 0 240 76"
      fill="none"
      style={{ width: "70%", height: "auto", display: "block" }}
    >
      {/* Orange-bordered welcome box */}
      <rect x="4" y="4" width="148" height="68" rx="3" stroke="#D97757" strokeWidth="1.5" fill="none" />

      {/* "Claude Code" + version — right of box */}
      <text x="160" y="16" fill="rgba(0,0,0,0.7)" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="500">Claude Code</text>
      <text x="160" y="26" fill="rgba(0,0,0,0.4)" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, monospace">v2.1.14</text>

      {/* Greeting text — centered in box */}
      <text x="78" y="20" fill="rgba(0,0,0,0.6)" fontSize="8" fontFamily="ui-monospace, SFMono-Regular, monospace" textAnchor="middle">Welcome back Juan Gabriel!</text>

      {/* Pixel-art Claude mascot */}
      <g transform="translate(56, 26) scale(0.35)">
        <path d="M104.998 0H20.998V16.2H104.998V0Z" fill="#D77757" />
        <path d="M34.998 16.1953H20.998V32.3953H34.998V16.1953Z" fill="#D77757" />
        <rect x="35" y="14.7266" width="56" height="29.4545" fill="black" />
        <path d="M84 14.7266H42V36.8175H84V14.7266Z" fill="#D77757" />
        <path d="M105.002 16.1953H91.002V32.3953H105.002V16.1953Z" fill="#D77757" />
        <path d="M119 32.4023H7V48.6023H119V32.4023Z" fill="#D77757" />
        <path d="M104.998 48.5977H20.998V64.7977H104.998V48.5977Z" fill="#D77757" />
        <path d="M35 64.8047H28V81.0047H35V64.8047Z" fill="#D77757" />
        <path d="M49 64.8047H42V81.0047H49V64.8047Z" fill="#D77757" />
        <path d="M84 64.8047H77V81.0047H84V64.8047Z" fill="#D77757" />
        <path d="M98.002 64.8047H91.002V81.0047H98.002V64.8047Z" fill="#D77757" />
      </g>

      {/* Model + project path — centered below mascot */}
      <text x="78" y="62" fill="rgba(0,0,0,0.4)" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, monospace" textAnchor="middle">Opus 4.5 · ~/code/pre-post</text>
    </svg>
  )
}

export function Terminal({ lines, className, title = "Juan Gabriel's project" }: TerminalProps) {
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
      className={cn("overflow-hidden flex flex-col", className)}
      style={{
        background: "#faf9f7",
        borderRadius: "10px",
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center"
        style={{
          background: "#fff",
          padding: "6px 12px",
          gap: "6px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center" style={{ gap: "6px" }}>
          <div className="rounded-full" style={{ width: "8px", height: "8px", background: "#FF5F57" }} />
          <div className="rounded-full" style={{ width: "8px", height: "8px", background: "#FEBC2E" }} />
          <div className="rounded-full" style={{ width: "8px", height: "8px", background: "#28C840" }} />
        </div>
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "rgba(0,0,0,0.85)",
            marginLeft: "4px",
          }}
        >
          {title}
        </span>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="flex-1"
        style={{
          padding: "12px 14px",
          fontFamily: '"SF Mono", SFMono-Regular, ui-monospace, Consolas, monospace',
          fontSize: "10px",
          lineHeight: 1.6,
          color: "rgba(0,0,0,0.7)",
          overflowY: "auto",
        }}
      >
        <ClaudeWelcomeSVG />
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
