import React, { useState } from 'react'
import { Send, Package, BarChart3, Truck } from 'lucide-react'

const Reports = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI inventory assistant. I can help you analyze your inventory data, predict trends, and answer questions about your stock levels. What would you like to know?",
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 2,
      type: 'user',
      content: "What are my top selling products this month?",
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 3,
      type: 'ai',
      content: "Based on your inventory data, here are your top 3 selling products this month:\n\n1. **MacBook Pro 16\"** - 45 units sold\n2. **iPhone 15 Pro** - 38 units sold\n3. **AirPods Pro** - 32 units sold\n\nWould you like me to analyze the trends for any specific product or time period?",
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: 'user',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages([...messages, newMessage])
      setInputValue('')
      
      // Simulate AI response (you'll replace this with actual API call later)
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          type: 'ai',
          content: "I understand your question. Once we connect to your database, I'll be able to provide real-time insights about your inventory data.",
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, aiResponse])
      }, 1000)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestionBoxes = [
    {
      id: 1,
      title: "Summarize my Inventory",
      description: "Get a complete overview of your stock levels",
      icon: Package
    },
    {
      id: 2,
      title: "Visualize performance",
      description: "View charts and analytics of your data",
      icon: BarChart3
    },
    {
      id: 3,
      title: "Optimize supply chain",
      description: "AI-powered recommendations for efficiency",
      icon: Truck
    }
  ]

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.title)
  }

  return (
    <div className="insights-container">
      <div className="chat-container">
        {messages.length === 3 && (
          <div className="suggestions-container">
            <h2 className="welcome-title">Hello, Anish</h2>
            
            <div className="suggestions-grid">
              {suggestionBoxes.map((suggestion) => (
                <div 
                  key={suggestion.id} 
                  className="suggestion-box"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <suggestion.icon className="suggestion-icon" size={24} />
                  <h3 className="suggestion-title">{suggestion.title}</h3>
                  <p className="suggestion-description">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="chat-messages">
          {messages.length > 3 && messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">
                  {message.content.split('\n').map((line, index) => (
                    <div key={index}>
                      {line.includes('**') ? (
                        <span dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }} />
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
                <div className="message-timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="chat-input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your inventory data..."
            className="chat-input"
            rows="1"
          />
          <button 
            onClick={handleSendMessage}
            className="send-button"
            disabled={!inputValue.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
