export default function ProgressBar({ percent, color = 'var(--green)', trackStyle }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="bar" style={trackStyle}>
      <i style={{ width: `${clamped}%`, background: color }} />
    </div>
  )
}

/** Couleur de maîtrise : rouge <50%, orange 50-75%, vert >75%. */
export function masteryColor(percent) {
  if (percent == null) return 'var(--line)'
  if (percent < 50) return 'var(--red)'
  if (percent < 75) return 'var(--orange)'
  return 'var(--green)'
}
