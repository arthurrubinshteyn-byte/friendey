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
      setTimeout(() => {
        const el = textareaRefs.current[data.id]
        el?.focus()
      }, 50)
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

  const weekLabel = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#ccc', fontSize: 13 }}>...</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #FAFAF8; }
        body { font-family: 'DM Sans', sans-serif; color: #1A1A1A; }

        .page { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        /* Top bar */
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 40px 16px;
          border-bottom: 1px solid #EBEBEA;
          background: #FAFAF8;
          flex-shrink: 0;
        }
        .logo { font-family: 'Lora', serif; font-size: 18px; color: #1A1A1A; letter-spacing: -0.3px; }
        .logo span { font-style: italic; color: #9A9A8A; }
        .week-title { font-size: 13px; color: #9A9A8A; font-weight: 400; letter-spacing: 0.2px; }
        .top-right { display: flex; align-items: center; gap: 16px; }
        .signout { font-size: 12px; color: #BDBDB0; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s; }
        .signout:hover { color: #7A7A6A; }

        /* Board */
        .board { flex: 1; overflow-x: auto; overflow-y: hidden; }
        .board-inner { display: flex; height: 100%; min-width: 900px; }

        /* Day column */
        .day-col { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #EBEBEA; min-width: 0; height: 100%; }
        .day-col:last-child { border-right: none; }
        .day-col.is-today { background: #FFFFF8; }

        .day-head {
          padding: 16px 18px 12px;
          border-bottom: 1px solid #F0EFEC;
          flex-shrink: 0;
        }
        .day-name {
          font-size: 10px; font-weight: 500; letter-spacing: 1px;
          text-transform: uppercase; color: #BDBDB0; margin-bottom: 3px;
        }
        .day-col.is-today .day-name { color: #B8A88A; }
        .day-num {
          font-family: 'Lora', serif; font-size: 24px; color: #E0DED8; line-height: 1;
        }
        .day-col.is-today .day-num { color: #1A1A1A; }
        .today-pip { width: 4px; height: 4px; background: #C8A96E; border-radius: 50%; margin-top: 6px; }

        /* Notes area */
        .notes-area {
          flex: 1; overflow-y: auto; padding: 12px 0 40px;
          cursor: text;
        }
        .notes-area::-webkit-scrollbar { width: 0; }

        .note-row {
          display: flex; align-items: flex-start;
          padding: 0 14px 0 18px;
          position: relative;
        }
        .note-row:hover .note-del { opacity: 1; }

        textarea {
          width: 100%; background: none; border: none; outline: none; resize: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.7;
          color: #3A3A32; font-weight: 400; overflow: hidden;
          min-height: 28px; padding: 2px 0;
        }
        textarea::placeholder { color: #DDDDD5; }

        .note-del {
          opacity: 0; background: none; border: none; cursor: pointer;
          color: #DDDDD5; font-size: 14px; padding: 4px 2px; line-height: 1;
          transition: all 0.1s; flex-shrink: 0; margin-top: 2px;
        }
        .note-del:hover { color: #E07070; }

        .add-note-btn {
          display: block; width: 100%; text-align: left;
          padding: 4px 18px; font-size: 12px; color: #DDDDD5;
          background: none; border: none; cursor: text;
          font-family: 'DM Sans', sans-serif; transition: color 0.15s;
        }
        .add-note-btn:hover { color: #BDBDB0; }

        /* Horizontal rule between sections */
        .day-rule { height: 1px; background: #F5F5F2; margin: 4px 18px; }

        .board::-webkit-scrollbar { height: 3px; }
        .board::-webkit-scrollbar-thumb { background: #E8E8E4; border-radius: 2px; }
      `}</style>

      <div className="page">
        {/* Top bar */}
        <header className="topbar">
          <div className="logo">friendey <span>·</span></div>
          <div className="week-title">{weekLabel}</div>
          <div className="top-right">
            <button className="signout" onClick={signOut}>sign out</button>
          </div>
        </header>

        {/* Board */}
        <div className="board">
          <div className="board-inner">
            {weekDays.map((date, i) => {
              const isToday = i === todayIndex
              const dayNotes = notes
                .filter(n => n.day_index === i)
                .sort((a, b) => a.position_y - b.position_y)

              return (
                <div key={i} className={`day-col${isToday ? ' is-today' : ''}`}>
                  <div className="day-head">
                    <div className="day-name">{DAYS[i]}</div>
                    <div className="day-num">{date.getDate()}</div>
                    {isToday && <div className="today-pip" />}
                  </div>

                  <div className="notes-area" onClick={() => addNote(i)}>
                    {dayNotes.map(note => (
                      <div key={note.id} className="note-row" onClick={e => e.stopPropagation()}>
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
                    {dayNotes.length === 0 && (
                      <button className="add-note-btn" onClick={e => { e.stopPropagation(); addNote(i) }}>
                        click to write...
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
