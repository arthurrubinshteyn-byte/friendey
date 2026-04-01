'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'
import Underline from '@tiptap/extension-underline'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Note = {
  id: string
  content: string
  day_index: number
  position_y: number
  week_start: string
}

function getWeekDays(offset = 0) {
  const today = new Date()
  const day = today.getDay()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - day + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function fmt(date: Date) { return date.toISOString().split('T')[0] }

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
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

function NoteEditor({ note, onUpdate, onDelete, autoFocus }: {
  note: Note
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
  autoFocus?: boolean
}) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ bulletList: false, listItem: false }),
      TextStyle,
      Color,
      Underline,
      BulletList.configure({ HTMLAttributes: { class: 'note-bullet-list' } }),
      ListItem.configure({ HTMLAttributes: { class: 'note-list-item' } }),
    ],
    content: note.content || '<ul><li><p></p></li></ul>',
    autofocus: autoFocus ? 'end' : false,
    onUpdate: ({ editor }) => onUpdate(note.id, editor.getHTML()),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          setToolbarPos({ top: rect.top - 44, left: Math.max(8, rect.left + rect.width / 2 - 140) })
          setShowToolbar(true)
        }
      } else setShowToolbar(false)
    },
    onBlur: () => setTimeout(() => setShowToolbar(false), 200),
    editorProps: { attributes: { class: 'note-editor-inner' } },
  })

  if (!editor) return null

  return (
    <div className="note-row">
      <div className="note-editor-wrap">
        <EditorContent editor={editor} />
      </div>
      <button className="note-del" onClick={() => onDelete(note.id)}>×</button>
      {showToolbar && (
        <div className="toolbar" style={{ top: toolbarPos.top, left: toolbarPos.left }} onMouseDown={e => e.preventDefault()}>
          <button className={`tb-btn${editor.isActive('bold') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
          <button className={`tb-btn${editor.isActive('italic') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
          <button className={`tb-btn${editor.isActive('strike') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
          <button className={`tb-btn${editor.isActive('underline') ? ' active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} style={{ textDecoration: 'underline' }}>U</button>
          <div className="tb-divider" />
          {COLORS.map(c => (
            <button
              key={c.value}
              className="color-btn"
              title={c.label}
              style={{ background: c.value || '#1C1C1A' }}
              onClick={() => c.value === '' ? editor.chain().focus().unsetColor().run() : editor.chain().focus().setColor(c.value).run()}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function JournalEditor({ content, onChange, editorKey }: {
  content: string
  onChange: (v: string) => void
  editorKey: string
}) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: 'journal-editor-inner' } },
  })
  if (!editor) return null
  return <EditorContent editor={editor} />
}

export default function Dashboard() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
  const [weekOffset, setWeekOffset] = useState(0)
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [journalOpen, setJournalOpen] = useState(false)
  const [journalContent, setJournalContent] = useState('')
  const [journalId, setJournalId] = useState<string | null>(null)
  const [journalSaved, setJournalSaved] = useState(true)
  const [journalLoaded, setJournalLoaded] = useState(false)
  const debounceTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({})
  const journalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const todayIndex = new Date().getDay()
  const weekDays = getWeekDays(weekOffset)

  const loadNotes = async (offset: number) => {
    const days = getWeekDays(offset)
    const weekStart = fmt(days[0])
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('week_start', weekStart)
      .order('created_at', { ascending: true })
    setNotes(data ?? [])
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      await loadNotes(0)
      setLoading(false)

      const channel = supabase
        .channel('notes-realtime')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'notes',
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes(prev => {
              if (prev.find(n => n.id === (payload.new as Note).id)) return prev
              return [...prev, payload.new as Note]
            })
          }
          if (payload.eventType === 'UPDATE') {
            setNotes(prev => prev.map(n => n.id === payload.new.id ? payload.new as Note : n))
          }
          if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(n => n.id !== (payload.old as Note).id))
          }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    init()
  }, [])

  useEffect(() => {
    if (!loading) loadNotes(weekOffset)
  }, [weekOffset])

  const loadJournal = async () => {
    setJournalLoaded(false)
    const { data } = await supabase
      .from('journal').select('*')
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle()
    if (data) { setJournalContent(data.content); setJournalId(data.id) }
    else { setJournalContent(''); setJournalId(null) }
    setJournalLoaded(true)
  }

  const handleJournalChange = (value: string) => {
    setJournalContent(value)
    setJournalSaved(false)
    if (journalTimer.current) clearTimeout(journalTimer.current)
    journalTimer.current = setTimeout(async () => {
      if (journalId) {
        await supabase.from('journal').update({ content: value, updated_at: new Date().toISOString() }).eq('id', journalId)
      } else {
        const { data } = await supabase.from('journal').insert({ user_id: userId, content: value }).select().single()
        if (data) setJournalId(data.id)
      }
      setJournalSaved(true)
    }, 500)
  }

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
      user_id: userId, content: '<ul><li><p></p></li></ul>', day_index: dayIndex,
      position_y: notes.filter(n => n.day_index === dayIndex).length,
      week_start: weekStart,
    }).select().single()
    if (data) {
      setNotes(prev => [...prev, data])
      setLastAddedId(data.id)
    }
  }

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  const isCurrentWeek = weekOffset === 0
  const weekLabel = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} — ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`

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
        .header { display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 54px; background: #F8F7F4; border-bottom: 1px solid #E8E6E0; flex-shrink: 0; z-index: 10; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .logo-text { font-size: 20px; font-weight: 700; color: #1C1C1A; letter-spacing: -0.5px; }
        .header-divider { width: 1px; height: 14px; background: #E0DDD6; }
        .week-nav { display: flex; align-items: center; gap: 8px; }
        .week-nav-btn { background: none; border: 1px solid #E8E6E0; color: #A8A69C; font-size: 12px; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .week-nav-btn:hover { background: #EEECEA; color: #1C1C1A; border-color: #D4D1CC; }
        .week-label { font-size: 11px; color: #A8A69C; white-space: nowrap; }
        .week-today-btn { font-size: 11px; color: #B8A068; background: #FDF0D8; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .week-today-btn:hover { background: #F5E4C0; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .journal-btn { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #4A4840; background: #EEECEA; border: 1px solid #E0DDD6; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .journal-btn:hover { background: #E8E5E1; color: #1C1C1A; }
        .signout { font-size: 11px; color: #B8B6AC; background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: color 0.15s; }
        .signout:hover { color: #1C1C1A; }
        .day-tabs { display: none; overflow-x: auto; border-bottom: 1px solid #E8E6E0; background: #F8F7F4; flex-shrink: 0; padding: 0 16px; gap: 4px; }
        .day-tabs::-webkit-scrollbar { height: 0; }
        .day-tab { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 8px 12px; border-radius: 8px; cursor: pointer; border: none; background: none; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .day-tab-name { font-size: 9px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #C0BEB4; margin-bottom: 2px; }
        .day-tab-num { font-size: 16px; font-weight: 300; color: #C8C6BC; line-height: 1; }
        .day-tab.is-today .day-tab-name { color: #1C1C1A; }
        .day-tab.is-today .day-tab-num { color: #1C1C1A; font-weight: 600; }
        .day-tab.is-selected { background: #EEECEA; }
        .day-tab.is-selected .day-tab-name { color: #4A4840; }
        .day-tab.is-selected .day-tab-num { color: #1C1C1A; }
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
        .mobile-day { display: none; flex: 1; flex-direction: column; overflow: hidden; }
        .mobile-day-inner { flex: 1; overflow-y: auto; padding: 16px 20px 80px; }
        .mobile-day-inner::-webkit-scrollbar { width: 0; }
        .notes-area { flex: 1; overflow-y: auto; padding: 8px 0 60px; cursor: text; position: relative; z-index: 1; }
        .notes-area::-webkit-scrollbar { width: 0; }
        .note-row { display: flex; align-items: flex-start; padding: 0 8px; position: relative; }
        .note-row:hover .note-del { opacity: 1; }
        .note-editor-wrap { flex: 1; min-width: 0; }
        .note-editor-inner { font-family: 'Inter', sans-serif; font-size: 12.5px; line-height: 1.75; color: #4A4840; font-weight: 400; outline: none; }
        .note-editor-inner:focus { color: #1C1C1A; }
        .note-bullet-list { list-style: none; padding: 0; margin: 0; }
        .note-list-item { display: flex; align-items: flex-start; gap: 8px; padding: 1px 0; }
        .note-list-item::before { content: ''; width: 3px; height: 3px; border-radius: 50%; background: #D4D2C8; flex-shrink: 0; margin-top: 9px; transition: background 0.15s; }
        .note-editor-inner:focus-within .note-list-item::before { background: #A8A69C; }
        .note-list-item p { margin: 0; flex: 1; }
        .note-del { opacity: 0; background: none; border: none; cursor: pointer; color: #D4D2C8; font-size: 15px; padding: 3px 0; line-height: 1; transition: all 0.12s; flex-shrink: 0; margin-top: 4px; }
        .note-del:hover { color: #D07070; }
        .toolbar { position: fixed; z-index: 1000; display: flex; align-items: center; gap: 2px; background: #1C1C1A; border-radius: 8px; padding: 5px 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); animation: fadeIn 0.1s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .tb-btn { background: none; border: none; cursor: pointer; color: #E8E6E0; font-size: 13px; padding: 3px 7px; border-radius: 5px; transition: background 0.1s; font-family: 'Inter', sans-serif; line-height: 1.4; }
        .tb-btn:hover, .tb-btn.active { background: #333; }
        .tb-divider { width: 1px; height: 16px; background: #444; margin: 0 3px; }
        .color-btn { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #fff; cursor: pointer; transition: transform 0.1s; flex-shrink: 0; box-shadow: 0 0 0 1px rgba(255,255,255,0.2); }
        .color-btn:hover { transform: scale(1.25); box-shadow: 0 0 0 2px #fff; }
        .journal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; display: flex; align-items: center; justify-content: center; animation: overlayIn 0.2s ease; backdrop-filter: blur(2px); padding: 20px; }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .journal-modal { background: #FAFAF8; border-radius: 16px; width: 680px; max-width: 100%; height: 70vh; max-height: 600px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15); animation: modalIn 0.2s ease; overflow: hidden; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .journal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 14px; border-bottom: 1px solid #ECEAE4; flex-shrink: 0; }
        .journal-title { font-size: 14px; font-weight: 600; color: #1C1C1A; }
        .journal-date { font-size: 11px; color: #B8B6AC; margin-top: 1px; }
        .journal-header-right { display: flex; align-items: center; gap: 12px; }
        .journal-saved { font-size: 11px; color: #B8B6AC; }
        .journal-close { background: none; border: none; cursor: pointer; color: #B8B6AC; font-size: 20px; line-height: 1; transition: color 0.15s; padding: 0; }
        .journal-close:hover { color: #1C1C1A; }
        .journal-body { flex: 1; overflow-y: auto; padding: 20px 24px 24px; }
        .journal-body::-webkit-scrollbar { width: 0; }
        .journal-editor-inner { font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.8; color: #3A3830; outline: none; min-height: 200px; }
        .journal-editor-inner p { margin: 0 0 4px; }
        .journal-loading { font-size: 13px; color: #C8C6BC; padding: 20px 0; }
        .footer { height: 34px; border-top: 1px solid #E8E6E0; display: flex; align-items: center; padding: 0 24px; flex-shrink: 0; justify-content: space-between; }
        .footer-text { font-size: 10.5px; color: #C8C6BC; }
        .footer-text strong { color: #A8A69C; font-weight: 500; }
        .footer-right { font-size: 10.5px; color: #C8C6BC; }
        @media (max-width: 768px) {
          .header { padding: 0 16px; height: 50px; }
          .week-label { display: none; }
          .header-divider { display: none; }
          .logo-text { font-size: 18px; }
          .journal-btn span:last-child { display: none; }
          .journal-btn { padding: 6px 10px; }
          .week-nav { gap: 4px; }
          .week-nav-btn { padding: 4px 8px; font-size: 11px; }
          .week-today-btn { padding: 4px 8px; font-size: 11px; }
          .day-labels { display: none; }
          .day-tabs { display: flex; }
          .board { display: none; }
          .mobile-day { display: flex; }
          .footer { display: none; }
          .journal-modal { height: 85vh; max-height: none; border-radius: 16px 16px 0 0; align-self: flex-end; width: 100%; }
          .journal-overlay { align-items: flex-end; padding: 0; }
        }
      `}</style>

      <div className="page">
        <header className="header">
          <div className="header-left">
            <span className="logo-text">friendey</span>
            <div className="header-divider" />
            <div className="week-nav">
              <button className="week-nav-btn" onClick={() => setWeekOffset(w => w - 1)}>←</button>
              <span className="week-label">{weekLabel}</span>
              <button className="week-nav-btn" onClick={() => setWeekOffset(w => w + 1)}>→</button>
              {!isCurrentWeek && (
                <button className="week-today-btn" onClick={() => setWeekOffset(0)}>Today</button>
              )}
            </div>
          </div>
          <div className="header-right">
  <button className="journal-btn" onClick={() => { setJournalOpen(true); loadJournal() }}>
    📓 <span>Open journal</span>
  </button>
  <button className="signout" onClick={signOut}>sign out →</button>
</div>
        </header>

        <div className="day-tabs">
          {weekDays.map((date, i) => (
            <button
              key={i}
              className={`day-tab${i === todayIndex && isCurrentWeek ? ' is-today' : ''}${i === selectedDay ? ' is-selected' : ''}`}
              onClick={() => setSelectedDay(i)}
            >
              <span className="day-tab-name">{DAYS_SHORT[i]}</span>
              <span className="day-tab-num">{date.getDate()}</span>
            </button>
          ))}
        </div>

        <div className="day-labels">
          {weekDays.map((date, i) => (
            <div key={i} className={`day-label-cell${i === todayIndex && isCurrentWeek ? ' is-today' : ''}`}>
              <span className="day-name-text">{DAYS[i].slice(0, 3)}</span>
              <span className="day-num-text">{date.getDate()}</span>
              {i === todayIndex && isCurrentWeek && <span className="today-tag">Today</span>}
            </div>
          ))}
        </div>

        <div className="board">
          {weekDays.map((_, i) => {
            const isToday = i === todayIndex && isCurrentWeek
            const isPast = i < todayIndex && isCurrentWeek
            const dayNotes = notes.filter(n => n.day_index === i).sort((a, b) => a.position_y - b.position_y)
            return (
              <div
                key={i}
                className={`day-col${isToday ? ' is-today' : ''}${isPast ? ' is-past' : ''}${!isToday && !isPast ? ' is-future' : ''}${hoveredDay === i ? ' is-hovered' : ''}`}
                onMouseEnter={() => setHoveredDay(i)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="notes-area" onClick={() => addNote(i)}>
                  {dayNotes.map(note => (
                    <div key={note.id} onClick={e => e.stopPropagation()}>
                      <NoteEditor
                        note={note}
                        onUpdate={handleUpdate}
                        onDelete={deleteNote}
                        autoFocus={note.id === lastAddedId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mobile-day">
          <div className="mobile-day-inner">
            {notes
              .filter(n => n.day_index === selectedDay)
              .sort((a, b) => a.position_y - b.position_y)
              .map(note => (
                <div key={note.id}>
                  <NoteEditor
                    note={note}
                    onUpdate={handleUpdate}
                    onDelete={deleteNote}
                    autoFocus={note.id === lastAddedId}
                  />
                </div>
              ))
            }
          </div>
        </div>

        <footer className="footer">
          <span className="footer-text">
            <strong>Select text</strong> to format &nbsp;·&nbsp; Click any column to write
          </span>
        </footer>
      </div>

      {journalOpen && (
        <div className="journal-overlay" onClick={() => setJournalOpen(false)}>
          <div className="journal-modal" onClick={e => e.stopPropagation()}>
            <div className="journal-header">
              <div>
                <div className="journal-title">My journal</div>
                <div className="journal-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div className="journal-header-right">
                <span className="journal-saved">{journalSaved ? 'saved ✓' : 'saving...'}</span>
                <button className="journal-close" onClick={() => setJournalOpen(false)}>×</button>
              </div>
            </div>
            <div className="journal-body">
              {!journalLoaded ? (
                <div className="journal-loading">Loading...</div>
              ) : (
                <JournalEditor
                  key={journalId || 'new'}
                  content={journalContent}
                  onChange={handleJournalChange}
                  editorKey={journalId || 'new'}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
