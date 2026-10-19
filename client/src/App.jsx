import { useState, useEffect } from 'react'

function App() {
  const [healthStatus, setHealthStatus] = useState('Checking backend...')
  const [isHealthy, setIsHealthy] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setHealthStatus(data.message || 'Server is healthy')
        setIsHealthy(true)
      })
      .catch(() => {
        setHealthStatus('Backend not reachable (run server on port 4000)')
        setIsHealthy(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-2">
          <span className="text-3xl">👗</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          OutWear
        </h1>
        <p className="text-slate-400 text-sm">
          Smart Wardrobe Management Web Application
        </p>

        <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800 text-left space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Client:</span>
            <span className="text-emerald-400 font-semibold">React + Vite + Tailwind CSS</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">API Health:</span>
            <span className={`font-semibold ${isHealthy ? 'text-emerald-400' : isHealthy === false ? 'text-amber-400' : 'text-slate-400'}`}>
              {healthStatus}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Scaffold completed. Ready for next phase.
        </p>
      </div>
    </div>
  )
}

export default App
