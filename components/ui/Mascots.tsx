'use client'

import React from 'react'

interface MascotProps {
  className?: string
  size?: number
}

// All cartoon illustration mascots and confetti characters are silenced to align with the Awesomic minimal monochrome theme.
export function FlowerMascot({ className = '', size = 80 }: MascotProps) {
  return null
}

export function BlobMascot({ className = '', size = 80 }: MascotProps) {
  return null
}

export function TriangleMascot({ className = '', size = 80 }: MascotProps) {
  return null
}

export function CatMascot({ className = '', size = 80 }: MascotProps) {
  return null
}

export function ConfettiCluster({ className = '' }: { className?: string }) {
  return null
}

export function ConfettiParticle({ type, color, size = 12, className = '' }: { type: 'star' | 'circle' | 'sparkle' | 'ring' | 'heart' | 'leaf'; color: string; size?: number; className?: string }) {
  return null
}
