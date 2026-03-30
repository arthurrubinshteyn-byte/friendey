'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Tool = {
  id: string
  name: string
  description: string
  url: string
  category: string
  keywords: string
}

export default function Directory() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    const q = query.toLowerCase()
    const { data } = await supabase.from('tools').select('*')
    const scored = (data ?? []).map(tool => {
      const keywords = (tool.keywords ?? '').toLowerCase()
      const name = (tool.name ?? '').toLowerCase()
      const desc = (tool.description ?? '').toLowerCase()
      const cat = (tool.category ?? '').toLowerCase()
      let score = 0
      if (keywords.includes(q)) score += 10
      if (name.includes(q)) score += 8
      if (cat.includes(q)) score += 5
      if (desc.includes(q)) score += 3
      q.split(' ').forEach(word => {
        if (keywords.includes(word)) score += 2
        if (name.includes(word)) score += 1
      })
      return { tool, score }
    })
    const best = scored.sort((a, b) => b.score - a.score)[0]
    setResult(best?.score > 0 ? best.tool : null)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { min-height: 100%; }
        body { font-family: 'Inter', sans-serif; background: #F8F7F4; color: #1C1C1A; -webkit-font-smoothing: antialiased; }

        .dir-page { min-height: 100vh; display: flex; flex-direction: column; }

        .dir-header { padding: 0 32px; height: 54px; background: #F8F7F4; border-bottom: 1px solid #E8E6E0; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
        .dir-header-left { display: flex; align-items: center; gap: 12px; }
        .dir-logo { font-size: 16px; font-weight: 700; color: #1C1C1A; letter-spacing: -0.5px; text-decoration: none; }
        .dir-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; background: #1C1C1A; color: #F8F7F4; padding: 3px 8px; border-radius: 4px; }
        .dir-back { font-size: 12px; color: #A8A69C; text-decoration: none; transition: color 0.15s; }
        .dir-back:hover { color: #1C1C1A; }

        .dir-hero { padding: 80px 24px 48px; text-align: center; max-width: 640px; margin: 0 auto; }
        .dir-title { font-size: 40px; font-weight: 700; color: #1C1C1A; letter-spacing: -1.5px; margin-bottom: 12px; line-height: 1.1; }
        .dir-title span { color: #A8A69C; }
        .dir-sub { font-size: 15px; color: #A8A69C; line-height: 1.6; font-weight: 400; }

        .dir-search-wrap { padding: 0 24px 48px; max-width: 640px; margin: 0 auto; width: 100%; }
        .dir-search-box { display: flex; gap: 10px; }
        .dir-search-input { flex: 1; padding: 14px 18px; border-radius: 12px; border: 1px solid #E8E6E0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; background: #fff; transition: border-color 0.15s; color: #1C1C1A; }
        .dir-search-input:focus { border-color: #1C1C1A; }
        .dir-search-input::placeholder { color: #C0BEB4; }
        .dir-search-btn { padding: 14px 24px; border-radius: 12px; background: #1C1C1A; color: #F8F7F4; border: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; white-space: nowrap; }
        .dir-search-btn:hover { background: #333; }

        .dir-result { margin-top: 16px; }
        .dir-result-card { background: #fff; border: 1px solid #E8E6E0; border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; text-decoration: none; transition: all 0.15s; color: inherit; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .dir-result-card:hover { border-color: #1C1C1A; box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .dir-result-icon { width: 44px; height: 44px; border-radius: 10px; background: #F2F1EE; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .dir-result-info { flex: 1; min-width: 0; }
        .dir-result-label { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #A8A69C; margin-bottom: 3px; }
        .dir-result-name { font-size: 17px; font-weight: 700; color: #1C1C1A; letter-spacing: -0.3px; margin-bottom: 3px; }
        .dir-result-desc { font-size: 13px; color: #6A6A5A; }
        .dir-result-cat { font-size: 11px; color: #A8A69C; background: #F2F1EE; padding: 2px 8px; border-radius: 6px; white-space: nowrap; }
        .dir-result-arrow { font-size: 18px; color: #C0BEB4; flex-shrink: 0; }
        .dir-no-result { text-align: center; padding: 24px; background: #fff; border: 1px solid #E8E6E0; border-radius: 14px; }
        .dir-no-result p { font-size: 14px; color: #A8A69C; }
        .dir-no-result strong { color: #1C1C1A; }

        .dir-footer { margin-top: auto; padding: 24px 32px; border-top: 1px solid #E8E6E0; display: flex; align-items: center; justify-content: space-between; }
        .dir-footer-text { font-size: 11px; color: #C0BEB4; }
        .dir-footer-link { font-size: 11px; color: #A8A69C; text-decoration: none; }
        .dir-footer-link:hover { color: #1C1C1A; }

        @media (max-width: 640px) {
          .dir-header { padding: 0 16px; }
          .dir-hero { padding: 48px 16px 32px; }
          .dir-title { font-size: 30px; }
          .dir-search-wrap { padding: 0 16px 32px; }
          .dir-search-box { flex-direction: column; }
          .dir-search-btn { width: 100%; }
        }
      `}</style>

      <div className="dir-page">
        <header className="dir-header">
          <div className="dir-header-left">
            <a href="/" className="dir-logo">friendey</a>
            <span className="dir-badge">Directory</span>
          </div>
          <a href="/dashboard" className="dir-back">← Back to app</a>
        </header>

        <div className="dir-hero">
          <h1 className="dir-title">Find the best tool <span>for anything.</span></h1>
          <p className="dir-sub">Search and we'll tell you exactly what to use. Curated by the Friendey team, updated as the landscape changes.</p>
        </div>

        <div className="dir-search-wrap">
          <div className="dir-search-box">
            <input
              className="dir-search-input"
              type="text"
              placeholder="e.g. ai video generator, logo design, ecommerce..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <button className="dir-search-btn" onClick={search}>
              {loading ? '...' : 'Find it →'}
            </button>
          </div>

          {searched && (
            <div className="dir-result">
              {result ? (
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="dir-result-card">
                  <div className="dir-result-icon">🔧</div>
                  <div className="dir-result-info">
                    <div className="dir-result-label">Best for "{query}"</div>
                    <div className="dir-result-name">{result.name}</div>
                    <div className="dir-result-desc">{result.description}</div>
                  </div>
                  <div className="dir-result-cat">{result.category}</div>
                  <div className="dir-result-arrow">→</div>
                </a>
              ) : (
                <div className="dir-no-result">
                  <p>No tool found for <strong>"{query}"</strong> yet. We're always adding more.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="dir-footer">
          <span className="dir-footer-text">Friendey Directory — curated tools for builders</span>
          <a href="/" className="dir-footer-link">friendey.com →</a>
        </footer>
      </div>
    </>
  )
}
