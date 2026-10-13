import { useEffect, useState } from 'react'

/** 現在時刻を `intervalMs` ごとに更新して返す（端末の時刻）。 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
