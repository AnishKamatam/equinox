import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const LoginForm = ({ onToggleMode, onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      onClose()
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-form">
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">Sign in to your Equinox account</p>
      
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
            placeholder="Enter your password"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="auth-submit-btn"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      
      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="auth-link"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginForm
