import { useEffect, useState, useRef } from 'react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

// ── CHATBOT COMPONENT (built-in) ─────────────────────────────
function ChatBot({ userTasks = [], userProjects = [] }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: user?.role === 'admin'
        ? `Hi ${user?.username || 'there'} 👋 I'm your TaskFlow Assistant! I can help you manage projects, track overdue tasks, get team insights, or answer any admin questions.`
        : `Hi ${user?.username || 'there'} 👋 I'm your TaskFlow Assistant! Ask me anything about your tasks, deadlines, or work in general.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

  const taskContext = userTasks.length > 0
      ? `\n\nTasks:\n${userTasks.map(t =>
          `- "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Due: ${t.due_date || 'None'} | Overdue: ${t.is_overdue ? 'YES' : 'No'}`
        ).join('\n')}`
      : '\n\nNo tasks available.'

    const projectContext = userProjects.length > 0
      ? `\n\nProjects:\n${userProjects.map(p => `- "${p.name}" (${p.tasks_count} tasks, ${p.completed_count} done, ${p.members_detail?.length || 0} members)`).join('\n')}`
      : '\n\nNo projects available.'

    const systemPrompt = user?.role === 'admin'
    ? `You are TaskFlow Assistant, a helpful AI for project admins.
Help with: managing projects, assigning tasks, team productivity, deadlines, overdue tasks, member management, app usage.
Be professional, concise, and proactive with suggestions.
User's name: ${user?.username}. Role: Admin (full control over projects and tasks).
${taskContext}${projectContext}`
    : `You are TaskFlow Assistant, a helpful AI for team members.
Help with: task questions, work advice, deadlines, productivity tips, app usage.
Be friendly, short, and clear. User's name: ${user?.username}. Role: member.
${taskContext}${projectContext}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text }
          ]
        })
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || "Sorry, I couldn't respond. Try again!"
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment."
      }])
    } finally {
      setLoading(false)
    }
  }

  const adminQuickQuestions = [
    "Which tasks are overdue?",
    "How many members do I have?",
    "Which project has most tasks?",
    "Tips for managing remote teams",
  ]

  const memberQuickQuestions = [
    "What are my overdue tasks?",
    "What's my highest priority task?",
    "How do I update my task status?",
    "Give me productivity tips",
  ]

  const quickQuestions = user?.role === 'admin' ? adminQuickQuestions : memberQuickQuestions

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110">
        {isOpen
          ? <span className="text-xl font-bold">✕</span>
          : <span className="text-2xl">💬</span>
        }
        {!isOpen && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-sm">AI</div>
            <div>
              <p className="text-white font-semibold text-sm">TaskFlow Assistant</p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <p className="text-indigo-200 text-xs">Online — ask me anything</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="ml-auto text-indigo-200 hover:text-white text-xl">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map(delay => (
                      <span key={delay}
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions — only on first message */}
          {messages.length === 1 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, i) => (
                  <button key={i}
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                    className="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded-full hover:bg-indigo-50">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type your question... (Enter to send)"
              rows={1}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl px-3 py-2 transition text-sm font-bold">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── MAIN DASHBOARD ───────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    API.get('/dashboard/').then(r => setData(r.data))
  }, [])

  if (!data) return <div className="p-8 text-gray-500">Loading dashboard...</div>

  // ── ADMIN DASHBOARD ──────────────────────────────────────
  if (user?.role === 'admin') {
    const stats = [
      { label: 'Projects',    value: data.total_projects, color: 'bg-indigo-500' },
      { label: 'Total Tasks', value: data.total_tasks,    color: 'bg-blue-500'   },
      { label: 'Members',     value: data.total_members,  color: 'bg-purple-500' },
      { label: 'In Progress', value: data.in_progress,    color: 'bg-yellow-500' },
      { label: 'Completed',   value: data.done,           color: 'bg-green-500'  },
      { label: 'Overdue',     value: data.overdue,        color: 'bg-red-500'    },
    ]
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">ADMIN</span>
        </div>
        <p className="text-gray-500 text-sm mb-6">Full control — manage projects, members and tasks</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow p-4 text-center">
              <div className={`text-2xl font-bold text-white ${s.color} rounded-lg py-2 mb-2`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">📁 Recent Projects</h2>
              <Link to="/projects" className="text-xs text-indigo-600 hover:underline">View all →</Link>
            </div>
            {data.recent_projects.length === 0
              ? <p className="text-sm text-gray-400">No projects yet.</p>
              : data.recent_projects.map(p => (
                <Link to={`/projects/${p.id}`} key={p.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 px-1 rounded">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.tasks_count} tasks · {p.completed_count} done · {p.members_detail?.length} members
                    </p>
                  </div>
                </Link>
              ))
            }
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-red-600 mb-4">🚨 Overdue Tasks</h2>
            {data.overdue_tasks.length === 0
              ? <p className="text-sm text-gray-400">No overdue tasks. Great work!</p>
              : data.overdue_tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t.title}</p>
                    <p className="text-xs text-gray-400">
                      {t.assigned_to_detail ? `👤 ${t.assigned_to_detail.username}` : 'Unassigned'}
                      {t.due_date ? ` · Due: ${format(new Date(t.due_date), 'MMM dd')}` : ''}
                    </p>
                  </div>
                  <StatusBadge value={t.priority} />
                </div>
              ))
            }
          </div>
        </div>

        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-indigo-700 mb-2">⚡ Quick Actions</p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/projects"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
              + Create Project
            </Link>
            <Link to="/projects"
              className="bg-white border border-indigo-300 text-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-50">
              👥 Manage Members
            </Link>
          </div>
        </div>

        {/* ── AI Chatbot (Admin) ── */}
        <ChatBot
          userTasks={data.overdue_tasks}
          userProjects={data.recent_projects}
        />
      </div>
    )
  }

  // ── MEMBER DASHBOARD ─────────────────────────────────────
  const stats = [
    { label: 'My Projects', value: data.my_projects,    color: 'bg-indigo-500' },
    { label: 'My Tasks',    value: data.assigned_to_me, color: 'bg-blue-500'   },
    { label: 'To Do',       value: data.todo,           color: 'bg-gray-400'   },
    { label: 'In Progress', value: data.in_progress,    color: 'bg-yellow-500' },
    { label: 'Done',        value: data.done,           color: 'bg-green-500'  },
    { label: 'Overdue',     value: data.overdue,        color: 'bg-red-500'    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.username} 👋</h1>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">MEMBER</span>
      </div>
      <p className="text-gray-500 text-sm mb-6">Your tasks and projects assigned by admin</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow p-4 text-center">
            <div className={`text-2xl font-bold text-white ${s.color} rounded-lg py-2 mb-2`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">⚡ My Assigned Tasks</h2>
          {data.my_assigned_tasks.length === 0
            ? <p className="text-sm text-gray-400">No tasks assigned to you yet.</p>
            : data.my_assigned_tasks.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t.title}</p>
                  {t.due_date && (
                    <p className={`text-xs ${t.is_overdue ? 'text-red-400' : 'text-gray-400'}`}>
                      Due: {format(new Date(t.due_date), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <StatusBadge value={t.status} />
                  <StatusBadge value={t.priority} />
                </div>
              </div>
            ))
          }
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">📁 My Projects</h2>
          {data.my_projects_list.length === 0
            ? <p className="text-sm text-gray-400">You haven't been added to any project yet.</p>
            : data.my_projects_list.map(p => (
              <Link to={`/projects/${p.id}`} key={p.id}
                className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 px-1 rounded">
                <div>
                  <p className="text-sm font-medium text-indigo-600">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.tasks_count} tasks · {p.completed_count} done</p>
                </div>
              </Link>
            ))
          }
        </div>
      </div>

      {data.overdue_tasks.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="font-semibold text-red-600 mb-3">🚨 Overdue Tasks</h2>
          {data.overdue_tasks.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{t.title}</p>
                {t.due_date && <p className="text-xs text-red-400">Due: {format(new Date(t.due_date), 'MMM dd, yyyy')}</p>}
              </div>
              <StatusBadge value={t.priority} />
            </div>
          ))}
        </div>
      )}

      {/* ── AI Chatbot (Members only) ── */}
      <ChatBot
        userTasks={data.my_assigned_tasks}
        userProjects={data.my_projects_list}
      />
    </div>
  )
}