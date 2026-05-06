import { useEffect, useRef } from 'react'
import { useBanking } from '@/context/BankingContext'
import type { FXRate } from '@/types'

/** Simulates live FX rate ticks every 5 seconds with minor ±0.02 variance */
export function useFXRates() {
  const { fxRates, setFXRates } = useBanking()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const updated = fxRates.map((rate): FXRate => {
        const delta  = (Math.random() - 0.5) * 0.04
        const newBid = parseFloat((rate.bid + delta).toFixed(4))
        const newAsk = parseFloat((rate.ask + delta).toFixed(4))
        return {
          ...rate,
          bid: newBid,
          ask: newAsk,
          change24h: parseFloat((rate.change24h + (Math.random() - 0.5) * 0.01).toFixed(4)),
          lastUpdated: new Date().toISOString(),
        }
      })
      setFXRates(updated)
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fxRates, setFXRates])

  return fxRates
}
