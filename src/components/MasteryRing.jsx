export default function MasteryRing({ percent }) {
  const value = percent ?? 0
  return (
    <div
      className="ring"
      style={{ background: `conic-gradient(var(--green) 0 ${value}%, var(--line) ${value}% 100%)` }}
    >
      <b>{percent == null ? '—' : `${value}%`}</b>
    </div>
  )
}
