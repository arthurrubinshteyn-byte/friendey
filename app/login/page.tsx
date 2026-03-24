'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
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
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px',
      background: '#F8F7F4', fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #ECEAE4',
        padding: '40px', width: '100%', maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1C1C1A', marginBottom: 4, letterSpacing: '-0.5px' }}>friendey.</h1>
        <p style={{ fontSize: 13, color: '#A8A69C', marginBottom: 28 }}>your life, organized</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #E8E6E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#FAFAF8' }}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #E8E6E0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#FAFAF8' }}
          />
          {error && <p style={{ fontSize: 12, color: '#E03131', margin: 0 }}>{error}</p>}
          <button
            onClick={handleAuth} disabled={loading}
            style={{ padding: '13px', borderRadius: 10, background: '#1C1C1A', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#A8A69C', marginTop: 20 }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#1C1C1A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </main>
  )
}
