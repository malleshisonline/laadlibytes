import { useEffect } from 'react'

import { APP_SETTINGS } from '../constants/appSettings.js'

/** Sets the browser tab title to "<title> | Laadli Bytes" while the page is shown, and restores it after. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [title])
}

export default useDocumentTitle