import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
    ? 'text-white font-semibold border-b-2 border-white pb-0.5'
    : 'text-indigo-200 hover:text-white'

  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()

  return (
    <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-lg">🗂 TaskFlow</Link>
        <Link to="/dashboard" className={`text-sm ${isActive('/dashboard')}`}>Dashboard</Link>
        <Link to="/projects" className={`text-sm ${isActive('/projects')}`}>Projects</Link>
        {user?.role !== 'admin' && (
          <Link to="/tasks" className={`text-sm ${isActive('/tasks')}`}>My Tasks</Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Profile Link */}
        <Link to="/profile"
          className="flex items-center gap-2 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
            ${user?.role === 'admin' ? 'bg-yellow-400 text-yellow-900' : 'bg-indigo-300 text-indigo-900'}`}>
            {initials}
          </div>
          <div className="text-sm leading-tight">
            <span className="block">{user?.username}</span>
            <span className="text-xs text-indigo-300">{user?.role}</span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="text-xs bg-indigo-900 hover:bg-red-600 transition px-3 py-1.5 rounded-lg">
          Logout
        </button>
      </div>
    </nav>
  )
}