import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signupNotice, setSignupNotice] = useState('')

  const { signIn, signUp, signInWithApple } = useAuth()
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSignupNotice('')
    setSubmitting(true)

    if (isSignup) {
      const { data, error: authError } = await signUp(email, password)
      setSubmitting(false)

      if (authError) {
        setError(authError.message)
        return
      }

      if (!data.session) {
        setSignupNotice('Check your email to confirm your account before logging in.')
        return
      }

      navigate('/')
      return
    }

    const { error: authError } = await signIn(email, password)
    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }

    navigate('/')
  }

  async function handleApple() {
    setError('')
    const { error: authError } = await signInWithApple()
    if (authError) setError(authError.message)
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
            <path
              d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-13-7-13Z"
              fill="white"
            />
          </svg>
        </div>

        <h1 className="auth-title">Welcome to the app</h1>
        <p className="auth-subtitle">
          Share a fridge, not the guilt.
          <br />
          Track what&apos;s about to expire — together.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-field-label">Password</span>
            <div className="auth-password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
              <button
                type="button"
                className="auth-show-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}
          {signupNotice && <p className="auth-notice">{signupNotice}</p>}

          <button type="submit" className="auth-continue" disabled={submitting}>
            {submitting ? 'Please wait…' : 'Continue'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button type="button" className="auth-apple" onClick={handleApple}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M16.365 1.43c0 1.14-.415 2.06-1.244 2.77-.83.71-1.75 1.12-2.76 1.06-.09-1.12.36-2.09 1.19-2.79.79-.68 1.86-1.12 2.81-1.04zM19.9 17.03c-.53 1.22-1.17 2.36-1.94 3.42-.98 1.35-1.78 2.28-2.4 2.79-.96.83-1.98 1.26-3.08 1.28-.79.02-1.74-.22-2.85-.72-1.11-.5-2.13-.74-3.06-.72-.98.02-1.98.26-3 .74-1.03.48-1.86.73-2.5.76-1.05.04-2.09-.4-3.13-1.32-.68-.58-1.51-1.53-2.5-2.86C1.15 20.02.2 17.9.03 15.36c-.16-2.41.34-4.48 1.5-6.21 1.03-1.53 2.4-2.31 4.1-2.33 1.05-.02 2.13.28 3.24.9 1.11.62 1.85.93 2.23.93.28 0 1.1-.36 2.46-1.08 1.29-.65 2.38-.92 3.28-.81 2.42.2 4.24 1.15 5.46 2.85-2.17 1.32-3.25 3.15-3.24 5.5.01 1.83.68 3.35 2 4.56.6.56 1.26.99 1.99 1.29-.16.48-.34.92-.55 1.35v.02z" />
          </svg>
          Continue with Apple
        </button>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => {
              setError('')
              setMode(isSignup ? 'login' : 'signup')
            }}
          >
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  )
}
