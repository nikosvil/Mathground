import { describe, it, expect } from 'vitest'
import { getCourse, getUnit, getTopic, getParadigm } from '@/lib/courses/registry'

describe('Course Registry', () => {
  it('getCourse("calc2") returns a course with 4 units', () => {
    const c = getCourse('calc2')
    expect(c).toBeDefined()
    expect(c?.units).toHaveLength(4)
  })

  it('getCourse with unknown id returns undefined', () => {
    expect(getCourse('does-not-exist')).toBeUndefined()
  })

  it('getTopic("calc2","applications","volumes-disks-washers") exists', () => {
    expect(getTopic('calc2', 'applications', 'volumes-disks-washers')).toBeDefined()
  })

  it('getTopic for unknown id returns undefined', () => {
    expect(getTopic('calc2', 'applications', 'does-not-exist')).toBeUndefined()
  })

  it('getUnit("calc2","applications") returns the applications unit', () => {
    const u = getUnit('calc2', 'applications')
    expect(u).toBeDefined()
    expect(u?.id).toBe('applications')
  })

  it('getParadigm returns a paradigm by id', () => {
    const topic = getTopic('calc2', 'applications', 'volumes-disks-washers')
    expect(topic).toBeDefined()
    const p = getParadigm('calc2', 'applications', 'volumes-disks-washers', topic!.defaultParadigm)
    expect(p).toBeDefined()
  })

  it('every topic has at least 1 paradigm', () => {
    const course = getCourse('calc2')!
    for (const unit of course.units) {
      for (const topic of unit.topics) {
        expect(topic.paradigms.length, `${unit.id}/${topic.id} has no paradigms`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('every paradigm sliders are within [min, max]', () => {
    const course = getCourse('calc2')!
    for (const unit of course.units) {
      for (const topic of unit.topics) {
        for (const p of topic.paradigms) {
          for (const s of p.sliders) {
            expect(
              s.default,
              `${unit.id}/${topic.id}/${p.id} slider ${s.id} default out of range`
            ).toBeGreaterThanOrEqual(s.min)
            expect(
              s.default,
              `${unit.id}/${topic.id}/${p.id} slider ${s.id} default out of range`
            ).toBeLessThanOrEqual(s.max)
          }
        }
      }
    }
  })

  it('every topic defaultParadigm references an existing paradigm id', () => {
    const course = getCourse('calc2')!
    for (const unit of course.units) {
      for (const topic of unit.topics) {
        expect(
          topic.paradigms.some((p) => p.id === topic.defaultParadigm),
          `${unit.id}/${topic.id} defaultParadigm "${topic.defaultParadigm}" not found`
        ).toBe(true)
      }
    }
  })

  it('course has 4 units with correct ids', () => {
    const course = getCourse('calc2')!
    const ids = course.units.map((u) => u.id)
    expect(ids).toContain('applications')
    expect(ids).toContain('techniques')
    expect(ids).toContain('series')
    expect(ids).toContain('parametric-polar')
  })
})
