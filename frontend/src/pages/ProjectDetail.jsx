import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const emptyTask = { title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', due_date: '' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [editTask, setEditTask] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState('')

  const loadProject = () => API.get(`/projects/${id}/`).then(r => setProject(r.data))
  const loadTasks   = () => API.get(`/projects/${id}/tasks/`).then(r => setTasks(r.data))
  const loadUsers   = () => API.get('/auth/users/').then(r => setAllUsers(r.data))

  useEffect(() => {
    loadProject()
    loadTasks()
    if (isAdmin) loadUsers()
  }, [id])

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"

  // ── Member actions ────────────────────────────────────────
  const addMember = async () => {
    if (!selectedUserId) return toast.error('Please select a user')
    try {
      const res = await API.post(`/projects/${id}/members/`, { user_id: selectedUserId })
      toast.success(res.data.detail)
      setSelectedUserId('')
      setShowMemberForm(false)
      loadProject()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add member')
    }
  }

  const removeMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this project?`)) return
    try {
      await API.delete(`/projects/${id}/members/`, { data: { user_id: memberId } })
      toast.success(`${memberName} removed`)
      loadProject()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to remove member')
    }
  }

  // ── Task actions ──────────────────────────────────────────
  const saveTask = async () => {
    if (!taskForm.title) return toast.error('Task title is required')
    const payload = { ...taskForm, project: id, assigned_to: taskForm.assigned_to || null }
    try {
      if (editTask) {
        await API.patch(`/tasks/${editTask.id}/`, payload)
        toast.success('Task updated!')
      } else {
        await API.post(`/projects/${id}/tasks/`, payload)
        toast.success('Task created!')
      }
      setTaskForm(emptyTask)
      setShowTaskForm(false)
      setEditTask(null)
      loadTasks()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save task')
    }
  }

  const deleteTask = async (tid) => {
    if (!confirm('Delete this task?')) return
    await API.delete(`/tasks/${tid}/`)
    toast.success('Task deleted')
    loadTasks()
  }

  const startEdit = (t) => {
    setEditTask(t)
    setTaskForm({
      title: t.title, description: t.description,
      status: t.status, priority: t.priority,
      assigned_to: t.assigned_to || '', due_date: t.due_date || ''
    })
    setShowTaskForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Member: only update status of own task
  const updateStatus = async (taskId, newStatus) => {
    try {
      await API.patch(`/tasks/${taskId}/`, { status: newStatus })
      toast.success('Status updated!')
      loadTasks()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update status')
    }
  }

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)

  // Users not already in this project (for add member dropdown)
  const nonMembers = allUsers.filter(u =>
    u.role !== 'admin' &&
    !project?.members_detail?.find(m => m.id === u.id)
  )

  // Member count excluding admin/owner
  const memberCount = project?.members_detail?.filter(m => m.role !== 'admin').length || 0

  if (!project) return (
    <div className="p-8 text-gray-500 flex items-center gap-2">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
      Loading project...
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* ── Project Info Card ─────────────────────────────── */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-mono font-bold px-3 py-1 rounded-full">
                ID: #{id}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{project.description || 'No description'}</p>
            <p className="text-xs text-gray-400 mt-1">
              Owner: <span className="font-medium">{project.owner_detail?.username}</span>
              &nbsp;·&nbsp;
              {project.tasks_count} tasks &nbsp;·&nbsp; {project.completed_count} completed
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => { setShowTaskForm(!showTaskForm); setEditTask(null); setTaskForm(emptyTask) }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
              + Add Task
            </button>
          )}
        </div>

        {/* ── Members Section ──────────────────────────────── */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">👥 Team Members</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                ${memberCount >= 7 ? 'bg-red-100 text-red-600' : memberCount < 2 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                {memberCount}/7
              </span>
              {memberCount < 2 && (
                <span className="text-xs text-orange-500">⚠ Add at least 2 members</span>
              )}
              {memberCount >= 7 && (
                <span className="text-xs text-red-500">Maximum reached</span>
              )}
            </div>

            {isAdmin && memberCount < 7 && (
              <button
                onClick={() => setShowMemberForm(!showMemberForm)}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
                + Add Member
              </button>
            )}
          </div>

          {/* Add Member Dropdown */}
          {isAdmin && showMemberForm && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-indigo-600 font-medium mb-2">
                Select a user to add (Project ID: #{id})
              </p>
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">-- Select member --</option>
                  {nonMembers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
                <button onClick={addMember}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                  Add
                </button>
                <button onClick={() => { setShowMemberForm(false); setSelectedUserId('') }}
                  className="bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
              {nonMembers.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">All registered members are already in this project.</p>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="flex flex-wrap gap-2">
            {project.members_detail?.map(m => (
              <div key={m.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  ${m.role === 'admin' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                <span>
                  {m.role === 'admin' ? '👑' : '👤'} {m.username}
                </span>
                <span className="opacity-50">({m.role})</span>
                {isAdmin && m.role !== 'admin' && (
                  <button
                    onClick={() => removeMember(m.id, m.username)}
                    className="ml-1 text-red-400 hover:text-red-600 text-sm font-bold leading-none">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Task Form (Admin only) ────────────────────────── */}
      {isAdmin && showTaskForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 border-l-4 border-indigo-500">
          <h2 className="font-semibold mb-4 text-gray-700">
            {editTask ? '✏️ Edit Task' : '➕ Create New Task'}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Task Title *" value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className={inp} />
            <select value={taskForm.assigned_to}
              onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })} className={inp}>
              <option value="">Unassigned</option>
              {project.members_detail?.filter(m => m.role !== 'admin').map(m => (
                <option key={m.id} value={m.id}>{m.username}</option>
              ))}
            </select>
            <select value={taskForm.status}
              onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} className={inp}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select value={taskForm.priority}
              onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className={inp}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input type="date" value={taskForm.due_date}
              onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} className={inp} />
            <textarea placeholder="Description (optional)" value={taskForm.description}
              onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
              className={`${inp} resize-none`} rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveTask}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700">
              {editTask ? 'Update Task' : 'Create Task'}
            </button>
            <button onClick={() => { setShowTaskForm(false); setEditTask(null); setTaskForm(emptyTask) }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'todo', 'in_progress', 'done'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition
                ${filterStatus === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'}`}>
              {s === 'all' ? `All (${tasks.length})` : s === 'todo' ? `To Do (${tasks.filter(t=>t.status==='todo').length})` : s === 'in_progress' ? `In Progress (${tasks.filter(t=>t.status==='in_progress').length})` : `Done (${tasks.filter(t=>t.status==='done').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tasks List ────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id}
            className={`bg-white rounded-xl shadow p-4 ${t.is_overdue ? 'border-l-4 border-red-400' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-gray-800">{t.title}</span>
                  {t.is_overdue && (
                    <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                      OVERDUE
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-gray-400 mb-2">{t.description}</p>
                )}
                <div className="flex gap-3 flex-wrap text-xs text-gray-500">
                  <span>👤 {t.assigned_to_detail ? t.assigned_to_detail.username : 'Unassigned'}</span>
                  {t.due_date && (
                    <span className={t.is_overdue ? 'text-red-400' : ''}>
                      📅 {format(new Date(t.due_date), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge value={t.status} />
                <StatusBadge value={t.priority} />

                {isAdmin ? (
                  <>
                    <button onClick={() => startEdit(t)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg">
                      Edit
                    </button>
                    <button onClick={() => deleteTask(t.id)}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg">
                      Del
                    </button>
                  </>
                ) : (
                  // Member can only change status of their own task
                  t.assigned_to_detail?.id === user?.id && (
                    <select
                      value={t.status}
                      onChange={e => updateStatus(t.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  )
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <p className="text-gray-400 text-sm">
              {isAdmin ? 'No tasks yet. Click "+ Add Task" above to create one.' : 'No tasks in this view.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}