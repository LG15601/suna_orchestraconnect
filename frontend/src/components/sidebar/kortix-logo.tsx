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
      {mounted && (
        <div className="flex items-center">
          {theme === 'dark' ? (
            <Image
              src="/logo-orchestra-white.jpeg"
              alt="Orchestra Connect Logo"
              width={100}
              height={35}
              className="h-7 w-auto"
            />
          ) : (
            <Image
              src="/logo-orchestra.jpeg"
              alt="Orchestra Connect Logo"
              width={100}
              height={35}
              className="h-7 w-auto"
            />
          )}
        </div>
      )}
    </div>
  )
}