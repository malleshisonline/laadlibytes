import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Pages a horizontally scrolling track one visible width at a time, for carousels with arrows and dots.
 * Attach `trackRef` to the scrolling element. Pass `resetKey` (e.g. the loading status) so the page count is
 * measured again once the real items replace the placeholders.
 */
export function useScrollPager(resetKey) {
  const trackRef = useRef(null)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)

  const syncPagesWithScroll = useCallback(() => {
    const track = trackRef.current
    // A track with no width yet (mid-layout or hidden) would divide by zero and make pageCount Infinity.
    if (!track || track.clientWidth === 0) return

    const maxScroll = track.scrollWidth - track.clientWidth
    const count = maxScroll <= 2 ? 1 : Math.ceil((maxScroll - 2) / track.clientWidth) + 1
    const page = track.scrollLeft >= maxScroll - 2 ? count - 1 : Math.round(track.scrollLeft / track.clientWidth)

    setPageCount(count)
    setCurrentPage(Math.min(page, count - 1))
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    syncPagesWithScroll()
    const resizeObserver = new ResizeObserver(syncPagesWithScroll)
    resizeObserver.observe(track)
    track.addEventListener('scroll', syncPagesWithScroll, { passive: true })

    return () => {
      resizeObserver.disconnect()
      track.removeEventListener('scroll', syncPagesWithScroll)
    }
  }, [resetKey, syncPagesWithScroll])

  const scrollToPage = useCallback((page) => {
    const track = trackRef.current
    if (!track) return
    const maxScroll = track.scrollWidth - track.clientWidth
    track.scrollTo({ left: Math.min(page * track.clientWidth, maxScroll), behavior: 'smooth' })
  }, [])

  return { trackRef, pageCount, currentPage, scrollToPage }
}

export default useScrollPager