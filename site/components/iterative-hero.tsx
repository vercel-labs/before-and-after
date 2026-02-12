"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence, useAnimationControls } from "motion/react"
import { Browser } from "@/components/browser"
import { Terminal, type TerminalLine } from "@/components/terminal"
import { PullRequest, DEFAULT_MARKDOWN, DEFAULT_TITLE } from "@/components/pull-request"
import { cn } from "@/lib/utils"

// State machine
type HeroPhase =
  | "workspace"
  | "typing"
  | "output"
  | "capture"
  | "upload"
  | "pr_reveal"
  | "hold"

const PHASE_DURATIONS: Record<HeroPhase, number> = {
  workspace: 1000,
  typing: 0, // callback-driven
  output: 800,
  capture: 1000,
  upload: 1200,
  pr_reveal: 500,
  hold: 2500,
}

const PHASE_ORDER: HeroPhase[] = [
  "workspace",
  "typing",
  "output",
  "capture",
  "upload",
  "pr_reveal",
  "hold",
]

function getNextPhase(phase: HeroPhase): HeroPhase {
  const idx = PHASE_ORDER.indexOf(phase)
  if (idx === PHASE_ORDER.length - 1) return "workspace"
  return PHASE_ORDER[idx + 1]
}

// Build terminal lines for current phase
function buildLines(phase: HeroPhase, onTypingComplete: () => void): TerminalLine[] {
  const phaseIdx = PHASE_ORDER.indexOf(phase)
  const lines: TerminalLine[] = []

  // Prompt line appears during typing+
  if (phaseIdx >= 1) {
    lines.push({
      type: "prompt",
      text: "/pre-post",
      visible: true,
      typing: phase === "typing",
      onTypingComplete: phase === "typing" ? onTypingComplete : undefined,
    })
  }

  // Output lines appear during output+
  if (phaseIdx >= 2) {
    lines.push(
      { type: "output", text: "Detecting routes... found /", visible: true },
      { type: "output", text: "Capturing / (desktop)...", visible: true }
    )
  }

  // Success line during upload+
  if (phaseIdx >= 4) {
    lines.push({ type: "success", text: "Added to PR #42", visible: true })
  }

  return lines
}

interface IterativeHeroProps {
  className?: string
}

export function IterativeHero({ className }: IterativeHeroProps) {
  const [phase, setPhase] = useState<HeroPhase>("workspace")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const advancePhase = useCallback(() => {
    setPhase((prev) => getNextPhase(prev))
  }, [])

  // Timer-driven transitions
  useEffect(() => {
    const duration = PHASE_DURATIONS[phase]
    if (duration === 0) return

    timerRef.current = setTimeout(advancePhase, duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [phase, advancePhase])

  const onTypingComplete = useCallback(() => {
    timerRef.current = setTimeout(advancePhase, 200)
  }, [advancePhase])

  const lines = buildLines(phase, onTypingComplete)
  const phaseIdx = PHASE_ORDER.indexOf(phase)

  // Derived state
  const showTerminal = phaseIdx >= 0 && phaseIdx <= 4 // workspace through upload
  const showCaptures = phaseIdx >= 3 && phaseIdx <= 4 // capture and upload
  const showBrowsers = phaseIdx <= 4 // workspace through upload
  const showPR = phaseIdx >= 5 // pr_reveal and hold
  const browserDimmed = phaseIdx >= 2 && phaseIdx <= 4 // output through upload
  const capturePosition = phase === "capture" ? "browser" : "center"

  return (
    <div className={cn("mx-auto w-full max-w-[540px] px-3 sm:px-4", className)}>
      <div className="relative" style={{ aspectRatio: "16 / 10" }}>
        {/* Workspace layer */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: showBrowsers ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Browser A — top-left */}
          <motion.div
            className="absolute"
            style={{ top: "2%", left: "2%", width: "52%" }}
            animate={{ opacity: browserDimmed ? 0.5 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Browser variant="A" url="site.com" />
          </motion.div>

          {/* Browser B — top-right, slightly offset down */}
          <motion.div
            className="absolute"
            style={{ top: "6%", left: "40%", width: "52%" }}
            animate={{ opacity: browserDimmed ? 0.5 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Browser variant="B" url="localhost" />
          </motion.div>

          {/* Terminal — bottom-right, overlapping browsers */}
          <AnimatePresence>
            {showTerminal && (
              <motion.div
                className="absolute z-10"
                style={{ bottom: "2%", right: "2%" }}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{
                  type: "spring",
                  bounce: 0.3,
                  duration: 0.5,
                }}
              >
                <Terminal lines={lines} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Capture overlays */}
          <AnimatePresence>
            {showCaptures && (
              <>
                <Capture
                  variant="A"
                  position={capturePosition}
                  style={{ zIndex: 20 }}
                />
                <Capture
                  variant="B"
                  position={capturePosition}
                  delay={0.05}
                  style={{ zIndex: 21 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Upload spinner */}
          <AnimatePresence>
            {phase === "upload" && <CenteredUploadSpinner />}
          </AnimatePresence>
        </motion.div>

        {/* PR layer — fades in on top */}
        <AnimatePresence>
          {showPR && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-full max-w-[460px]">
                <PullRequest
                  tab="preview"
                  markdown={DEFAULT_MARKDOWN}
                  interactive={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Capture component — screenshot with flash
interface CaptureProps {
  variant: "A" | "B"
  position: "browser" | "center"
  delay?: number
  style?: React.CSSProperties
}

function Capture({ variant, position, delay = 0, style }: CaptureProps) {
  const isA = variant === "A"
  const controls = useAnimationControls()
  const prevPosition = useRef(position)

  // Over the corresponding browser
  const browserPosition = {
    left: isA ? "2%" : "40%",
    top: isA ? "2%" : "6%",
    x: "0%",
    y: "0%",
    scale: 1.02,
    rotate: isA ? -1 : 1,
  }

  // Float to center
  const centerPosition = {
    left: "50%",
    top: "45%",
    x: isA ? "-60%" : "-40%",
    y: isA ? "-50%" : "-55%",
    scale: 0.55,
    rotate: isA ? -5 : 3,
  }

  const positions = { browser: browserPosition, center: centerPosition }
  const showFlash = position === "browser"

  useEffect(() => {
    const isResetting = prevPosition.current === "center" && position === "browser"
    prevPosition.current = position

    if (isResetting) {
      controls.set({ ...positions[position] })
    } else {
      controls.start({ ...positions[position] })
    }
  }, [position, controls])

  return (
    <motion.div
      className="absolute"
      style={{ ...style, width: "52%", willChange: "transform" }}
      initial={{ ...browserPosition, opacity: 1 }}
      animate={controls}
      exit={{ opacity: 0, scale: 0 }}
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

function CenteredUploadSpinner() {
  return (
    <motion.div
      className="absolute z-[30]"
      style={{ left: "50%", top: "45%", transform: "translate(-50%, -50%)" }}
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
          stroke="#a3a3a3"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="75"
          initial={{ strokeDashoffset: 75 }}
          animate={{ strokeDashoffset: [56, 19, 56], rotate: [0, 360, 720] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </motion.div>
  )
}

// Standalone auto-playing wrapper
export function AutoPlayIterativeHero() {
  return <IterativeHero />
}
