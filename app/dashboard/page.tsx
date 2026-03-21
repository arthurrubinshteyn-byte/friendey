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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [activeNav, setActiveNav] = useState('My Day')
  const weekDays = getWeekDays()
  const todayStr = fmt(new Date())

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
      title,
      user_id: userId,
      scheduled_for: dateStr,
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

  const todayFull = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const totalToday = tasks.filter(t => t.scheduled_for === todayStr).length
  const doneToday = tasks.filter(t => t.scheduled_for === todayStr && t.is_complete).length

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F5F2', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: '#999', fontSize: 14 }}>Loading...</p>
    </main>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F6F5F2; }
        .app { display: flex; height: 100vh; overflow: hidden; }

        /* Sidebar */
        .sidebar { width: 240px; flex-shrink: 0; background: #fff; border-right: 1px solid #EBEBEA; display: flex; flex-direction: column; padding: 28px 16px; }
        .logo { padding: 0 8px 28px; border-bottom: 1px solid #F0EFED; margin-bottom: 20px; }
        .logo h1 { font-family: 'DM Serif Display', serif; font-size: 22px; color: #1A1A1A; letter-spacing: -0.5px; }
        .logo p { font-size: 11px; color: #B0AFA9; margin-top: 2px; font-weight: 400; letter-spacing: 0.3px; }

        .nav-section { margin-bottom: 24px; }
        .nav-label { font-size: 10px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #C8C7C1; padding: 0 8px; margin-bottom: 6px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; cursor: pointer; transition: all 0.15s; font-size: 13.5px; color: #6B6A65; font-weight: 400; border: none; background: none; width: 100%; text-align: left; }
        .nav-item:hover { background: #F6F5F2; color: #1A1A1A; }
        .nav-item.active { background: #1A1A1A; color: #fff; }
        .nav-item.active .nav-icon { opacity: 1; }
        .nav-icon { font-size: 15px; width: 20px; text-align: center; opacity: 0.7; }
        .nav-badge { margin-left: auto; background: #F0EFED; color: #999; font-size: 10px; padding: 1px 6px; border-radius: 10px; font-weight: 500; }
        .nav-item.active .nav-badge { background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }

        .sidebar-bottom { margin-top: auto; padding-top: 16px; border-top: 1px solid #F0EFED; }
        .signout-btn { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #B0AFA9; cursor: pointer; padding: 6px 8px; border-radius: 6px; border: none; background: none; width: 100%; transition: all 0.15s; }
        .signout-btn:hover { color: #6B6A65; background: #F6F5F2; }

        /* Main */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topbar { padding: 20px 28px 16px; background: #fff; border-bottom: 1px solid #EBEBEA; display: flex; align-items: flex-end; justify-content: space-between; flex-shrink: 0; }
        .topbar-left h2 { font-family: 'DM Serif Display', serif; font-size: 24px; color: #1A1A1A; letter-spacing: -0.3px; }
        .topbar-left p { font-size: 12.5px; color: #B0AFA9; margin-top: 3px; }
        .progress-pill { display: flex; align-items: center; gap: 10px; background: #F6F5F2; border-radius: 20px; padding: 6px 14px; }
        .progress-bar-wrap { width: 80px; height: 4px; background: #E8E7E3; border-radius: 2px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: #1A1A1A; border-radius: 2px; transition: width 0.4s ease; }
        .progress-text { font-size: 12px; color: #999; white-space: nowrap; }

        /* Week grid */
        .week-wrap { flex: 1; overflow-x: auto; overflow-y: hidden; padding: 20px 20px; }
        .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; min-width: 860px; height: 100%; }

        .day-col { display: flex; flex-direction: column; background: #fff; border-radius: 14px; border: 1px solid #EBEBEA; overflow: hidden; transition: box-shadow 0.2s; }
        .day-col:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .day-col.today { border-color: #1A1A1A; box-shadow: 0 0 0 1px #1A1A1A; }

        .day-header { padding: 14px 12px 10px; border-bottom: 1px solid #F6F5F2; flex-shrink: 0; }
        .day-name { font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #C8C7C1; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
        .day-col.today .day-name { color: #1A1A1A; }
        .day-count { font-size: 10px; color: #D0CFC9; font-weight: 500; letter-spacing: 0; text-transform: none; }
        .day-num { font-family: 'DM Serif Display', serif; font-size: 26px; color: #D0CFC9; line-height: 1; }
        .day-col.today .day-num { color: #1A1A1A; }
        .today-dot { width: 5px; height: 5px; background: #1A1A1A; border-radius: 50%; margin-top: 6px; }

        .task-list { flex: 1; overflow-y: auto; padding: 8px 8px 4px; display: flex; flex-direction: column; gap: 2px; }
        .task-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 6px; border-radius: 8px; cursor: pointer; transition: background 0.15s; group: true; }
        .task-item:hover { background: #F6F5F2; }
        .task-check { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #D0CFC9; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; cursor: pointer; background: none; }
        .task-check:hover { border-color: #1A1A1A; }
        .task-check.done { background: #1A1A1A; border-color: #1A1A1A; }
        .task-title { flex: 1; font-size: 12.5px; color: #3D3C38; line-height: 1.5; font-weight: 400; }
        .task-title.done { text-decoration: line-through; color: #C8C7C1; }
        .task-delete { opacity: 0; font-size: 16px; color: #D0CFC9; cursor: pointer; background: none; border: none; padding: 0; line-height: 1; margin-top: 0px; flex-shrink: 0; transition: all 0.15s; }
        .task-item:hover .task-delete { opacity: 1; }
        .task-delete:hover { color: #E07070; }

        .day-input-wrap { padding: 8px 8px 10px; flex-shrink: 0; border-top: 1px solid #F6F5F2; }
        .day-input { width: 100%; font-size: 12px; color: #6B6A65; background: transparent; border: none; outline: none; font-family: 'DM Sans', sans-serif; }
        .day-input::placeholder { color: #C8C7C1; }

        /* Scrollbar */
        .task-list::-webkit-scrollbar { width: 3px; }
        .task-list::-webkit-scrollbar-thumb { background: #E8E7E3; border-radius: 2px; }
        .week-wrap::-webkit-scrollbar { height: 4px; }
        .week-wrap::-webkit-scrollbar-thumb { background: #E8E7E3; border-radius: 2px; }
      `}</style>

      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <h1>friendey.</h1>
            <p>your life, organized</p>
          </div>

          <div className="nav-section">
            <div className="nav-label">Today</div>
            {[
              { icon: '☀️', label: 'My Day', count: totalToday },
              { icon: '⭐', label: 'Important' },
              { icon: '📅', label: 'Planned' },
            ].map(({ icon, label, count }) => (
              <button
                key={label}
                className={`nav-item ${activeNav === label ? 'active' : ''}`}
                onClick={() => setActiveNav(label)}
              >
                <span className="nav-icon">{icon}</span>
                {label}
                {count !== undefined && count > 0 && (
                  <span className="nav-badge">{count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-label">Lists</div>
            {[
              { icon: '💼', label: 'Work' },
              { icon: '🏠', label: 'Personal' },
              { icon: '❤️', label: 'Health' },
            ].map(({ icon, label }) => (
              <button
                key={label}
                className={`nav-item ${activeNav === label ? 'active' : ''}`}
                onClick={() => setActiveNav(label)}
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </button>
            ))}
            <button className="nav-item" style={{ color: '#B0AFA9', marginTop: 4 }}>
              <span className="nav-icon" style={{ fontSize: 18, fontWeight: 300 }}>+</span>
              New list
            </button>
          </div>

          <div className="sidebar-bottom">
            <button className="signout-btn" onClick={signOut}>
              <span>↗</span> Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              <h2>{todayFull}</h2>
              <p>{totalToday} tasks · {doneToday} completed</p>
            </div>
            {totalToday > 0 && (
              <div className="progress-pill">
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${(doneToday / totalToday) * 100}%` }} />
                </div>
                <span className="progress-text">{Math.round((doneToday / totalToday) * 100)}%</span>
              </div>
            )}
          </div>

          <div className="week-wrap">
            <div className="week-grid">
              {weekDays.map((date, i) => {
                const dateStr = fmt(date)
                const isToday = dateStr === todayStr
                const dayTasks = tasks.filter(t => t.scheduled_for === dateStr)
                const done = dayTasks.filter(t => t.is_complete).length

                return (
                  <div key={dateStr} className={`day-col${isToday ? ' today' : ''}`}>
                    <div className="day-header">
                      <div className="day-name">
                        {DAYS[i]}
                        {dayTasks.length > 0 && (
                          <span className="day-count">{done}/{dayTasks.length}</span>
                        )}
                      </div>
                      <div className="day-num">{date.getDate()}</div>
                      {isToday && <div className="today-dot" />}
                    </div>

                    <div className="task-list">
                      {dayTasks.map(task => (
                        <div key={task.id} className="task-item">
                          <button
                            className={`task-check${task.is_complete ? ' done' : ''}`}
                            onClick={() => toggleTask(task)}
                          >
                            {task.is_complete && (
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          <span className={`task-title${task.is_complete ? ' done' : ''}`}>
                            {task.title}
                          </span>
                          <button className="task-delete" onClick={() => deleteTask(task.id)}>×</button>
                        </div>
                      ))}
                    </div>

                    <div className="day-input-wrap">
                      <input
                        className="day-input"
                        type="text"
                        placeholder="+ Add task..."
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
