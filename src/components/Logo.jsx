// Logo Suited V2 : pique doré en dégradé sur tuile marine, carte en second plan, reflet.
// Le dégradé #gGold est défini dans IconSprite (toujours monté dans App).

export default function Logo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Suited">
      <rect x="2" y="2" width="36" height="36" rx="12" fill="#17304c" />
      <rect x="2" y="2" width="36" height="36" rx="12" fill="none" stroke="rgba(246,198,108,.35)" strokeWidth="1" />
      <rect x="11" y="8.5" width="15" height="21" rx="3.5" fill="#f3ead9" opacity=".16" transform="rotate(-14 18 19)" />
      <path
        d="M20 9.5 C14.6 16.4 11 19 11 23.2 a4.6 4.6 0 0 0 6.8 2 a4.6 4.6 0 0 0 6.8 -2 c0 -4.2 -3.4 -6.9 -4.6 -13.7z M18.3 26 L16.7 31.5 h6.6 L21.7 26z"
        fill="url(#gGold)"
      />
      <path d="M20 10.6 C16 15.8 13 18 12.4 21.4 c1.6 -3.2 4 -5.4 7.6 -9.1z" fill="#fff" opacity=".45" />
    </svg>
  )
}
