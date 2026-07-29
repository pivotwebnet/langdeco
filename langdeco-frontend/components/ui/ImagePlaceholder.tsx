import * as Icon from '@/components/ui/Icon'

export function ImagePlaceholder({ size = 22 }: { size?: number }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'grid', placeItems: 'center',
        color: 'var(--ink-mute)', opacity: 0.5,
      }}
    >
      <Icon.ImageOff width={size} height={size} strokeWidth={0.9} />
    </div>
  )
}
