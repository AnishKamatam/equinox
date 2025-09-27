import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <Hero />
        <Features />
      </div>
    </AuthProvider>
  )
}

export default App
