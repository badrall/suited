// Sprite SVG unique (icônes sobres, sans emoji) + composant <Icon name="..."/>.

export function IconSprite() {
  return (
    <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">
      <symbol id="i-home" viewBox="0 0 24 24"><path d="M12 3 2 12h3v8h6v-5h2v5h6v-8h3z" /></symbol>
      <symbol id="i-target" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" /></symbol>
      <symbol id="i-cards" viewBox="0 0 24 24"><path d="M7 3h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm12 4 1.8.5a2 2 0 0 1 1.4 2.4L20 19a2 2 0 0 1-1 1.3V7z" /></symbol>
      <symbol id="i-book" viewBox="0 0 24 24"><path d="M4 4a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 21.5V4zm2 13h12V4H6v13z" /></symbol>
      <symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V10h3v10H4zm6.5 0V4h3v16h-3zM17 20v-7h3v7h-3z" /></symbol>
      <symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 2s5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.5-3 1.5-4.5C9 8 10 9 11 9c-.5-2.5 0-5 1-7z" /></symbol>
      <symbol id="i-star" viewBox="0 0 24 24"><path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 16.9 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" /></symbol>
      <symbol id="i-brain" viewBox="0 0 24 24"><path d="M9 3a3 3 0 0 0-3 3 3.5 3.5 0 0 0-2 3.2c0 1 .4 1.9 1.1 2.5A3.6 3.6 0 0 0 6 17a3 3 0 0 0 3 3c.8 0 1.5-.3 2-.8V3.8c-.5-.5-1.2-.8-2-.8zm6 0c-.8 0-1.5.3-2 .8v15.4c.5.5 1.2.8 2 .8a3 3 0 0 0 3-3 3.6 3.6 0 0 0 .9-5.3c.7-.6 1.1-1.5 1.1-2.5A3.5 3.5 0 0 0 18 6a3 3 0 0 0-3-3z" /></symbol>
      <symbol id="i-search" viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.9 14.3l5 5 1.4-1.4-5-5A8 8 0 0 0 10 2zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" /></symbol>
      <symbol id="i-bulb" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2zm-2 18h4v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1z" /></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5 1.4-1.4L9 14.2 18.6 4.6z" /></symbol>
      <symbol id="i-cross" viewBox="0 0 24 24"><path d="m12 10.6 5.3-5.3 1.4 1.4L13.4 12l5.3 5.3-1.4 1.4L12 13.4l-5.3 5.3-1.4-1.4L10.6 12 5.3 6.7l1.4-1.4z" /></symbol>
      <symbol id="i-spade" viewBox="0 0 24 24"><path d="M12 2C9 6.5 3 10 3 14.5A5 5 0 0 0 12 17.5 5 5 0 0 0 21 14.5C21 10 15 6.5 12 2Zm0 15.2c-.6 2-2 3.4-4 4.3h8c-2-.9-3.4-2.3-4-4.3Z" /></symbol>
      <symbol id="i-lock" viewBox="0 0 24 24"><path d="M6 10V8a6 6 0 0 1 12 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h8V8a4 4 0 0 0-8 0z" /></symbol>
    </svg>
  )
}

export function Icon({ name, className = 'ico', style }) {
  return (
    <svg className={className} style={style} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  )
}
