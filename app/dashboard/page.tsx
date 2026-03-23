'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Note = {
  id: string
  content: string
  day_index: number
  position_y: number
  week_start: string
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

const COLORS = [
  { label: 'Default', value: '' },
  { label: 'Red', value: '#E03131' },
  { label: 'Orange', value: '#E8590C' },
  { label: 'Yellow', value: '#F08C00' },
  { label: 'Green', value: '#2F9E44' },
  { label: 'Blue', value: '#1971C2' },
  { label: 'Purple', value: '#7048E8' },
]

function NoteEditor({ note, onUpdate, onDelete }: {
  note: Note
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
}) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 })

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: note.content || '<p></p>',
    onUpdate: ({ editor }) => {
      onUpdate(note.id, editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          setToolbarPos({
            top: rect.top - 44,
            left: Math.max(8, rect.left + rect.width / 2 - 120),
          })
          setShowToolbar(true)
        }
      } else {
        setShowToolbar(false)
      }
    },
    onBlur: () => {
      setTimeout(() => setShowToolbar(false), 200)
    },
    editorProps: {
      attributes: { class: 'note-editor-inner' },
    },
  })

  if (!editor) return null

  return (
    <div className="note-row">
      <div className="note-bullet" />
      <div className="note-editor-wrap">
        <EditorContent editor={editor} />
      </div>
      <button className="note-del" onClick={() => onDelete(note.id)}>×</button>

      {showToolbar && (
        <div
          className="toolbar"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          onMouseDown={e => e.preventDefault()}
        >
          <button
            className={`tb-btn${editor.isActive('bold') ? ' active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </button>
          <button
            className={`tb-btn${editor.isActive('italic') ? ' active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </button>
          <div className="tb-divider" />
          {COLORS.map(c => (
            <button
              key={c.value}
              className="color-btn"
              title={c.label}
              style={{ background: c.value || '#1C1C1A' }}
              onClick={() => {
                if (c.value === '') editor.chain().focus().unsetColor().run()
                else editor.chain().focus().setColor(c.value).run()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const debounceTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({})
  const weekDays = getWeekDays()
  const todayIndex = new Date().getDay()

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
      setLoading(false)
    }
    init()
  }, [])

  const handleUpdate = useCallback((id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n))
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id])
    debounceTimers.current[id] = setTimeout(async () => {
      await supabase.from('notes').update({ content }).eq('id', id)
    }, 500)
  }, [])

  const addNote = async (dayIndex: number) => {
    const weekStart = fmt(weekDays[0])
    const { data } = await supabase.from('notes').insert({
      user_id: userId, content: '', day_index: dayIndex,
      position_y: notes.filter(n => n.day_index === dayIndex).length,
      week_start: weekStart,
    }).select().single()
    if (data) setNotes(prev => [...prev, data])
  }

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  const activeDaysThisWeek = new Set(
    notes.filter(n => n.content.replace(/<[^>]*>/g, '').trim()).map(n => n.day_index)
  ).size
  const weekLabel = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} — ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
  const R = 14, C = 2 * Math.PI * R
  const filled = C * (activeDaysThisWeek / 7)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4' }}>
      <p style={{ color: '#C8C7BE', fontSize: 13, fontFamily: 'sans-serif' }}>...</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'Inter', sans-serif; background: #F8F7F4; color: #1C1C1A; -webkit-font-smoothing: antialiased; }
        .page { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; height: 54px;
          background: #F8F7F4; border-bottom: 1px solid #E8E6E0;
          flex-shrink: 0; z-index: 10;
        }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .logo-text { font-size: 20px; font-weight: 700; color: #1C1C1A; letter-spacing: -0.5px; }
        .header-divider { width: 1px; height: 14px; background: #E0DDD6; }
        .week-label { font-size: 11.5px; color: #A8A69C; }
        .header-right { display: flex; align-items: center; gap: 20px; }
        .ring-widget { display: flex; align-items: center; gap: 8px; }
        .ring-label { font-size: 11px; color: #B8B6AC; }
        .ring-svg { transform: rotate(-90deg); }
        .ring-track { fill: none; stroke: #ECEAE4; stroke-width: 2.5; }
        .ring-fill { fill: none; stroke: #1C1C1A; stroke-width: 2.5; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }
        .signout { font-size: 11.5px; color: #B8B6AC; background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: color 0.15s; }
        .signout:hover { color: #1C1C1A; }

        .day-labels { display: flex; border-bottom: 1px solid #E8E6E0; background: #F8F7F4; flex-shrink: 0; }
        .day-label-cell { flex: 1; padding: 10px 18px 8px; border-right: 1px solid #E8E6E0; display: flex; align-items: baseline; gap: 10px; }
        .day-label-cell:last-child { border-right: none; }
        .day-label-cell.is-today { background: #FFFEF8; }
        .day-name-text { font-size: 9.5px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #C0BEB4; }
        .day-label-cell.is-today .day-name-text { color: #1C1C1A; }
        .day-num-text { font-size: 18px; font-weight: 300; color: #C8C6BC; line-height: 1; }
        .day-label-cell.is-today .day-num-text { color: #1C1C1A; font-weight: 600; }
        .today-tag { font-size: 9px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #1C1C1A; background: #E8E6E0; padding: 2px 7px; border-radius: 10px; margin-left: auto; }

        .board { flex: 1; display: flex; overflow-x: auto; overflow-y: hidden; }
        .board::-webkit-scrollbar { height: 0; }

        .day-col { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #E8E6E0; min-width: 120px; height: 100%; position: relative; transition: background 0.2s; }
        .day-col:last-child { border-right: none; }
        .day-col.is-today { background: #FFFEF8; }
        .day-col.is-past { background: #F2F1EE; }
        .day-col.is-future { background: #F5F4F1; }
        .day-col.is-hovered:not(.is-today) { background: #FAFAF6; }
        .day-col.is-today::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(transparent, transparent 27px, #F0EFE6 27px, #F0EFE6 28px); pointer-events: none; opacity: 0.5; }

        .notes-area { flex: 1; overflow-y: auto; padding: 12px 0 60px; cursor: text; position: relative; z-index: 1; }
        .notes-area::-webkit-scrollbar { width: 0; }

        .note-row { display: flex; align-items: flex-start; padding: 1px 12px 1px 16px; position: relative; }
        .note-row:hover .note-del { opacity: 1; }
        .note-bullet { width: 3px; height: 3px; border-radius: 50%; background: #D4D2C8; flex-shrink: 0; margin-top: 10px; margin-right: 8px; transition: background 0.15s; }
        .note-row:focus-within .note-bullet { background: #1C1C1A; }

        .note-editor-wrap { flex: 1; min-width: 0; }
        .note-editor-inner { font-family: 'Inter', sans-serif; font-size: 12.5px; line-height: 1.75; color: #4A4840; font-weight: 400; outline: none; min-height: 26px; padding: 2px 0; }
        .note-editor-inner p { margin: 0; }
        .note-editor-inner:focus { color: #1C1C1A; }

        .note-del { opacity: 0; background: none; border: none; cursor: pointer; color: #D4D2C8; font-size: 15px; padding: 3px 0; line-height: 1; transition: all 0.12s; flex-shrink: 0; margin-top: 3px; }
        .note-del:hover { color: #D07070; }

        .add-col-btn { display: block; width: 100%; text-align: left; padding: 6px 16px; font-size: 12px; color: #D4D2C8; background: none; border: none; cursor: text; font-family: 'Inter', sans-serif; transition: color 0.15s; }
        .add-col-btn:hover { color: #A8A69C; }
        .empty-hint { padding: 12px 16px; font-size: 12px; color: #D0CEC4; line-height: 1.6; pointer-events: none; font-style: italic; }

        .toolbar { position: fixed; z-index: 1000; display: flex; align-items: center; gap: 2px; background: #1C1C1A; border-radius: 8px; padding: 5px 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); animation: fadeIn 0.1s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .tb-btn { background: none; border: none; cursor: pointer; color: #E8E6E0; font-size: 13px; padding: 3px 7px; border-radius: 5px; transition: background 0.1s; font-family: 'Inter', sans-serif; }
        .tb-btn:hover, .tb-btn.active { background: #333; }
        .tb-divider { width: 1px; height: 16px; background: #333; margin: 0 3px; }
        .color-btn { width: 14px; height: 14px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.1s; flex-shrink: 0; }
        .color-btn:hover { transform: scale(1.2); border-color: #555; }

        .footer { height: 34px; border-top: 1px solid #E8E6E0; display: flex; align-items: center; padding: 0 32px; flex-shrink: 0; justify-content: space-between; }
        .footer-text { font-size: 10.5px; color: #C8C6BC; }
        .footer-text strong { color: #A8A69C; font-weight: 500; }
        .footer-right { font-size: 10.5px; color: #C8C6BC; }
      `}</style>

      <div className="page">
        <header className="header">
          <div className="header-left">
            <span className="logo-text">friendey.</span>
            <div className="header-divider" />
            <span className="week-label">{weekLabel}</span>
          </div>
          <div className="header-right">
            <div className="ring-widget">
              <svg width="34" height="34" className="ring-svg">
                <circle className="ring-track" cx="17" cy="17" r={R} />
                <circle className="ring-fill" cx="17" cy="17" r={R}
                  strokeDasharray={`${filled} ${C - filled}`}
                  strokeDashoffset="0"
                />
              </svg>
              <span className="ring-label">{activeDaysThisWeek}/7 days</span>
            </div>
            <button className="signout" onClick={signOut}>sign out →</button>
          </div>
        </header>

        <div className="day-labels">
          {weekDays.map((date, i) => (
            <div key={i} className={`day-label-cell${i === todayIndex ? ' is-today' : ''}`}>
              <span className="day-name-text">{DAYS[i].slice(0, 3)}</span>
              <span className="day-num-text">{date.getDate()}</span>
              {i === todayIndex && <span className="today-tag">Today</span>}
            </div>
          ))}
        </div>

        <div className="board">
          {weekDays.map((_, i) => {
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
                    <div key={note.id} onClick={e => e.stopPropagation()}>
                      <NoteEditor
                        note={note}
                        onUpdate={handleUpdate}
                        onDelete={deleteNote}
                      />
                    </div>
                  ))}
                  {dayNotes.length > 0 && (
                    <button className="add-col-btn" onClick={e => { e.stopPropagation(); addNote(i) }}>
                      + add
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <footer className="footer">
          <span className="footer-text">
            <strong>Select text</strong> to format &nbsp;·&nbsp; Click any column to write
          </span>
          <span className="footer-right">{MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</span>
        </footer>
      </div>
    </>
  )
}
