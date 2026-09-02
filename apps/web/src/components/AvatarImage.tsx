'use client'

import { useState } from 'react'

interface AvatarImageProps {
  src: string
  fallbackChar: string
  size?: number
  className?: string
}

/**
 * Avatar image with onError fallback to letter avatar.
 * When the image fails to load (e.g. Google avatar CDN blocked in China),
 * it automatically falls back to a CSS letter avatar.
 */
export default function AvatarImage({ src, fallbackChar, size, className }: AvatarImageProps) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div
        className={`rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold border border-border ${className ?? ''}`}
        style={size ? { width: size, height: size } : undefined}
      >
        {fallbackChar.toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setError(true)}
    />
  )
}
