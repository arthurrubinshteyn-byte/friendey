'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Task = {
  id: string
  title: string
  is_complete: boolean
  scheduled_for: string
}

function getWeekDays() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmt(date: Date) {
  return date.toISOString().split('T')[0]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [activeNav, setActiveNav] = useState('Week')
  const weekDays = getWeekDays()
  const todayStr = fmt(new Date())
  const now = new Date()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const start = fmt(weekDays[0])
      const end = fmt(weekDays[6])
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .gte('scheduled_for', start)
        .lte('scheduled_for', end)
        .order('created_at', { ascending: true })
      setTasks(data ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const addTask = async (dateStr: string) => {
    const title = newTask[dateStr]?.trim()
    if (!title) return
    const { data } = await supabase.from('tasks').insert({
      title, user_id: userId, scheduled_for: dateStr,
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setNewTask(prev => ({ ...prev, [dateStr]: '' }))
  }

  const toggleTask = async (task: Task) => {
    await supabase.from('tasks').update({ is_complete: !task.is_complete }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_complete: !t.is_complete } : t))
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const totalToday = tasks.filter(t => t.scheduled_for === todayStr).length
  const doneToday = tasks.filter(t => t.scheduled_for === todayStr && t.is_complete).length
  const totalWeek = tasks.length
  const doneWeek = tasks.filter(t => t.is_complete).length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0F0F' }}>
      <div style={{ color: '#444', fontSize: 13, fontFamily: 'monospace', letterSpacing: 2 }}>loading...</div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body { font-family: 'Geist', -apple-system, sans-serif; background: #0F0F0F; color: #E8E6E0; }

        .shell { display: flex; height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
          width: 220px; flex-shrink: 0;
          background: #141414;
          border-right: 1px solid #222;
          display: flex; flex-direction: column;
          padding: 0;
          overflow: hidden;
        }
        .sidebar-top { padding: 24px 20px 20px; border-bottom: 1px solid #1E1E1E; }
        .brand { display: flex; align-items: baseline; gap: 6px; margin-bottom: 20px; }
        .brand-name {
          font-family: 'Instrument Serif', serif;
          font-size: 20px; color: #F0EDE6;
          letter-spacing: -0.3px;
        }
        .brand-dot { width: 5px; height: 5px; background: #4ADE80; border-radius: 50%; margin-bottom: 2px; flex-shrink: 0; }

        .date-card { background: #1A1A1A; border-radius: 10px; padding: 12px 14px; border: 1px solid #222; }
        .date-card-day { font-size: 11px; color: #555; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 500; margin-bottom: 2px; }
        .date-card-full { font-family: 'Instrument Serif', serif; font-size: 17px; color: #E8E6E0; line-height: 1.2; }
        .date-card-stats { display: flex; gap: 12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #222; }
        .stat { display: flex; flex-direction: column; }
        .stat-num { font-size: 18px; font-weight: 500; color: #F0EDE6; line-height: 1; }
        .stat-label { font-size: 10px; color: #555; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.4px; }

        .sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
        .nav-group { margin-bottom: 20px; }
        .nav-group-label { font-size: 9.5px; font-weight: 500; letter-spacing: 1.4px; text-transform: uppercase; color: #3A3A3A; padding: 0 8px; margin-bottom: 4px; }
        .nav-btn {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 7px 8px; border-radius: 7px;
          font-size: 13px; color: #666; font-weight: 400;
          background: none; border: none; cursor: pointer;
          transition: all 0.12s; text-align: left;
          font-family: 'Geist', sans-serif;
        }
        .nav-btn:hover { background: #1E1E1E; color: #B0AE A8; }
        .nav-btn.active { background: #242424; color: #E8E6E0; }
        .nav-btn .icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
        .nav-btn .count { margin-left: auto; font-size: 10px; background: #2A2A2A; color: #666; padding: 1px 6px; border-radius: 8px; }
        .nav-btn.active .count { background: #333; color: #999; }

        .add-list-btn { color: #3A3A3A !important; }
        .add-list-btn:hover { color: #666 !important; }

        .sidebar-footer { padding: 14px 12px; border-top: 1px solid #1E1E1E; }
        .user-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 7px; cursor: pointer; transition: background 0.12s; border: none; background: none; width: 100%; text-align: left; font-family: 'Geist', sans-serif; }
        .user-row:hover { background: #1E1E1E; }
        .avatar { width: 26px; height: 26px; background: #2A2A2A; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #666; flex-shrink: 0; }
        .user-info { flex: 1; min-width: 0; }
        .user-name { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .signout-label { font-size: 10px; color: #444; }

        /* ── Main ── */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #0F0F0F; }

        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #1A1A1A;
          flex-shrink: 0;
        }
        .view-tabs { display: flex; gap: 2px; background: #1A1A1A; border-radius: 8px; padding: 3px; }
        .view-tab {
          font-size: 12px; padding: 5px 12px; border-radius: 6px;
          border: none; background: none; color: #555;
          cursor: pointer; font-family: 'Geist', sans-serif;
          transition: all 0.12s;
        }
        .view-tab.active { background: #242424; color: #E8E6E0; }
        .week-label { font-family: 'Instrument Serif', serif; font-size: 15px; color: #555; }
        .week-progress { display: flex; align-items: center; gap: 10px; }
        .prog-track { width: 100px; height: 3px; background: #222; border-radius: 2px; overflow: hidden; }
        .prog-fill { height: 100%; background: #4ADE80; border-radius: 2px; transition: width 0.5s ease; }
        .prog-label { font-size: 11px; color: #444; }

        /* ── Week grid ── */
        .week-scroll { flex: 1; overflow-x: auto; overflow-y: hidden; padding: 16px; }
        .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; min-width: 840px; height: 100%; }

        .day-card {
          display: flex; flex-direction: column;
          background: #141414;
          border: 1px solid #1E1E1E;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .day-card:hover { border-color: #2A2A2A; }
        .day-card.today { border-color: #2D4A2D; background: #111811; }

        .day-head { padding: 14px 12px 10px; flex-shrink: 0; }
        .day-head-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }
        .day-weekday { font-size: 10px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; color: #3A3A3A; }
        .day-card.today .day-weekday { color: #4ADE80; }
        .day-tally { font-size: 10px; color: #333; }
        .day-card.today .day-tally { color: #2D6B2D; }
        .day-date { font-family: 'Instrument Serif', serif; font-size: 28px; color: #2A2A2A; line-height: 1; }
        .day-card.today .day-date { color: #E8E6E0; }
        .today-bar { height: 2px; width: 20px; background: #4ADE80; border-radius: 1px; margin-top: 8px; }

        .task-area { flex: 1; overflow-y: auto; padding: 6px 8px 4px; }
        .task-row { display: flex; align-items: flex-start; gap: 8px; padding: 5px 5px; border-radius: 7px; transition: background 0.1s; }
        .task-row:hover { background: #1A1A1A; }
        .task-row:hover .del-btn { opacity: 1; }
        .check-btn {
          width: 15px; height: 15px; border-radius: 50%;
          border: 1px solid #2E2E2E; flex-shrink: 0; margin-top: 2px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; background: none; transition: all 0.15s;
        }
        .check-btn:hover { border-color: #4ADE80; }
        .check-btn.checked { background: #4ADE80; border-color: #4ADE80; }
        .task-text { flex: 1; font-size: 12.5px; color: #777; line-height: 1.5; font-weight: 400; }
        .task-text.checked { text-decoration: line-through; color: #333; }
        .del-btn { opacity: 0; background: none; border: none; color: #333; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; margin-top: 1px; transition: all 0.1s; flex-shrink: 0; }
        .del-btn:hover { color: #E07070; }

        .input-area { padding: 8px 8px 10px; flex-shrink: 0; border-top: 1px solid #1A1A1A; }
        .task-input {
          width: 100%; background: none; border: none; outline: none;
          font-size: 12px; color: #555; font-family: 'Geist', sans-serif;
        }
        .task-input::placeholder { color: #2E2E2E; }
        .day-card.today .task-input::placeholder { color: #2A4A2A; }

        .task-area::-webkit-scrollbar { width: 2px; }
        .task-area::-webkit-scrollbar-thumb { background: #222; border-radius: 1px; }
        .week-scroll::-webkit-scrollbar { height: 3px; }
        .week-scroll::-webkit-scrollbar-thumb { background: #1E1E1E; border-radius: 2px; }
      `}</style>

      <div className="shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="brand">
              <span className="brand-name">friendey</span>
              <div className="brand-dot" />
            </div>
            <div className="date-card">
              <div className="date-card-day">{DAYS[now.getDay()]}</div>
              <div className="date-card-full">{MONTHS[now.getMonth()]} {now.getDate()}, {now.getFullYear()}</div>
              <div className="date-card-stats">
                <div className="stat">
                  <span className="stat-num">{totalToday}</span>
                  <span className="stat-label">today</span>
                </div>
                <div className="stat">
                  <span className="stat-num">{doneToday}</span>
                  <span className="stat-label">done</span>
                </div>
                <div className="stat">
                  <span className="stat-num">{totalWeek - doneWeek}</span>
                  <span className="stat-label">left</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-group">
              <div className="nav-group-label">Views</div>
              {[
                { icon: '▦', label: 'Week' },
                { icon: '☀', label: 'Today' },
                { icon: '★', label: 'Important' },
                { icon: '◷', label: 'Upcoming' },
              ].map(({ icon, label }) => (
                <button key={label} className={`nav-btn ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}>
                  <span className="icon">{icon}</span>
                  {label}
                  {label === 'Today' && totalToday > 0 && <span className="count">{totalToday}</span>}
                </button>
              ))}
            </div>
            <div className="nav-group">
              <div className="nav-group-label">Lists</div>
              {[
                { icon: '◈', label: 'Work' },
                { icon: '◉', label: 'Personal' },
                { icon: '◇', label: 'Health' },
              ].map(({ icon, label }) => (
                <button key={label} className={`nav-btn ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}>
                  <span className="icon">{icon}</span>
                  {label}
                </button>
              ))}
              <button className="nav-btn add-list-btn">
                <span className="icon">+</span>
                New list
              </button>
            </div>
          </nav>

          <div className="sidebar-footer">
            <button className="user-row" onClick={signOut}>
              <div className="avatar">u</div>
              <div className="user-info">
                <div className="user-name">My account</div>
                <div className="signout-label">Sign out →</div>
              </div>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="topbar">
            <div className="view-tabs">
              {['Week', 'Day', 'Month'].map(v => (
                <button key={v} className={`view-tab ${activeNav === v ? 'active' : ''}`} onClick={() => setActiveNav(v)}>{v}</button>
              ))}
            </div>
            <div className="week-label">
              {MONTHS[weekDays[0].getMonth()]} {weekDays[0].getDate()} – {MONTHS[weekDays[6].getMonth()]} {weekDays[6].getDate()}
            </div>
            <div className="week-progress">
              <div className="prog-track">
                <div className="prog-fill" style={{ width: totalWeek > 0 ? `${(doneWeek / totalWeek) * 100}%` : '0%' }} />
              </div>
              <span className="prog-label">{doneWeek}/{totalWeek} this week</span>
            </div>
          </div>

          <div className="week-scroll">
            <div className="week-grid">
              {weekDays.map((date, i) => {
                const dateStr = fmt(date)
                const isToday = dateStr === todayStr
                const dayTasks = tasks.filter(t => t.scheduled_for === dateStr)
                const done = dayTasks.filter(t => t.is_complete).length

                return (
                  <div key={dateStr} className={`day-card${isToday ? ' today' : ''}`}>
                    <div className="day-head">
                      <div className="day-head-top">
                        <span className="day-weekday">{DAYS_SHORT[date.getDay()]}</span>
                        {dayTasks.length > 0 && <span className="day-tally">{done}/{dayTasks.length}</span>}
                      </div>
                      <div className="day-date">{date.getDate()}</div>
                      {isToday && <div className="today-bar" />}
                    </div>

                    <div className="task-area">
                      {dayTasks.map(task => (
                        <div key={task.id} className="task-row">
                          <button className={`check-btn${task.is_complete ? ' checked' : ''}`} onClick={() => toggleTask(task)}>
                            {task.is_complete && (
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="#0F0F0F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          <span className={`task-text${task.is_complete ? ' checked' : ''}`}>{task.title}</span>
                          <button className="del-btn" onClick={() => deleteTask(task.id)}>×</button>
                        </div>
                      ))}
                    </div>

                    <div className="input-area">
                      <input
                        className="task-input"
                        type="text"
                        placeholder="+ add task"
                        value={newTask[dateStr] ?? ''}
                        onChange={e => setNewTask(prev => ({ ...prev, [dateStr]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addTask(dateStr)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
