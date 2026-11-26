'use client'

type Preset = '3d' | 'side' | 'top'

interface CameraPresetsProps {
  onSelect: (preset: Preset) => void
  current: Preset
}

const PRESETS: { label: string; value: Preset }[] = [
  { label: '3D', value: '3d' },
  { label: 'Side', value: 'side' },
  { label: 'Top', value: 'top' },
]

export function CameraPresets({ onSelect, current }: CameraPresetsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-900/80 p-1 backdrop-blur">
      {PRESETS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          aria-label={label}
          className={`rounded px-3 py-1 text-sm font-medium transition ${
            current === value
              ? 'bg-white/20 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
