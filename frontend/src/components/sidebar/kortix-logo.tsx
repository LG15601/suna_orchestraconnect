"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function KortixLogo() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center justify-center flex-shrink-0">
      <div className="flex items-center">
        <span className="text-foreground font-semibold">Orchestra</span>
        <span className="text-primary font-semibold">Connect</span>
      </div>
    </div>
  )
}