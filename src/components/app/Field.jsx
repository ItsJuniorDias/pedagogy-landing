/**
 * Field — a labelled input used across auth + profile forms.
 * Keeps focus rings, spacing, and error styling consistent everywhere.
 */
export function Field({ label, hint, error, id, className = '', children, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <label htmlFor={inputId} className={'block ' + className}>
      {label && (
        <span className="block mb-1.5 text-[13px] font-extrabold uppercase tracking-wide text-inksoft">
          {label}
        </span>
      )}
      {children ? (
        children
      ) : (
        <input
          id={inputId}
          className={
            'w-full rounded-2xl border-2 bg-cream/40 px-4 py-3 font-bold text-ink placeholder:text-inksoft/60 ' +
            'transition focus:outline-none focus:bg-white ' +
            (error
              ? 'border-bubblegum focus:border-bubblegum'
              : 'border-black/5 focus:border-grape')
          }
          {...props}
        />
      )}
      {error ? (
        <span className="mt-1.5 block text-sm font-bold text-bubbled">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm font-semibold text-inksoft">{hint}</span>
      ) : null}
    </label>
  )
}

/** Social sign-in buttons (visual only in the mock). */
export function SocialButtons({ onClick }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onClick}
        className="btn3d b-white ring-1 ring-black/5 px-4 py-3 text-[15px]"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-2.6-11.3-6.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
        Google
      </button>
      <button
        type="button"
        onClick={onClick}
        className="btn3d b-dark px-4 py-3 text-[15px]"
      >
        <svg width="16" height="18" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256.6 93.9c30.3-36 27.6-68.7 26.7-80.5-26.8 1.5-57.8 18.2-75.5 38.8-19.5 22.1-31 49.4-28.5 80 28.9 2.2 55.3-12.6 77.3-38.3z" />
        </svg>
        Apple
      </button>
    </div>
  )
}
