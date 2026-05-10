import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)   // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"

  // ── Step 1: Send OTP ─────────────────────────────────────
  const sendOTP = async () => {
    if (!email) return toast.error('Enter your email')
    setLoading(true)
    try {
      await API.post('/auth/forgot-password/', { email })
      toast.success('OTP sent! Check your email.')
      setStep(2)
      startResendTimer()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
  }

  // ── OTP input boxes ──────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const newOtp = [...otp]
    newOtp[idx] = val
    setOtp(newOtp)
    // Auto-focus next box
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus()
    }
  }

  // ── Step 2: Verify OTP ───────────────────────────────────
  const verifyOTP = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) return toast.error('Enter the full 6-digit OTP')
    setLoading(true)
    try {
      await API.post('/auth/verify-otp/', { email, otp: otpString })
      toast.success('OTP verified!')
      setStep(3)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Reset Password ───────────────────────────────
  const resetPassword = async () => {
    if (!passwords.new_password || !passwords.confirm_password)
      return toast.error('Fill both fields')
    if (passwords.new_password !== passwords.confirm_password)
      return toast.error('Passwords do not match')
    if (passwords.new_password.length < 6)
      return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await API.post('/auth/reset-password/', {
        email,
        otp: otp.join(''),
        new_password: passwords.new_password,
        confirm_password: passwords.confirm_password,
      })
      toast.success('Password reset! Please login.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const getStrength = (pwd) => {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', w: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-400', w: 'w-2/4' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Medium', color: 'bg-yellow-400', w: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', w: 'w-full' }
  }
  const strength = getStrength(passwords.new_password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step === s ? 'bg-indigo-600 text-white scale-110' :
                  step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Email ──────────────────────────────── */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-indigo-700 mb-1">Forgot Password?</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a 6-digit OTP</p>
            <input
              type="email" placeholder="Your registered email"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
              className={inp} />
            <button onClick={sendOTP} disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Remembered it? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login</Link>
            </p>
          </>
        )}

        {/* ── STEP 2: OTP ────────────────────────────────── */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-indigo-700 mb-1">Enter OTP</h1>
            <p className="text-gray-500 text-sm mb-1">
              We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
            </p>
            <p className="text-xs text-gray-400 mb-6">Valid for 10 minutes</p>

            {/* OTP Boxes */}
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(e.target.value, idx)}
                  onKeyDown={e => handleOtpKeyDown(e, idx)}
                  className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none transition
                    ${digit ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
                    focus:border-indigo-500`}
                />
              ))}
            </div>

            <button onClick={verifyOTP} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center mt-4">
              {resendTimer > 0
                ? <p className="text-xs text-gray-400">Resend OTP in {resendTimer}s</p>
                : <button onClick={sendOTP}
                    className="text-sm text-indigo-600 hover:underline font-medium">
                    Resend OTP
                  </button>
              }
            </div>
            <button onClick={() => setStep(1)} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">
              ← Change email
            </button>
          </>
        )}

        {/* ── STEP 3: New Password ───────────────────────── */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold text-indigo-700 mb-1">Set New Password</h1>
            <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account</p>

            <div className="space-y-4">
              <div>
                <input
                  type="password" placeholder="New password"
                  value={passwords.new_password}
                  onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                  className={inp} />
                {strength && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color} ${strength.w}`} />
                    </div>
                    <p className={`text-xs mt-1 font-medium
                      ${strength.label === 'Strong' ? 'text-green-600' :
                        strength.label === 'Medium' ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="password" placeholder="Confirm new password"
                  value={passwords.confirm_password}
                  onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                  className={inp} />
                {passwords.confirm_password && (
                  <p className={`text-xs mt-1 font-medium
                    ${passwords.new_password === passwords.confirm_password ? 'text-green-600' : 'text-red-500'}`}>
                    {passwords.new_password === passwords.confirm_password ? '✓ Passwords match' : '✗ Do not match'}
                  </p>
                )}
              </div>
            </div>

            <button onClick={resetPassword} disabled={loading}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold">
              {loading ? 'Resetting...' : '✓ Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}