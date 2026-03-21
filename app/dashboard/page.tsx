'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Note = {
  id: string
  content: string
  day_index: number
  position_y: number
  week_start: string
  created_at: string
}

function getWeekDays() {
  const today = new Date()
  const day = today.getDay()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function fmt(date: Date) { return date.toISOString().split('T')[0] }

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Dashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [streak, setStreak] = useState(0)
  const [showStreakPop, setShowStreakPop] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const weekDays = getWeekDays()
  const todayIndex = new Date().getDay()
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const weekStart = fmt(weekDays[0])
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('week_start', weekStart)
        .order('created_at', { ascending: true })
      setNotes(data ?? [])

      // Calculate streak from notes across all weeks
      const { data: allNotes } = await supabase
        .from('notes')
        .select('week_start, day_index, content')
        .neq('content', '')
      
      if (allNotes) {
        const activeDays = new Set(
          allNotes.map(n => {
            const ws = new Date(n.week_start)
            ws.setDate(ws.getDate() + n.day_index)
            return fmt(ws)
          })
        )
        let s = 0
        const d = new Date()
        while (true) {
          const key = fmt(d)
          if (activeDays.has(key)) { s++; d.setDate(d.getDate() - 1) }
          else break
        }
        setStreak(s)
        if (s > 0 && !activeDays.has(fmt(new Date()))) setShowStreakPop(true)
      }

      setLoading(false)
    }
    init()
  }, [])

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const handleChange = async (note: Note, value: string) => {
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: value } : n))
    await supabase.from('notes').update({ content: value }).eq('id', note.id)
  }

  const addNote = async (dayIndex: number) => {
    const weekStart = fmt(weekDays[0])
    const { data } = await supabase.from('notes').insert({
      user_id: userId, content: '', day_index: dayIndex,
      position_y: notes.filter(n => n.day_index === dayIndex).length,
      week_start: weekStart,
    }).select().single()
    if (data) {
      setNotes(prev => [...prev, data])
      setTimeout(() => textareaRefs.current[data.id]?.focus(), 50)
    }
  }

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const handleKeyDown = async (e: React.KeyboardEvent, note: Note) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      await addNote(note.day_index)
    }
    if (e.key === 'Backspace' && note.content === '') {
      e.preventDefault()
      deleteNote(note.id)
      const dayNotes = notes.filter(n => n.day_index === note.day_index && n.id !== note.id)
      if (dayNotes.length > 0) {
        setTimeout(() => textareaRefs.current[dayNotes[dayNotes.length - 1].id]?.focus(), 50)
      }
    }
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  // Week fill: how many of the 7 days have at least 1 non-empty note
  const activeDaysThisWeek = new Set(
    notes.filter(n => n.content.trim()).map(n => n.day_index)
  ).size
  const weekFill = activeDaysThisWeek / 7

  const weekLabel = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} — ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4' }}>
      <p style={{ color: '#C8C7BE', fontSize: 13, fontFamily: 'sans-serif' }}>...</p>
    </div>
  )

  // SVG ring math
  const R = 14, C = 2 * Math.PI * R
  const filled = C * weekFill

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'Inter', sans-serif; background: #F8F7F4; color: #1C1C1A; -webkit-font-smoothing: antialiased; }

        .page { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        /* Header */
        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; height: 54px;
          background: #F8F7F4; border-bottom: 1px solid #E8E6E0;
          flex-shrink: 0; z-index: 10;
        }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .logo { display: flex; align-items: center; gap: 8px; }
        .logo-text {
          font-family: 'Playfair Display', serif; font-size: 18px;
          color: #1C1C1A; letter-spacing: -0.3px; font-weight: 400;
        }
        .logo-dot { width: 6px; height: 6px; background: #C8A96E; border-radius: 50%; margin-bottom: 1px; }
        .header-divider { width: 1px; height: 14px; background: #E0DDD6; }
        .week-label { font-size: 11.5px; color: #A8A69C; letter-spacing: 0.1px; }

        .header-right { display: flex; align-items: center; gap: 18px; }

        /* Streak */
        .streak-widget {
          display: flex; align-items: center; gap: 8px;
          background: #FDF6E8; border: 1px solid #F0E4C0;
          padding: 5px 12px 5px 8px; border-radius: 20px; cursor: pointer;
          transition: all 0.2s; position: relative;
        }
        .streak-widget:hover { background: #FAF0D0; border-color: #E8D4A0; }
        .streak-flame { font-size: 14px; line-height: 1; }
        .streak-num { font-size: 12px; font-weight: 500; color: #B8860B; letter-spacing: 0.2px; }
        .streak-label { font-size: 10.5px; color: #C8A040; }

        /* Streak popup */
        .streak-pop {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: #1C1C1A; color: #F8F7F4; border-radius: 10px;
          padding: 12px 16px; width: 200px; z-index: 100;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          animation: popIn 0.2s ease;
        }
        .streak-pop::before {
          content: ''; position: absolute; top: -5px; right: 18px;
          width: 10px; height: 10px; background: #1C1C1A;
          transform: rotate(45deg); border-radius: 2px;
        }
        .streak-pop-title { font-size: 12px; font-weight: 500; margin-bottom: 4px; }
        .streak-pop-body { font-size: 11px; color: #888; line-height: 1.5; }
        @keyframes popIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        /* Week ring */
        .ring-widget { display: flex; align-items: center; gap: 8px; }
        .ring-label { font-size: 11px; color: #B8B6AC; }
        .ring-svg { transform: rotate(-90deg); }
        .ring-track { fill: none; stroke: #ECEAE4; stroke-width: 2.5; }
        .ring-fill { fill: none; stroke: #C8A96E; stroke-width: 2.5; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }

        .signout {
          font-size: 11.5px; color: #B8B6AC; background: none; border: none;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: color 0.15s;
        }
        .signout:hover { color: #6A6A5A; }

        /* Day labels */
        .day-labels { display: flex; border-bottom: 1px solid #E8E6E0; background: #F8F7F4; flex-shrink: 0; }
        .day-label-cell {
          flex: 1; padding: 10px 18px 8px;
          border-right: 1px solid #E8E6E0;
          display: flex; align-items: baseline; gap: 10px;
        }
        .day-label-cell:last-child { border-right: none; }
        .day-label-cell.is-today { background: #FFFEF8; }
        .day-name-text { font-size: 9.5px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; color: #C0BEB4; }
        .day-label-cell.is-today .day-name-text { color: #C8A96E; }
        .day-num-text { font-family: 'Playfair Display', serif; font-size: 20px; color: #C8C6BC; line-height: 1; }
        .day-label-cell.is-today .day-num-text { color: #1C1C1A; }
        .today-tag {
          font-size: 9px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase;
          color: #C8A96E; background: #FDF0D8; padding: 2px 7px; border-radius: 10px; margin-left: auto;
        }

        /* Board */
        .board { flex: 1; display: flex; overflow-x: auto; overflow-y: hidden; }
        .board::-webkit-scrollbar { height: 0; }

        .day-col {
          flex: 1; display: flex; flex-direction: column;
          border-right: 1px solid #E8E6E0; min-width: 120px; height: 100%;
          position: relative; transition: background 0.2s;
        }
        .day-col:last-child { border-right: none; }
        .day-col.is-today { background: #FFFEF8; }
        .day-col.is-past { background: #F4F3F0; }
        .day-col.is-future { background: #F6F5F2; }
        .day-col.is-hovered:not(.is-today) { background: #FAFAF6; }

        .day-col.is-today::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background-image: repeating-linear-gradient(transparent, transparent 27px, #F5F3E8 27px, #F5F3E8 28px);
          pointer-events: none; opacity: 0.4;
        }

        .notes-area {
          flex: 1; overflow-y: auto; padding: 12px 0 60px; cursor: text; position: relative; z-index: 1;
        }
        .notes-area::-webkit-scrollbar { width: 0; }

        .note-row { display: flex; align-items: flex-start; padding: 1px 12px 1px 16px; position: relative; }
        .note-row:hover .note-del { opacity: 1; }

        .note-bullet {
          width: 3px; height: 3px; border-radius: 50%; background: #D4D2C8;
          flex-shrink: 0; margin-top: 10px; margin-right: 8px; transition: background 0.15s;
        }
        .note-row:focus-within .note-bullet { background: #C8A96E; }

        textarea {
          width: 100%; background: none; border: none; outline: none; resize: none;
          overflow: hidden; min-height: 26px;
          font-family: 'Inter', sans-serif; font-size: 12.5px; line-height: 1.75;
          color: #4A4840; font-weight: 400; padding: 2px 0; letter-spacing: 0.1px;
        }
        textarea::placeholder { color: #D4D2C8; }
        textarea:focus { color: #1C1C1A; }

        .note-del {
          opacity: 0; background: none; border: none; cursor: pointer;
          color: #D4D2C8; font-size: 15px; padding: 3px 0; line-height: 1;
          transition: all 0.12s; flex-shrink: 0; margin-top: 3px;
        }
        .note-del:hover { color: #D07070; }

        .empty-hint {
          padding: 12px 16px; font-size: 11.5px; color: #D0CEC4;
          font-style: italic; font-family: 'Playfair Display', serif;
          line-height: 1.6; pointer-events: none;
        }

        /* Footer */
        .footer {
          height: 34px; border-top: 1px solid #E8E6E0; display: flex;
          align-items: center; padding: 0 32px; flex-shrink: 0; justify-content: space-between;
        }
        .footer-text { font-size: 10.5px; color: #C8C6BC; letter-spacing: 0.1px; }
        .footer-text strong { color: #A8A69C; font-weight: 500; }
        .footer-right { font-size: 10.5px; color: #D0CEC4; }
      `}</style>

      <div className="page" onClick={() => setShowStreakPop(false)}>

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-text">friendey</span>
              <div className="logo-dot" />
            </div>
            <div className="header-divider" />
            <span className="week-label">{weekLabel}</span>
          </div>

          <div className="header-right">

            {/* Week ring */}
            <div className="ring-widget">
              <svg width="34" height="34" className="ring-svg">
                <circle className="ring-track" cx="17" cy="17" r={R} />
                <circle
                  className="ring-fill" cx="17" cy="17" r={R}
                  strokeDasharray={`${filled} ${C - filled}`}
                  strokeDashoffset="0"
                />
              </svg>
              <span className="ring-label">{activeDaysThisWeek}/7 days</span>
            </div>

            {/* Streak */}
            <div
              className="streak-widget"
              onClick={e => { e.stopPropagation(); setShowStreakPop(s => !s) }}
            >
              <span className="streak-flame">🔥</span>
              <span className="streak-num">{streak}</span>
              <span className="streak-label">day streak</span>

              {showStreakPop && (
                <div className="streak-pop" onClick={e => e.stopPropagation()}>
                  <div className="streak-pop-title">
                    {streak === 0 ? 'Start your streak today' : `${streak} day streak 🔥`}
                  </div>
                  <div className="streak-pop-body">
                    {streak === 0
                      ? 'Write something in today\'s column to begin. Come back every day to keep it alive.'
                      : `You've written something ${streak} day${streak > 1 ? 's' : ''} in a row. Don't break the chain.`}
                  </div>
                </div>
              )}
            </div>

            <button className="signout" onClick={signOut}>sign out →</button>
          </div>
        </header>

        {/* Day label row */}
        <div className="day-labels">
          {weekDays.map((date, i) => (
            <div key={i} className={`day-label-cell${i === todayIndex ? ' is-today' : ''}`}>
              <span className="day-name-text">{DAYS[i].slice(0, 3)}</span>
              <span className="day-num-text">{date.getDate()}</span>
              {i === todayIndex && <span className="today-tag">Today</span>}
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="board">
          {weekDays.map((date, i) => {
            const isToday = i === todayIndex
            const isPast = i < todayIndex
            const dayNotes = notes.filter(n => n.day_index === i).sort((a, b) => a.position_y - b.position_y)

            return (
              <div
                key={i}
                className={`day-col${isToday ? ' is-today' : ''}${isPast && !isToday ? ' is-past' : ''}${!isToday && !isPast ? ' is-future' : ''}${hoveredDay === i ? ' is-hovered' : ''}`}
                onMouseEnter={() => setHoveredDay(i)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="notes-area" onClick={() => addNote(i)}>
                  {dayNotes.length === 0 && isToday && (
                    <div className="empty-hint">What's on your mind today?</div>
                  )}
                  {dayNotes.map(note => (
                    <div key={note.id} className="note-row" onClick={e => e.stopPropagation()}>
                      <div className="note-bullet" />
                      <textarea
                        ref={el => { textareaRefs.current[note.id] = el }}
                        value={note.content}
                        placeholder="..."
                        onChange={e => { handleChange(note, e.target.value); autoResize(e.target) }}
                        onKeyDown={e => handleKeyDown(e, note)}
                        onFocus={e => autoResize(e.target)}
                        rows={1}
                      />
                      <button className="note-del" onClick={() => deleteNote(note.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="footer">
          <span className="footer-text">
            <strong>Enter</strong> to add a line &nbsp;·&nbsp; <strong>Backspace</strong> on empty line to remove &nbsp;·&nbsp; Click any day to write
          </span>
          <span className="footer-right">{MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</span>
        </footer>
      </div>
    </>
  )
}
