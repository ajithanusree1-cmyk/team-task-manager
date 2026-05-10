import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '', role: 'member' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password) return toast.error('Fill all fields')
    if (form.password !== form.password2) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.password2, form.role)
      navigate('/dashboard')
    } catch (e) {
      const errs = e.response?.data
      const msg = typeof errs === 'object' ? Object.values(errs).flat().join(' ') : 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-indigo-700 mb-1">Create Account</h1>
        <p className="text-gray-500 text-sm mb-6">Join TaskFlow today</p>
        <div className="space-y-4">
          <input placeholder="Username" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })} className={inp} />
          <input type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} className={inp} />
          <input type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} className={inp} />
          <input type="password" placeholder="Confirm Password" value={form.password2}
            onChange={e => setForm({ ...form, password2: e.target.value })} className={inp} />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inp}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}