'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Note = {
  id: string
  content: string
  day_index: number
  position_y: number
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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Dashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const weekDays = getWeekDays()
  const today = new Date()
  const todayIndex = today.getDay()
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const weekStart = getWeekDays()[0].toISOString().split('T')[0]
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('week_start', weekStart)
        .order('created_at', { ascending: true })
      setNotes(data ?? [])
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
    const weekStart = weekDays[0].toISOString().split('T')[0]
    const { data } = await supabase.from('notes').insert({
      user_id: userId,
      content: '',
      day_index: dayIndex,
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
        const prev = dayNotes[dayNotes.length - 1]
        setTimeout(() => textareaRefs.current[prev.id]?.focus(), 50)
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const totalNotes = notes.length
  const weekLabel = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} — ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4' }}>
      <p style={{ color: '#C8C7BE', fontSize: 13, letterSpacing: 2, fontFamily: 'sans-serif' }}>...</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'Inter', sans-serif; background: #F8F7F4; color: #1C1C1A; -webkit-font-smoothing: antialiased; }

        .page { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        /* ── Header ── */
        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px;
          height: 56px;
          background: #F8F7F4;
          border-bottom: 1px solid #ECEAE4;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }
        .header-left { display: flex; align-items: center; gap: 28px; }
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 400;
          color: #1C1C1A; letter-spacing: -0.2px;
        }
        .logo em { font-style: italic; color: #A09880; }
        .divider { width: 1px; height: 16px; background: #DDDBD4; }
        .week-badge {
          font-size: 11.5px; color: #A09880; font-weight: 400; letter-spacing: 0.1px;
        }
        .header-right { display: flex; align-items: center; gap: 20px; }
        .note-count {
          font-size: 11px; color: #C0BEB5; font-weight: 400;
          background: #EFEEE9; padding: 3px 10px; border-radius: 20px;
        }
        .signout {
          font-size: 11.5px; color: #B8B6AC; background: none; border: none;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: color 0.15s; letter-spacing: 0.1px;
        }
        .signout:hover { color: #6A6A5A; }

        /* ── Day labels row ── */
        .day-labels {
          display: flex; border-bottom: 1px solid #ECEAE4;
          background: #F8F7F4; flex-shrink: 0;
          padding: 0 0;
        }
        .day-label-cell {
          flex: 1; padding: 10px 20px 8px;
          border-right: 1px solid #ECEAE4;
          display: flex; align-items: baseline; gap: 10px;
        }
        .day-label-cell:last-child { border-right: none; }
        .day-label-cell.is-today { background: #FFFFF8; }
        .day-name-text {
          font-size: 10px; font-weight: 500; letter-spacing: 0.9px;
          text-transform: uppercase; color: #C8C6BC;
        }
        .day-label-cell.is-today .day-name-text { color: #B8A068; }
        .day-num-text {
          font-family: 'Playfair Display', serif;
          font-size: 20px; color: #D8D6CE; line-height: 1;
        }
        .day-label-cell.is-today .day-num-text { color: #1C1C1A; }
        .today-tag {
          font-size: 9px; font-weight: 500; letter-spacing: 0.8px;
          text-transform: uppercase; color: #B8A068;
          background: #F5EED8; padding: 2px 7px; border-radius: 10px;
          margin-left: auto;
        }

        /* ── Board ── */
        .board { flex: 1; display: flex; overflow-x: auto; overflow-y: hidden; }
        .board::-webkit-scrollbar { height: 0; }

        .day-col {
          flex: 1; display: flex; flex-direction: column;
          border-right: 1px solid #ECEAE4;
          min-width: 120px; height: 100%;
          transition: background 0.2s;
          position: relative;
        }
        .day-col:last-child { border-right: none; }
        .day-col.is-today { background: #FFFFF8; }
        .day-col.is-hovered { background: #FAFAF6; }
        .day-col.is-today.is-hovered { background: #FFFEF5; }

        /* Subtle line pattern for today */
        .day-col.is-today::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background-image: repeating-linear-gradient(
            transparent, transparent 27px, #F5F3EA 27px, #F5F3EA 28px
          );
          pointer-events: none; opacity: 0.5;
        }

        .notes-area {
          flex: 1; overflow-y: auto; padding: 14px 0 60px;
          cursor: text; position: relative; z-index: 1;
        }
        .notes-area::-webkit-scrollbar { width: 0; }

        .note-row {
          display: flex; align-items: flex-start;
          padding: 1px 14px 1px 20px;
          position: relative;
        }
        .note-row:hover .note-del { opacity: 1; }

        .note-bullet {
          width: 4px; height: 4px; border-radius: 50%;
          background: #D8D6CE; flex-shrink: 0;
          margin-top: 9px; margin-right: 8px;
          transition: background 0.15s;
        }
        .note-row:focus-within .note-bullet { background: #B8A068; }

        textarea {
          width: 100%; background: none; border: none; outline: none;
          resize: none; overflow: hidden; min-height: 26px;
          font-family: 'Inter', sans-serif; font-size: 12.5px;
          line-height: 1.75; color: #3A3830; font-weight: 400;
          padding: 2px 0; letter-spacing: 0.1px;
        }
        textarea::placeholder { color: #D4D2C8; }
        textarea:focus { color: #1C1C1A; }

        .note-del {
          opacity: 0; background: none; border: none; cursor: pointer;
          color: #D4D2C8; font-size: 15px; padding: 3px 0;
          line-height: 1; transition: all 0.12s; flex-shrink: 0; margin-top: 3px;
        }
        .note-del:hover { color: #D07070; }

        .empty-hint {
          padding: 14px 20px;
          font-size: 11.5px; color: #D4D2C8;
          font-style: italic; font-family: 'Playfair Display', serif;
          line-height: 1.6; pointer-events: none;
        }

        /* ── Footer ── */
        .footer {
          height: 36px; border-top: 1px solid #ECEAE4;
          display: flex; align-items: center; padding: 0 36px;
          flex-shrink: 0;
        }
        .footer-text { font-size: 10.5px; color: #C8C6BC; letter-spacing: 0.2px; }
        .footer-text strong { color: #A8A69C; font-weight: 500; }
      `}</style>

      <div className="page">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">friendey <em>·</em></div>
            <div className="divider" />
            <div className="week-badge">{weekLabel}</div>
          </div>
          <div className="header-right">
            {totalNotes > 0 && (
              <div className="note-count">{totalNotes} {totalNotes === 1 ? 'note' : 'notes'} this week</div>
            )}
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
            const isHovered = hoveredDay === i
            const dayNotes = notes
              .filter(n => n.day_index === i)
              .sort((a, b) => a.position_y - b.position_y)

            return (
              <div
                key={i}
                className={`day-col${isToday ? ' is-today' : ''}${isHovered ? ' is-hovered' : ''}`}
                onMouseEnter={() => setHoveredDay(i)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div
                  className="notes-area"
                  onClick={() => addNote(i)}
                >
                  {dayNotes.length === 0 && (
                    <div className="empty-hint">
                      {isToday ? "What's on your mind today?" : ''}
                    </div>
                  )}
                  {dayNotes.map(note => (
                    <div
                      key={note.id}
                      className="note-row"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="note-bullet" />
                      <textarea
                        ref={el => { textareaRefs.current[note.id] = el }}
                        value={note.content}
                        placeholder="..."
                        onChange={e => {
                          handleChange(note, e.target.value)
                          autoResize(e.target)
                        }}
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
            Week of <strong>{MONTHS[weekDays[0].getMonth()]} {weekDays[0].getDate()}</strong> &nbsp;·&nbsp; Press <strong>Enter</strong> to add a line &nbsp;·&nbsp; Click any day to start writing
          </span>
        </footer>
      </div>
    </>
  )
}
