export type CameraPreset = '3d' | 'side' | 'top'

/** Camera distance at which a sphere of `radius` fills the view with `margin` headroom. */
export function fitDistance(radius: number, fovDeg: number, aspect: number, margin: number): number {
  const vHalf = (fovDeg * Math.PI) / 360
  const hHalf = Math.atan(Math.tan(vHalf) * aspect)
  return (radius * margin) / Math.sin(Math.min(vHalf, hHalf))
}

/** Refit only on large size changes so dragging a slider doesn't yank the camera around. */
export function needsRefit(fittedRadius: number, radius: number): boolean {
  const ratio = radius / fittedRadius
  return ratio > 1.35 || ratio < 0.6
}
