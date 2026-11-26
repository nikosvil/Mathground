import { notFound } from 'next/navigation'
import { getCourse, getTopic, getUnit } from '@/lib/courses/registry'
import { TopicPageClient } from './TopicPageClient'

interface TopicPageProps {
  params: Promise<{ courseId: string; unitId: string; topicId: string }>
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { courseId, unitId, topicId } = await params

  const course = getCourse(courseId)
  if (!course) notFound()

  const unit = getUnit(courseId, unitId)
  if (!unit) notFound()

  const topic = getTopic(courseId, unitId, topicId)
  if (!topic) notFound()

  return (
    <TopicPageClient
      course={course}
      unit={unit}
      topic={topic}
    />
  )
}
