'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF9]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md">
        <h1 className="text-3xl font-semibold text-gray-800 mb-1">friendey.</h1>
        <p className="text-gray-400 text-sm mb-8">your life, organized</p>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-gray-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </div>
        <p className="text-center text-sm text-gray-400 mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-gray-700 font-medium hover:underline">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </main>
  )
}
