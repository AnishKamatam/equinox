import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const SignupForm = ({ onToggleMode, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-form">
        <h2 className="auth-title">Check your email</h2>
        <p className="auth-subtitle">
          We've sent you a confirmation link at <strong>{email}</strong>
        </p>
        <button
          onClick={onToggleMode}
          className="auth-submit-btn"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="auth-form">
      <h2 className="auth-title">Create your account</h2>
      <p className="auth-subtitle">Start managing your inventory with Equinox</p>
      
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="auth-form-content">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="auth-submit-btn"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      
      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="auth-link"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default SignupForm
