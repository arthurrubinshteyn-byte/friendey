'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Task = {
  id: string
  title: string
  is_complete: boolean
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserEmail(user.email ?? '')
      await fetchTasks()
      setLoading(false)
    }
    init()
  }, [])

  const fetchTasks = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('scheduled_for', today)
      .order('created_at', { ascending: true })
    setTasks(data ?? [])
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('tasks').insert({
      title: newTask.trim(),
      user_id: user!.id,
      scheduled_for: today,
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setNewTask('')
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

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const completed = tasks.filter(t => t.is_complete).length

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </main>
  )

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">Friendey</h1>
            <p className="text-gray-400 text-sm mt-1">{today}</p>
          </div>
          <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600 transition mt-1">
            Sign out
          </button>
        </div>

        {/* Progress */}
        {tasks.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{completed} of {tasks.length} done</span>
              <span>{Math.round((completed / tasks.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-800 rounded-full transition-all duration-500"
                style={{ width: `${(completed / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Add task */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition bg-white"
          />
          <button
            onClick={addTask}
            className="bg-gray-800 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
          >
            Add
          </button>
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          {tasks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-300 text-4xl mb-3">✦</p>
              <p className="text-gray-400 text-sm">No tasks yet — add one above</p>
            </div>
          )}
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 group"
            >
              <button
                onClick={() => toggleTask(task)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  task.is_complete ? 'bg-gray-800 border-gray-800' : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                {task.is_complete && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${task.is_complete ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {tasks.length > 0 && completed === tasks.length && (
          <p className="text-center text-sm text-gray-400 mt-10">All done! Great work today 🎉</p>
        )}
      </div>
    </main>
  )
}
