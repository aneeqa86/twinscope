import { useEffect, useState } from 'react'
import logo from '@/assets/logo.svg'

const MESSAGES = [
  'Initializing 3D engine...',
  'Loading world terrain...',
  'Streaming OSM buildings...',
  'Calibrating digital twin...',
]

const LoadingScreen = ({ visible }) => {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <div className="absolute inset-0 z-[100] bg-[#0a1628] flex flex-col items-center justify-center gap-8">
      <img src={logo} alt="TwinScope" className="h-12 opacity-90" />
      <div className="flex flex-col items-center gap-3">
        {/* Animated bar */}
        <div className="w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full animate-pulse w-2/3" />
        </div>
        <p className="text-xs text-slate-500 font-mono tracking-wider">
          {MESSAGES[msgIndex]}
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen