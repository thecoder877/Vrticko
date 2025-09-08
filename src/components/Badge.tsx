import React from 'react'

interface BadgeProps {
  count: number
  max?: number
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ count, max = 99, className = '' }) => {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${className}`}>
      {displayCount}
    </span>
  )
}

export default Badge
