export default function OnboardingIntro({ onStart, onSkip }) {
  return (
    <div className="screen onboarding-intro">
      <div className="hero">
        <div className="suits">♠♥</div>
        <h3>Fais le point en 5 min</h3>
        <p>20 questions pour connaître ton point de départ et tes chantiers prioritaires.</p>
        <button type="button" className="btn" onClick={onStart}>
          COMMENCER
        </button>
      </div>
      <span className="link" role="button" tabIndex={0} onClick={onSkip} onKeyDown={(e) => e.key === 'Enter' && onSkip()}>
        Passer, je débute
      </span>
    </div>
  )
}
