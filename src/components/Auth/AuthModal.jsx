import React, { useState } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode)

  if (!isOpen) return null

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>
        
        {mode === 'login' ? (
          <LoginForm onToggleMode={toggleMode} onClose={onClose} />
        ) : (
          <SignupForm onToggleMode={toggleMode} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

export default AuthModal
