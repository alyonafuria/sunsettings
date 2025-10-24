import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboarding } from '../../hooks/useOnboarding'
import { useMapContext } from '../../contexts/MapContext'

type Props = {
  openByDefault?: boolean
  onOpenUpload?: () => void // optional action to open upload modal
}

const modalBg = 'fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm'
const card = 'w-full max-w-[640px] rounded-2xl bg-white p-6 md:p-8 shadow-2xl'
const h1 = 'text-2xl md:text-3xl font-semibold'
const p = 'text-sm md:text-base text-gray-600'
const btn = 'px-4 py-2 rounded-xl transition active:scale-[0.98]'
const primary = `${btn} bg-black text-white`
const secondary = `${btn} bg-gray-100`
const ghost = `${btn} bg-transparent text-gray-500`

export default function OnboardingModal({ openByDefault = true, onOpenUpload }: Props) {
  const tour = useOnboarding(openByDefault)
  const { openMap } = useMapContext()

  React.useEffect(() => {
    const handler = () => {
      // Open the tour from anywhere by dispatching a window event
      tour.goTo(0)
      tour.setIsOpen(true)
    }

    window.addEventListener('open-onboarding', handler)
    return () => window.removeEventListener('open-onboarding', handler)
  }, [tour])

  const steps = [
    {
      key: 'welcome',
      title: 'Hi!',
      body: 'A short tour of SunSettings. We will show you where to check the sunset, how to post photos, and where your profile is.',
      action: null as null | (() => void),
      actionLabel: null as null | string,
    },
    {
      key: 'what_is_this',
      title: 'What is this app?',
      body: 'SunSettings is a community for sky lovers. We measure the "beauty of the sunset", share photos, and mark locations.',
      action: null,
      actionLabel: null,
    },
    {
      key: 'how_to_score',
      title: 'How to calculate the sunset quality?',
      body: 'We analyze the weather and issue the probability of a "luxurious" window (golden/sunset/blue hour). Open the map to see the best time.',
      action: () => openMap?.(),
      actionLabel: 'Open map',
    },
    {
      key: 'how_to_post',
      title: 'How to post a photo?',
      body: 'Take a snapshot and upload it directly from the map at the selected point. We will attach the coordinates and time.',
      action: onOpenUpload || null,
      actionLabel: onOpenUpload ? 'Open upload' : null,
    },
    {
      key: 'your_account',
      title: 'Your account',
      body: 'Connect your wallet (if needed), set your name/avatar, and view your posts and badges.',
      action: null,
      actionLabel: null,
    },
    {
      key: 'lets_go',
      title: 'Let’s go!',
      body: 'You know the basics. You can always return to the tour later from the menu.',
      action: null,
      actionLabel: null,
    },
  ] as const

  const i = tour.pageIndex
  const isFirst = i === 0
  const isLast = i === steps.length - 1
  const step = steps[i]

  return (
    <AnimatePresence>
      {tour.isOpen && (
        <motion.div
          className={modalBg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={card}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Onboarding"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className={h1}>{step.title}</h1>
                <p className={p}>{step.body}</p>
              </div>
              <button className={ghost} onClick={tour.skipAll} aria-label="Skip">Skip</button>
            </div>

            {/* Progress dots */}
            <div className="mt-4 flex items-center gap-2">
              {steps.map((s, idx) => (
                <button
                  key={s.key}
                  onClick={() => tour.goTo(idx)}
                  className={`h-2.5 rounded-full transition ${idx === i ? 'w-6 bg-black' : 'w-2.5 bg-gray-300'}`}
                  aria-label={`Перейти к шагу ${idx + 1}`}
                />
              ))}
            </div>

            {/* Action area */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={tour.prev} disabled={isFirst} className={secondary} aria-disabled={isFirst}>
                  Back
                </button>
                {!isLast ? (
                  <button onClick={tour.next} className={primary}>Next</button>
                ) : (
                  <button onClick={tour.complete} className={primary}>Let’s go!</button>
                )}
              </div>

              {step.action && step.actionLabel && (
                <button onClick={step.action} className={secondary}>{step.actionLabel}</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}