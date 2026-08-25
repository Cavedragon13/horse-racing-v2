import { useEffect, useState } from 'react'

const TEASER_FIRST_DELAY_MS = 14000
const TEASER_REPEAT_DELAY_MS = 45000
const IDLE_EVENTS = ['pointerdown', 'keydown']

// Shows the "How to Play" pill after a stretch of inactivity on the setup
// screen, and again periodically if the player dismisses it without reading.
export function useHowToPlayTeaser(enabled) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined

    let timer = setTimeout(() => setVisible(true), TEASER_FIRST_DELAY_MS)

    const rearm = (delay) => {
      clearTimeout(timer)
      timer = setTimeout(() => setVisible(true), delay)
    }

    const onActivity = () => {
      setVisible(false)
      rearm(TEASER_REPEAT_DELAY_MS)
    }

    IDLE_EVENTS.forEach(evt => window.addEventListener(evt, onActivity))
    return () => {
      clearTimeout(timer)
      IDLE_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity))
    }
  }, [enabled])

  return [visible, setVisible]
}
