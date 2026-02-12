"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence, useAnimationControls } from "motion/react"
import { Browser, ContentA, ContentB, BrowserChrome } from "@/components/browser"
import { PullRequest, DEFAULT_MARKDOWN, DEFAULT_TITLE } from "@/components/pull-request"
import { Terminal, type TerminalLine } from "@/components/terminal"

// ─── Phase definitions ───────────────────────────────────────────────

type Phase =
  | "idle"
  | "coding"
  | "command"
  | "output"
  | "capture"
  | "upload"
  | "pr_reveal"

const PHASE_ORDER: Phase[] = [
  "idle",
  "coding",
  "command",
  "output",
  "capture",
  "upload",
  "pr_reveal",
]

// Durations for timer-driven phases (coding/command use callbacks instead)
const PHASE_DURATIONS: Partial<Record<Phase, number>> = {
  idle: 1200,
  output: 1000,
  capture: 1000,
  upload: 1400,
  pr_reveal: 2800,
}

function phaseIdx(phase: Phase) {
  return PHASE_ORDER.indexOf(phase)
}

function nextPhase(phase: Phase): Phase {
  return PHASE_ORDER[(phaseIdx(phase) + 1) % PHASE_ORDER.length]
}

// ─── Terminal line builder ───────────────────────────────────────────

function buildLines(
  phase: Phase,
  onCodingComplete: () => void,
  onCommandComplete: () => void,
): TerminalLine[] {
  const idx = phaseIdx(phase)

  const lines: TerminalLine[] = []

  // Phase 1 (idle): blinking cursor placeholder
  if (idx === 0) {
    return lines
  }

  // Phase 2 (coding): editing lines appear progressively
  if (idx >= 1) {
    lines.push({
      type: "prompt",
      text: "Editing app/page.tsx...",
      visible: true,
      typing: idx === 1,
      onTypingComplete: idx === 1 ? onCodingComplete : undefined,
    })
  }
  if (idx >= 2) {
    lines.push(
      { type: "output", text: "  Updated navigation layout", visible: true },
      { type: "output", text: "  Added feature cards", visible: true },
      { type: "blank", text: "", visible: true },
    )
  }

  // Phase 3 (command): /pre-post typing
  if (idx >= 2) {
    lines.push({
      type: "prompt",
      text: "/pre-post",
      visible: true,
      typing: idx === 2,
      onTypingComplete: idx === 2 ? onCommandComplete : undefined,
    })
  }

  // Phase 4 (output): detection lines
  if (idx >= 3) {
    lines.push(
      { type: "blank", text: "", visible: true },
      { type: "output", text: "Detecting routes... found /", visible: true },
      { type: "output", text: "Capturing / (desktop)...", visible: true },
    )
  }

  // Phase 6 (upload): success
  if (idx >= 5) {
    lines.push(
      { type: "blank", text: "", visible: true },
      { type: "success", text: "Added to PR #42", visible: true },
    )
  }

  return lines
}

// ─── AnimatedBrowser ─────────────────────────────────────────────────

function AnimatedBrowser({
  showContentB,
  url,
}: {
  showContentB: boolean
  url: string
}) {
  return (
    <div className="w-full rounded-lg overflow-hidden bg-white border border-neutral-200 relative">
      <BrowserChrome url={url} />
      <div className="bg-white relative" style={{ aspectRatio: "16 / 9" }}>
        {/* ContentA always renders as base */}
        <ContentA />
        {/* ContentB crossfades on top */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContentB ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <ContentB />
        </motion.div>
      </div>
    </div>
  )
}

// ─── Capture ─────────────────────────────────────────────────────────

interface CaptureProps {
  variant: "A" | "B"
  position: "browser" | "center"
  opacity?: number
  delay?: number
  style?: React.CSSProperties
}

function Capture({ variant, position, opacity = 1, delay = 0, style }: CaptureProps) {
  const isA = variant === "A"
  const controls = useAnimationControls()

  const browserPosition = {
    left: isA ? "25%" : "75%",
    top: 0,
    x: "-50%",
    y: 0,
    scale: 1.02,
    rotate: isA ? -1 : 1,
  }

  const centerPosition = {
    left: "50%",
    top: "50%",
    x: isA ? "-60%" : "-40%",
    y: isA ? "-50%" : "-55%",
    scale: 0.65,
    rotate: isA ? -5 : 3,
  }

  const positions = {
    browser: browserPosition,
    center: centerPosition,
  }

  const showFlash = position === "browser"

  useEffect(() => {
    controls.start({ ...positions[position], opacity })
  }, [position, opacity, controls])

  return (
    <motion.div
      className="absolute"
      style={{ ...style, width: "calc(50% - 2px)", willChange: "transform" }}
      initial={{
        left: isA ? "25%" : "75%",
        top: 0,
        x: "-50%",
        y: 0,
        scale: 1,
        rotate: 0,
        opacity: 1,
      }}
      animate={controls}
      exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        bounce: 0.2,
        duration: 0.6,
        delay,
      }}
    >
      <div
        className="relative rounded-lg border-[3px] border-white overflow-hidden"
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
      >
        <Browser variant={variant} url={variant === "A" ? "site.com" : "localhost"} />
        {/* Camera flash overlay */}
        <motion.div
          className="absolute inset-0 bg-white rounded-lg pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: showFlash ? [1, 0] : 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: delay + 0.05 }}
        />
      </div>
    </motion.div>
  )
}

// ─── Upload spinner ──────────────────────────────────────────────────

function CenteredUploadSpinner() {
  return (
    <motion.div
      className="absolute z-[60]"
      style={{ left: "calc(50% - 12px)", top: "calc(50% - 20px)", transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        <motion.circle
          cx="16"
          cy="16"
          r="12"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="75"
          initial={{ strokeDashoffset: 75 }}
          animate={{ strokeDashoffset: [56, 19, 56], rotate: [0, 360, 720] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "center", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
        />
      </svg>
    </motion.div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────

interface HeroProps {
  phase?: Phase
  onPhaseChange?: (phase: Phase) => void
  autoPlay?: boolean
}

export function Hero({ phase: controlledPhase, onPhaseChange, autoPlay = true }: HeroProps) {
  const phase = controlledPhase ?? "idle"
  const idx = phaseIdx(phase)

  // PR tab: starts on "write", switches to "preview" after 1s during pr_reveal
  const [prTab, setPrTab] = useState<"write" | "preview">("write")

  useEffect(() => {
    if (phase !== "pr_reveal") {
      setPrTab("write")
      return
    }
    const timer = setTimeout(() => setPrTab("preview"), 1000)
    return () => clearTimeout(timer)
  }, [phase])

  // Advance phase helper
  const advance = useCallback(() => {
    onPhaseChange?.(nextPhase(phase))
  }, [phase, onPhaseChange])

  // Timer-driven phases
  useEffect(() => {
    if (!autoPlay || !onPhaseChange) return
    // coding and command phases advance via typing callback, not timer
    if (phase === "coding" || phase === "command") return

    const duration = PHASE_DURATIONS[phase]
    if (duration == null) return

    const timer = setTimeout(advance, duration)
    return () => clearTimeout(timer)
  }, [phase, autoPlay, onPhaseChange, advance])

  // Callback-driven phase advances
  const onCodingComplete = useCallback(() => {
    if (autoPlay) onPhaseChange?.("command")
  }, [autoPlay, onPhaseChange])

  const onCommandComplete = useCallback(() => {
    if (autoPlay) onPhaseChange?.("output")
  }, [autoPlay, onPhaseChange])

  // ─── Derived state ───────────────────────────────────────────────
  const showContentB = idx >= 1 // diverge browser B during coding phase
  const showTerminal = idx <= 5
  const showCaptures = idx >= 4 && idx <= 5
  const capturePosition: "browser" | "center" = phase === "capture" ? "browser" : "center"
  const capturesOpacity = phase === "upload" ? 0.75 : 1
  const showSpinner = phase === "upload"
  const showPR = idx >= 6

  // Terminal lines
  const terminalLines = buildLines(phase, onCodingComplete, onCommandComplete)

  // PR markdown
  const showFullMarkdown = idx >= 5

  return (
    <div className="mx-auto w-full max-w-[540px] px-3 sm:px-4">
      <div className="grid grid-cols-[1fr_1fr] gap-0.5 sm:gap-1 relative">
        {/* Browser A — always ContentA */}
        <Browser variant="A" url="site.com" />

        {/* Browser B — crossfades from ContentA to ContentB */}
        <AnimatedBrowser showContentB={showContentB} url="localhost:3000" />

        {/* Row 2: Terminal ↔ PR swap — fixed height to prevent layout shift */}
        <div className="col-span-2 relative overflow-hidden" style={{ minHeight: "290px" }}>
          <AnimatePresence mode="wait">
            {showTerminal && (
              <motion.div
                key="terminal"
                className="absolute inset-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                  enter: { type: "spring", bounce: 0.1, duration: 0.35 },
                  exit: { type: "spring", bounce: 0, duration: 0.25 },
                }}
              >
                <Terminal
                  lines={terminalLines}
                  className="w-full h-full"
                />
              </motion.div>
            )}
            {showPR && (
              <motion.div
                key="pr"
                className="absolute inset-0"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              >
                <PullRequest
                  tab={prTab}
                  markdown={showFullMarkdown ? DEFAULT_MARKDOWN : DEFAULT_TITLE}
                  interactive={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Animated captures */}
        <AnimatePresence>
          {showCaptures && (
            <>
              <Capture
                variant="A"
                position={capturePosition}
                opacity={capturesOpacity}
                style={{ zIndex: 35 }}
              />
              <Capture
                variant="B"
                position={capturePosition}
                opacity={capturesOpacity}
                delay={0.05}
                style={{ zIndex: 38 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Upload spinner */}
        <AnimatePresence>
          {showSpinner && <CenteredUploadSpinner />}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Auto-playing wrapper (used by page.tsx) ─────────────────────────

export function AutoPlayHero() {
  const [phase, setPhase] = useState<Phase>("idle")

  return <Hero phase={phase} onPhaseChange={setPhase} autoPlay />
}

// Re-export types for compatibility
export type HeroState = Phase
export const STATE_ORDER = PHASE_ORDER
