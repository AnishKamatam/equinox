import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import AuthModal from './Auth/AuthModal'

const Header = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const { user, signOut, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogin = () => {
    setAuthMode('login')
    setAuthModalOpen(true)
  }

  const handleSignup = () => {
    setAuthMode('signup')
    setAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <header className="header">
        <div className="container">
          <div className="nav-brand">
            <h1 className="logo">EQUINOX</h1>
          </div>
          <div className="nav-loading">Loading...</div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="nav-brand">
            <h1 className="logo">EQUINOX</h1>
          </div>
          <nav className="nav-menu">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>
          <div className="nav-actions">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {user ? (
              <>
                <span className="user-email">Welcome, {user.email}</span>
                <button className="btn-login" onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button className="btn-login" onClick={handleLogin}>
                  Login
                </button>
                <button className="btn-demo" onClick={handleSignup}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  )
}

export default Header
