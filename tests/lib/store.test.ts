import { describe, it, expect, beforeEach } from 'vitest'
import { useMathgroundStore } from '@/lib/store'

// Reset store to a clean slate before each test
beforeEach(() => {
  useMathgroundStore.setState({
    topicTitle: null,
    paradigmLabel: null,
    sliderValues: {},
  })
})

describe('useMathgroundStore — tutor context injection', () => {
  it('topicTitle is null by default', () => {
    expect(useMathgroundStore.getState().topicTitle).toBeNull()
  })

  it('paradigmLabel is null by default', () => {
    expect(useMathgroundStore.getState().paradigmLabel).toBeNull()
  })

  it('setTutorContext sets topicTitle and paradigmLabel', () => {
    useMathgroundStore.getState().setTutorContext('Trig Substitution', 'Case a²−x²')
    const state = useMathgroundStore.getState()
    expect(state.topicTitle).toBe('Trig Substitution')
    expect(state.paradigmLabel).toBe('Case a²−x²')
  })

  it('setTutorContext can be called multiple times and overwrites', () => {
    useMathgroundStore.getState().setTutorContext('Topic A', 'Paradigm 1')
    useMathgroundStore.getState().setTutorContext('Topic B', 'Paradigm 2')
    const state = useMathgroundStore.getState()
    expect(state.topicTitle).toBe('Topic B')
    expect(state.paradigmLabel).toBe('Paradigm 2')
  })
})
