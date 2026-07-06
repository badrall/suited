// Rappel quotidien local (Notifications API), sans backend.
// LIMITE IMPORTANTE : sans serveur de push, on ne peut pas réveiller l'app quand elle est fermée.
// Ce rappel ne se déclenche que si un onglet Suited reste ouvert (ou en arrière-plan) au moment
// voulu — ce n'est pas une vraie notification push, juste un "meilleur effort" client uniquement.

const REMINDER_HOUR = 19

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.requestPermission()
}

function msUntilNextReminder() {
  const now = new Date()
  const next = new Date(now)
  next.setHours(REMINDER_HOUR, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

let timerId = null

/** Planifie (ou replanifie) le rappel de 19h tant que la permission est accordée. */
export function scheduleDailyReminder() {
  if (getNotificationPermission() !== 'granted') return
  if (timerId) clearTimeout(timerId)
  const fire = () => {
    new Notification('Suited', { body: 'Ta session de 3 min t’attend 🔥', icon: '/icons/icon-192.png' })
    timerId = setTimeout(fire, 24 * 60 * 60 * 1000)
  }
  timerId = setTimeout(fire, msUntilNextReminder())
}
