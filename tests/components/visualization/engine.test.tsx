import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as THREE from 'three'

// Minimal R3F mock so tests run in jsdom
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useThree: vi.fn().mockReturnValue({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
  }),
  useFrame: vi.fn(),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
  Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Grid: () => null,
  Line: () => null,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/lib/math/geometry/parametric', () => ({
  parametricCurvePoints: () => [{ x: 0, y: 0 }, { x: 1, y: 1 }],
}))

import { StepController } from '@/components/visualization/StepController'
import { CameraPresets } from '@/components/visualization/CameraPresets'

describe('StepController', () => {
  it('renders step count and navigation buttons', () => {
    render(<StepController currentStep={1} totalSteps={5} onNext={vi.fn()} onPrev={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByText(/step 1 of 5/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /next/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /prev/i })).toBeDefined()
  })

  it('calls onNext when Next clicked', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<StepController currentStep={1} totalSteps={5} onNext={onNext} onPrev={vi.fn()} onReset={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('disables Prev on step 1', () => {
    render(<StepController currentStep={1} totalSteps={5} onNext={vi.fn()} onPrev={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByRole('button', { name: /prev/i })).toHaveProperty('disabled', true)
  })

  it('disables Next on last step', () => {
    render(<StepController currentStep={5} totalSteps={5} onNext={vi.fn()} onPrev={vi.fn()} onReset={vi.fn()} />)
    expect(screen.getByRole('button', { name: /next/i })).toHaveProperty('disabled', true)
  })
})

describe('ParametricCurveScene geometry disposal', () => {
  it('disposes geometry when component unmounts', async () => {
    const disposeSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose')
    const { ParametricCurveScene } = await import('@/components/units/unit4/ParametricCurveScene')
    const { unmount } = render(
      <ParametricCurveScene xFn="cos(t)" yFn="sin(t)" tMin={0} tMax={6.28} />
    )
    unmount()
    expect(disposeSpy).toHaveBeenCalled()
    disposeSpy.mockRestore()
  })
})

describe('CameraPresets', () => {
  it('renders preset buttons', () => {
    render(<CameraPresets onSelect={vi.fn()} current="3d" />)
    expect(screen.getByRole('button', { name: /3d/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /side/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /top/i })).toBeDefined()
  })

  it('calls onSelect with preset name', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<CameraPresets onSelect={onSelect} current="3d" />)
    await user.click(screen.getByRole('button', { name: /side/i }))
    expect(onSelect).toHaveBeenCalledWith('side')
  })
})
