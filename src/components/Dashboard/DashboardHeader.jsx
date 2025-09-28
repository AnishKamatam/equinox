import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

const DashboardHeader = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    const userName = user?.email?.split('@')[0] || 'User'
    
    if (hour < 12) {
      return `Good Morning, ${userName}`
    } else if (hour < 17) {
      return `Good Afternoon, ${userName}`
    } else {
      return `Good Evening, ${userName}`
    }
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        <h1 className="dashboard-title">{getTimeBasedGreeting()}</h1>
        <div className="dashboard-user-menu">
          <span className="user-info">{user?.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
