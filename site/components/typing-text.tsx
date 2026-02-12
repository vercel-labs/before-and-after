"use client"

import { useState, useEffect, useRef } from "react"

interface TypingTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
}

export function TypingText({ text, speed = 40, onComplete, className }: TypingTextProps) {
  const [displayed, setDisplayed] = useState("")
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setDisplayed("")
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        onCompleteRef.current?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">_</span>
    </span>
  )
}
