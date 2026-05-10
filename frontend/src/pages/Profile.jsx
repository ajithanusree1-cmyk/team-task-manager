import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, login } = useAuth()

  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"

  // ── Update Profile ────────────────────────────────────────
  const updateProfile = async () => {
    if (!profileForm.username || !profileForm.email) {
      return toast.error('Username and email are required')
    }
    setProfileLoading(true)
    try {
      const { data } = await API.patch('/auth/me/', profileForm)
      // Update stored user info
      const access = localStorage.getItem('access_token')
      toast.success('Profile updated successfully!')
      // Reload page to reflect new name in navbar
      setTimeout(() => window.location.reload(), 1000)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // ── Change Password ───────────────────────────────────────
  const changePassword = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      return toast.error('All password fields are required')
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('New passwords do not match')
    }
    if (passwordForm.new_password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    setPasswordLoading(true)
    try {
      const { data } = await API.post('/auth/me/change-password/', passwordForm)
      // Save new tokens
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      toast.success('Password changed! You are still logged in.')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Password strength indicator
  const getStrength = (pwd) => {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Medium', color: 'bg-yellow-400', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }
  const strength = getStrength(passwordForm.new_password)

  const initials = `${user?.first_name?.[0] || user?.username?.[0] || '?'}`.toUpperCase()

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white
          ${user?.role === 'admin' ? 'bg-yellow-500' : 'bg-indigo-500'}`}>
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{user?.username}</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full
              ${user?.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Card ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">✏️</span>
          <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">First Name</label>
            <input
              placeholder="First name"
              value={profileForm.first_name}
              onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
              className={inp}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Last Name</label>
            <input
              placeholder="Last name"
              value={profileForm.last_name}
              onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
              className={inp}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Username *</label>
          <input
            placeholder="Username"
            value={profileForm.username}
            onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
            className={inp}
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Email *</label>
          <input
            type="email"
            placeholder="Email"
            value={profileForm.email}
            onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
            className={inp}
          />
        </div>

        <button
          onClick={updateProfile}
          disabled={profileLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition">
          {profileLoading ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>

      {/* ── Change Password Card ──────────────────────────── */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
          </div>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-xs text-indigo-600 hover:underline">
            {showPasswords ? 'Hide' : 'Show'} passwords
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Current Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Enter current password"
              value={passwordForm.old_password}
              onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              className={inp}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Enter new password"
              value={passwordForm.new_password}
              onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className={inp}
            />
            {/* Password strength bar */}
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
                <p className={`text-xs mt-1 font-medium
                  ${strength.label === 'Strong' ? 'text-green-600' :
                    strength.label === 'Medium' ? 'text-yellow-600' :
                    strength.label === 'Weak' ? 'text-orange-600' : 'text-red-600'}`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={passwordForm.confirm_password}
              onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className={inp}
            />
            {/* Match indicator */}
            {passwordForm.confirm_password && (
              <p className={`text-xs mt-1 font-medium ${passwordForm.new_password === passwordForm.confirm_password ? 'text-green-600' : 'text-red-500'}`}>
                {passwordForm.new_password === passwordForm.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={changePassword}
          disabled={passwordLoading}
          className="w-full mt-6 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition">
          {passwordLoading ? 'Changing...' : 'Change Password'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          You will stay logged in after changing your password.
        </p>
      </div>
    </div>
  )
}