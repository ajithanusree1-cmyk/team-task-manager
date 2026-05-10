import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = () => API.get('/projects/').then(r => setProjects(r.data))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.name) return toast.error('Project name required')
    try {
      await API.post('/projects/', form)
      toast.success('Project created!')
      setForm({ name: '', description: '' })
      setShowForm(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create project')
    }
  }

  const del = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return
    try {
      await API.delete(`/projects/${id}/`)
      toast.success('Project deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + New Project
          </button>
        )}
      </div>

      {/* Create Project Form — Admin only */}
      {user?.role === 'admin' && showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 border-l-4 border-indigo-400">
          <h2 className="font-semibold mb-4 text-gray-700">Create New Project</h2>
          <input
            placeholder="Project Name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-3 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2">
            <button onClick={create} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Create</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">

            {/* Project Header */}
            <div className="flex justify-between items-start mb-1">
              <Link to={`/projects/${p.id}`}
                className="font-semibold text-indigo-600 hover:underline text-lg">
                {p.name}
              </Link>
              {user?.role === 'admin' && (
                <button onClick={() => del(p.id)}
                  className="text-red-400 hover:text-red-600 text-xs">
                  Delete
                </button>
              )}
            </div>

            {/* Project ID Badge */}
            <p className="text-xs text-gray-400 mb-2">
              Project ID: <span className="font-mono font-bold text-indigo-500">#{p.id}</span>
            </p>

            <p className="text-gray-500 text-sm mb-3">{p.description || 'No description'}</p>

            {/* Stats */}
            <div className="flex gap-4 text-xs text-gray-500 mb-3">
              <span>👤 {p.owner_detail?.username}</span>
              <span>📋 {p.tasks_count} tasks</span>
              <span>✅ {p.completed_count} done</span>
              <span>👥 {p.members_detail?.length} members</span>
            </div>

            {/* Members Preview */}
            <div className="flex flex-wrap gap-1 mb-3">
              {p.members_detail?.slice(0, 5).map(m => (
                <span key={m.id}
                  className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                  {m.username}
                </span>
              ))}
              {p.members_detail?.length > 5 && (
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                  +{p.members_detail.length - 5} more
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Link to={`/projects/${p.id}`}
                className="flex-1 text-center text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700">
                View Tasks
              </Link>
              {user?.role === 'admin' && (
                <Link to={`/projects/${p.id}`}
                  className="flex-1 text-center text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 py-1.5 rounded-lg hover:bg-indigo-100">
                  👥 Manage Members
                </Link>
              )}
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400">
            {user?.role === 'admin'
              ? 'No projects yet. Click "+ New Project" to create one!'
              : 'You have not been added to any project yet.'}
          </div>
        )}
      </div>
    </div>
  )
}