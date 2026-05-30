'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthUI() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-neutral-900 bg-neutral-900/10 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-6 h-6 bg-white rounded-sm mb-4" />
          <h2 className="text-xl font-medium tracking-tight text-white">
            {mode === 'login' ? 'Sign in to Brain OS' : 'Create an account'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1.5">
            {mode === 'login' ? 'Enter your credentials to continue' : 'Sign up to get started'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="px-3.5 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-900/30 text-white placeholder-neutral-600 outline-none focus:border-neutral-700 transition-colors relative z-[100] pointer-events-auto touch-auto"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-3.5 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-900/30 text-white placeholder-neutral-600 outline-none focus:border-neutral-700 transition-colors relative z-[100] pointer-events-auto touch-auto"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-lg bg-white text-neutral-950 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
