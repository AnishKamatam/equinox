import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

const DashboardHeader = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        <h1 className="dashboard-title">Welcome back</h1>
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
