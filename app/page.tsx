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
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
      <p className="text-gray-400 text-sm">Loading...</p>
    </main>
  )

  return (
    <div className="flex min-h-screen bg-[#FAFAF9]">

      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-gray-100 flex flex-col py-8 px-5 bg-white">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-gray-800 tracking-tight">friendey.</h1>
          <p className="text-xs text-gray-400 mt-0.5">your life, organized</p>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-3">Today</p>
        <nav className="space-y-1 mb-6">
          {[['☀️', 'My Day'], ['⭐', 'Important'], ['📅', 'Planned']].map(([icon, label]) => (
            <button key={label} className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              <span className="text-base">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-3">Lists</p>
        <nav className="space-y-1">
          {[['💼', 'Work'], ['🏠', 'Personal'], ['❤️', 'Health']].map(([icon, label]) => (
            <button key={label} className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              <span className="text-base">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button onClick={signOut} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition">
            <span>→</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">{todayFull}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{totalToday} tasks · {doneToday} completed</p>
        </div>

        {/* 7-column week grid */}
        <div className="flex-1 overflow-x-auto px-6 py-6">
          <div className="grid grid-cols-7 gap-3 min-w-[900px] h-full">
            {weekDays.map((date, i) => {
              const dateStr = fmt(date)
              const isToday = dateStr === todayStr
              const dayTasks = tasks.filter(t => t.scheduled_for === dateStr)
              const done = dayTasks.filter(t => t.is_complete).length

              return (
                <div
                  key={dateStr}
                  className={`flex flex-col rounded-2xl border p-3 min-h-[500px] ${
                    isToday
                      ? 'border-gray-800 bg-white shadow-sm'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  {/* Day header */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold uppercase tracking-widest ${isToday ? 'text-gray-800' : 'text-gray-300'}`}>
                        {DAYS[i]}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-xs text-gray-300">{done}/{dayTasks.length}</span>
                      )}
                    </div>
                    <span className={`text-2xl font-semibold ${isToday ? 'text-gray-800' : 'text-gray-300'}`}>
                      {date.getDate()}
                    </span>
                    {isToday && <div className="w-4 h-0.5 bg-gray-800 rounded-full mt-1"/>}
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 group p-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        <button
                          onClick={() => toggleTask(task)}
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                            task.is_complete ? 'bg-gray-800 border-gray-800' : 'border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {task.is_complete && (
                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-xs leading-relaxed ${task.is_complete ? 'line-through text-gray-300' : 'text-gray-600'}`}>
                          {task.title}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-sm leading-none mt-0.5"
                        >×</button>
                      </div>
                    ))}
                  </div>

                  {/* Add task input */}
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <input
                      type="text"
                      placeholder="+ Add task..."
                      value={newTask[dateStr] ?? ''}
                      onChange={e => setNewTask(prev => ({ ...prev, [dateStr]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addTask(dateStr)}
                      className="w-full text-xs text-gray-500 placeholder-gray-300 bg-transparent outline-none py-1"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
