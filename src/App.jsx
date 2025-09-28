import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import DashboardLayout from './components/Dashboard/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Reorders from './pages/Reorders'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import './App.css'

// Landing page component for unauthenticated users
const LandingPage = () => (
  <>
    <Header />
  </>
)

// Main app content with routing logic
const AppContent = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          // Authenticated user sees dashboard
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="finances" element={<Reorders />} />
              <Route path="insights" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        ) : (
          // Unauthenticated user sees landing page
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
