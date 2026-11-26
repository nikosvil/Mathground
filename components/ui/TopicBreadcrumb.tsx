'use client'

interface TopicBreadcrumbProps {
  unit: string
  topic: string
}

export function TopicBreadcrumb({ unit, topic }: TopicBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-400">
      <span>{unit}</span>
      <span className="text-gray-600">/</span>
      <span className="font-medium text-white">{topic}</span>
    </nav>
  )
}
