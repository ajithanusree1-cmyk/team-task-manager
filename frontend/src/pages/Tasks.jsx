import { useEffect, useState } from 'react'
import API from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import { format } from 'date-fns'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { API.get('/tasks/').then(r => setTasks(r.data)) }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Tasks</h1>
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'todo', 'in_progress', 'done'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border
              ${filter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
            {s === 'all' ? 'All' : s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done'}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id} className={`bg-white rounded-xl shadow p-4 flex items-center justify-between
            ${t.is_overdue ? 'border-l-4 border-red-400' : ''}`}>
            <div>
              <p className="font-medium text-gray-800">{t.title}</p>
              <p className="text-xs text-gray-400">
                {t.due_date ? `Due: ${format(new Date(t.due_date), 'MMM dd, yyyy')}` : 'No due date'}
                {t.is_overdue ? ' · 🚨 OVERDUE' : ''}
              </p>
              {t.assigned_to_detail && <p className="text-xs text-gray-500">👤 {t.assigned_to_detail.username}</p>}
            </div>
            <div className="flex gap-2">
              <StatusBadge value={t.status} />
              <StatusBadge value={t.priority} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">No tasks found.</p>}
      </div>
    </div>
  )
}