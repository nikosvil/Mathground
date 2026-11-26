import type { Course } from '@/lib/types'
import { applicationsUnit } from './units/applications'
import { techniquesUnit } from './units/techniques'
import { seriesUnit } from './units/series'
import { parametricPolarUnit } from './units/parametric-polar'

export const calc2Course: Course = {
  id: 'calc2',
  title: 'Calculus II',
  description:
    'Integration techniques, applications, infinite series, and parametric & polar coordinates — based on Thomas\' Calculus 11th Edition.',
  units: [applicationsUnit, techniquesUnit, seriesUnit, parametricPolarUnit],
}
