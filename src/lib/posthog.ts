import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com'

export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.warn('PostHog key not set — analytics disabled')
    return
  }
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: '',
    },
  })
}

export { posthog }
