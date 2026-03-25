'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Landing() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #0C0C0B; color: #E8E6E0; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); }
        .glow { position: fixed; top: -20%; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; pointer-events: none; z-index: 0; background: radial-gradient(ellipse at center, rgba(255,255,240,0.04) 0%, transparent 70%); }
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; border-bottom: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(20px); background: rgba(12,12,11,0.8); }
        .nav-logo { font-size: 18px; font-weight: 700; color: #F0EDE6; letter-spacing: -0.5px; }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .nav-signin { font-size: 13px; color: #888; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.2s; padding: 8px 0; }
        .nav-signin:hover { color: #E8E6E0; }
        .nav-cta { font-size: 13px; font-weight: 500; color: #0C0C0B; background: #E8E6E0; border: none; padding: 9px 20px; border-radius: 100px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .nav-cta:hover { background: #fff; transform: translateY(-1px); }
        .hero { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 24px 80px; text-align: center; }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #666; border: 1px solid rgba(255,255,255,0.08); padding: 6px 14px; border-radius: 100px; margin-bottom: 40px; opacity: 0; transform: translateY(16px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .hero-eyebrow.visible { opacity: 1; transform: translateY(0); }
        .eyebrow-dot { width: 5px; height: 5px; background: #4ADE80; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .hero-headline { font-family: 'DM Serif Display', serif; font-size: clamp(52px, 8vw, 96px); line-height: 1.0; letter-spacing: -2px; color: #F0EDE6; margin-bottom: 24px; opacity: 0; transform: translateY(20px); transition: opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s; }
        .hero-headline.visible { opacity: 1; transform: translateY(0); }
        .hero-headline em { font-style: italic; color: #888; }
        .hero-sub { font-size: clamp(15px, 2vw, 18px); color: #666; max-width: 480px; line-height: 1.7; font-weight: 300; margin-bottom: 48px; opacity: 0; transform: translateY(20px); transition: opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s; }
        .hero-sub.visible { opacity: 1; transform: translateY(0); }
        .hero-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center; opacity: 0; transform: translateY(20px); transition: opacity 0.8s ease 0.45s, transform 0.8s ease 0.45s; }
        .hero-actions.visible { opacity: 1; transform: translateY(0); }
        .btn-primary { font-size: 14px; font-weight: 600; color: #0C0C0B; background: #F0EDE6; border: none; padding: 14px 32px; border-radius: 100px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .btn-primary:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(240,237,230,0.15); }
        .btn-secondary { font-size: 14px; color: #555; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.2s; }
        .btn-secondary:hover { color: #E8E6E0; }
        .preview-wrap { position: relative; z-index: 1; padding: 0 24px 120px; max-width: 1100px; margin: 0 auto; opacity: 0; transform: translateY(30px); transition: opacity 1s ease 0.6s, transform 1s ease 0.6s; }
        .preview-wrap.visible { opacity: 1; transform: translateY(0); }
        .preview-frame { background: #141413; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04); }
        .preview-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); background: #111110; }
        .preview-bar-left { display: flex; align-items: center; gap: 14px; }
        .preview-logo { font-size: 14px; font-weight: 700; color: #E8E6E0; letter-spacing: -0.3px; }
        .preview-divider { width: 1px; height: 12px; background: rgba(255,255,255,0.1); }
        .preview-week { font-size: 11px; color: #444; }
        .preview-journal-btn { font-size: 11px; color: #555; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 6px; }
        .preview-days { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .preview-day-head { padding: 10px 12px 8px; border-right: 1px solid rgba(255,255,255,0.04); }
        .preview-day-head:last-child { border-right: none; }
        .preview-day-name { font-size: 8px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #333; margin-bottom: 3px; }
        .preview-day-num { font-size: 18px; font-weight: 300; color: #2A2A28; line-height: 1; }
        .preview-day-head.today .preview-day-name { color: #888; }
        .preview-day-head.today .preview-day-num { color: #E8E6E0; font-weight: 600; }
        .preview-cols { display: grid; grid-template-columns: repeat(7, 1fr); height: 220px; }
        .preview-col { padding: 10px 12px; border-right: 1px solid rgba(255,255,255,0.04); }
        .preview-col:last-child { border-right: none; }
        .preview-col.today { background: rgba(255,255,255,0.015); }
        .preview-note { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px; }
        .preview-bullet { width: 3px; height: 3px; border-radius: 50%; background: #333; flex-shrink: 0; margin-top: 5px; }
        .preview-note-text { font-size: 10px; color: #3A3A38; line-height: 1.5; }
        .preview-note.active .preview-bullet { background: #666; }
        .preview-note.active .preview-note-text { color: #888; }
        .preview-note.highlight .preview-note-text { color: #B8A068; }
        .features { position: relative; z-index: 1; padding: 80px 24px 120px; max-width: 1100px; margin: 0 auto; }
        .features-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #444; margin-bottom: 60px; text-align: center; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
        .feature-card { background: #0C0C0B; padding: 36px 32px; transition: background 0.2s; }
        .feature-card:hover { background: #111110; }
        .feature-icon { font-size: 20px; margin-bottom: 16px; }
        .feature-title { font-size: 15px; font-weight: 600; color: #D0CEC4; margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: #444; line-height: 1.7; font-weight: 300; }
        .quote-section { position: relative; z-index: 1; padding: 80px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .quote-text { font-family: 'DM Serif Display', serif; font-size: clamp(24px, 4vw, 42px); color: #E8E6E0; max-width: 700px; margin: 0 auto 24px; line-height: 1.3; letter-spacing: -1px; }
        .quote-text em { font-style: italic; color: #555; }
        .quote-sub { font-size: 13px; color: #444; }
        .cta-section { position: relative; z-index: 1; padding: 120px 24px; text-align: center; }
        .cta-headline { font-family: 'DM Serif Display', serif; font-size: clamp(36px, 5vw, 64px); color: #F0EDE6; margin-bottom: 16px; letter-spacing: -1.5px; line-height: 1.1; }
        .cta-sub { font-size: 15px; color: #555; margin-bottom: 40px; font-weight: 300; }
        footer { position: relative; z-index: 1; padding: 24px 48px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { font-size: 14px; font-weight: 700; color: #333; }
        .footer-right { font-size: 12px; color: #333; }
        @media (max-width: 768px) {
          nav { padding: 16px 20px; }
          .hero { padding: 100px 20px 60px; }
          .features-grid { grid-template-columns: 1fr; }
          footer { padding: 20px; flex-direction: column; gap: 8px; text-align: center; }
        }
      `}</style>

      <div className="grain" />
      <div className="glow" />

      <nav>
        <div className="nav-logo">friendey</div>
        <div className="nav-right">
          <button className="nav-signin" onClick={() => router.push('/login')}>Sign in</button>
          <button className="nav-cta" onClick={() => router.push('/login')}>Get started free</button>
        </div>
      </nav>

      <section className="hero">
        <div className={`hero-eyebrow${visible ? ' visible' : ''}`}>
          <span className="eyebrow-dot" />
          Your week. Your life. One place.
        </div>
        <h1 className={`hero-headline${visible ? ' visible' : ''}`}>
          Think clearly.<br /><em>Live deliberately.</em>
        </h1>
        <p className={`hero-sub${visible ? ' visible' : ''}`}>
          Friendey is the weekly planner for people who are done juggling five apps to manage their life. One clean space to think, plan, and write.
        </p>
        <div className={`hero-actions${visible ? ' visible' : ''}`}>
          <button className="btn-primary" onClick={() => router.push('/login')}>Start for free</button>
          <button className="btn-secondary" onClick={() => router.push('/login')}>Sign in →</button>
        </div>
      </section>

      <div className={`preview-wrap${visible ? ' visible' : ''}`}>
        <div className="preview-frame">
          <div className="preview-bar">
            <div className="preview-bar-left">
              <span className="preview-logo">friendey</span>
              <div className="preview-divider" />
              <span className="preview-week">March 16 — 22, 2026</span>
            </div>
            <span className="preview-journal-btn">📓 Open journal</span>
          </div>
          <div className="preview-days">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div key={d} className={`preview-day-head${i === 6 ? ' today' : ''}`}>
                <div className="preview-day-name">{d}</div>
                <div className="preview-day-num">{15 + i + 1}</div>
              </div>
            ))}
          </div>
          <div className="preview-cols">
            <div className="preview-col">
              <div className="preview-note"><div className="preview-bullet"/><div className="preview-note-text">Plan the week</div></div>
              <div className="preview-note highlight"><div className="preview-bullet"/><div className="preview-note-text">Call mom</div></div>
            </div>
            <div className="preview-col">
              <div className="preview-note active"><div className="preview-bullet"/><div className="preview-note-text">Morning run</div></div>
              <div className="preview-note active"><div className="preview-bullet"/><div className="preview-note-text">Deep work 9-12</div></div>
              <div className="preview-note active"><div className="preview-bullet"/><div className="preview-note-text">Review finances</div></div>
            </div>
            <div className="preview-col">
              <div className="preview-note active"><div className="preview-bullet"/><div className="preview-note-text">Team standup</div></div>
              <div className="preview-note active"><div className="preview-bullet"/><div className="preview-note-text">Gym 6pm</div></div>
            </div>
            <div className="preview-col">
              <div className="preview-note"><div className="preview-bullet"/><div className="preview-note-text">Focus on launch</div></div>
              <div className="preview-note"><div className="preview-bullet"/><div className="preview-note-text">Write content</div></div>
              <div className="preview-note"><div className="preview-bullet"/><div className="preview-note-text">Read 30 min</div></div>
            </div>
            <div className="preview-col">
              <div className="preview-note"><div className="preview-bullet"/><div className="preview-note-text">Product review</div></div>
            </div>
            <div className="preview-col">
              <div className="preview-note"><div className="preview-bullet"/><div className="preview-note-text">Rest day</div></div>
              <div className="preview-note highlight"><div className="preview-bullet"/><div className="preview-note-text">Reflect on week</div></div>
            </div>
            <div className="preview-col today">
              <div className="preview-note active"><div className="preview-bullet"/><div className="preview-note-text">Post TikTok</div></div>
              <div className="preview-note"><div className="preview-bullet"/><div className="preview-note-text">Ship Friendey</div></div>
            </div>
          </div>
        </div>
      </div>

      <section className="features">
        <div className="features-label">Why Friendey</div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⬜</div>
            <div className="feature-title">Your whole week at a glance</div>
            <div className="feature-desc">See all 7 days side by side. No clicking around. No hidden views. Just your week, always visible.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✦</div>
            <div className="feature-title">Write anything, anywhere</div>
            <div className="feature-desc">Click any day and start writing. No templates, no setup, no friction. Just you and your thoughts.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📓</div>
            <div className="feature-title">A journal that's always there</div>
            <div className="feature-desc">One tap to open your personal journal. Your private space to think, reflect, and plan without limits.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◎</div>
            <div className="feature-title">Everything saves automatically</div>
            <div className="feature-desc">Every word you write is saved instantly. Come back tomorrow, next week, next year — it's all there.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⟡</div>
            <div className="feature-title">Works on every device</div>
            <div className="feature-desc">Desktop, tablet, phone. Friendey looks and works beautifully everywhere. No app download needed.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <div className="feature-title">Private and secure</div>
            <div className="feature-desc">Your notes are yours alone. Row-level security means nobody — not even us — can read your writing.</div>
          </div>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-text">
          "Stop managing five apps.<br /><em>Start managing your life.</em>"
        </div>
        <div className="quote-sub">One tab. One week. Everything you need.</div>
      </section>

      <section className="cta-section">
        <div className="cta-headline">Your week starts here.</div>
        <div className="cta-sub">Free to start. No credit card required.</div>
        <button className="btn-primary" style={{ fontSize: 15, padding: '16px 40px' }} onClick={() => router.push('/login')}>
          Start using Friendey →
        </button>
      </section>

      <footer>
        <div className="footer-logo">friendey</div>
        <div className="footer-right">© 2026 Friendey. Built for thinkers.</div>
      </footer>
    </>
  )
}
