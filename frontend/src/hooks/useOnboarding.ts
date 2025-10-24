import { useCallback, useEffect, useMemo, useState } from 'react'

const LS_KEY = 'sunsettings.onboardingDone'

export type OnboardingPageId =
  | 'welcome'
  | 'what_is_this'
  | 'how_to_score'
  | 'how_to_post'
  | 'your_account'
  | 'lets_go'

export function useOnboarding(initiallyOpen = false) {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    const done = typeof window !== 'undefined' && localStorage.getItem(LS_KEY) === '1'
    if (!done && initiallyOpen) setIsOpen(true)
  }, [initiallyOpen])

  const pages: OnboardingPageId[] = useMemo(
    () => ['welcome','what_is_this','how_to_score','how_to_post','your_account','lets_go'],
    []
  )

  const total = pages.length

  const next = useCallback(() => setPageIndex(i => Math.min(i + 1, total - 1)), [total])
  const prev = useCallback(() => setPageIndex(i => Math.max(i - 1, 0)), [])
  const goTo = useCallback((idx: number) => setPageIndex(Math.min(Math.max(idx, 0), total - 1)), [total])

  const complete = useCallback(() => {
    try { localStorage.setItem(LS_KEY, '1') } catch {}
    setIsOpen(false)
  }, [])

  const skipAll = useCallback(() => complete(), [complete])

  return { isOpen, setIsOpen, pageIndex, pages, total, next, prev, goTo, complete, skipAll }
}