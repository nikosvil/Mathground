import type { Course, Unit, Topic, Paradigm } from '@/lib/types'
import { calc2Course } from './calc2/index'

const registry: Course[] = [calc2Course]

export function getCourse(id: string): Course | undefined {
  return registry.find((c) => c.id === id)
}

export function getUnit(courseId: string, unitId: string): Unit | undefined {
  return getCourse(courseId)?.units.find((u) => u.id === unitId)
}

export function getTopic(courseId: string, unitId: string, topicId: string): Topic | undefined {
  return getUnit(courseId, unitId)?.topics.find((t) => t.id === topicId)
}

export function getParadigm(
  courseId: string,
  unitId: string,
  topicId: string,
  paradigmId: string
): Paradigm | undefined {
  return getTopic(courseId, unitId, topicId)?.paradigms.find((p) => p.id === paradigmId)
}
