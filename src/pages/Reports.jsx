import React, { useState } from 'react'
import { Send, Package, BarChart3, Truck } from 'lucide-react'
import { geminiService } from '../services/geminiService'
import { databaseService } from '../services/databaseService'
import VoiceChat from '../components/VoiceChat'
import VoiceResultsDisplay from '../components/VoiceResultsDisplay'

const Reports = () => {
  const [messages, setMessages] = useState([])
  const [voiceResult, setVoiceResult] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString()
      }
      
      const currentQuery = inputValue
      setMessages(prev => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)
      
      try {
        // Add thinking message
        const thinkingMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: 'Analyzing your request and querying the database...',
          timestamp: new Date().toLocaleTimeString(),
          isThinking: true
        }
        setMessages(prev => [...prev, thinkingMessage])
        
        // Generate SQL query using Gemini
        const sqlQuery = await geminiService.generateSQL(currentQuery)
        console.log('Generated SQL:', sqlQuery)
        
        // Validate and execute the query
        databaseService.validateQuery(sqlQuery)
        const queryResults = await databaseService.executeQuery(sqlQuery)
        
        // Generate AI insight from the results
        const aiInsight = await geminiService.generateInsight(queryResults, currentQuery)
        
        // Remove thinking message and add real response
        setMessages(prev => {
          const withoutThinking = prev.filter(msg => !msg.isThinking)
          return [...withoutThinking, {
            id: Date.now() + 2,
            type: 'ai',
            content: aiInsight,
            timestamp: new Date().toLocaleTimeString(),
            sqlQuery: sqlQuery,
            queryResults: queryResults
          }]
        })
        
      } catch (error) {
        console.error('Error processing query:', error)
        
        // Remove thinking message and add error response
        setMessages(prev => {
          const withoutThinking = prev.filter(msg => !msg.isThinking)
          return [...withoutThinking, {
            id: Date.now() + 2,
            type: 'ai',
            content: `I apologize, but I encountered an error while processing your request: ${error.message}. Please try rephrasing your question or ask about something else.`,
            timestamp: new Date().toLocaleTimeString()
          }]
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle voice messages from Vapi
  const handleVoiceMessage = (voiceMessage) => {
    if (voiceMessage.type === 'voice-query') {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: `🎤 ${voiceMessage.query}`,
        timestamp: new Date().toLocaleTimeString(),
        isVoice: true
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: voiceMessage.analysis,
        timestamp: new Date().toLocaleTimeString(),
        sqlQuery: voiceMessage.query,
        queryResults: voiceMessage.result,
        isVoice: true
      }
      
      setMessages(prev => [...prev, userMessage, aiMessage])
      
      // Set the voice result for visual display
      setVoiceResult(voiceMessage.result)
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

  const handleSuggestionClick = async (suggestion) => {
    // Create user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: suggestion.title,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setMessages([userMessage])
    setIsLoading(true)
    
    try {
      // Add thinking message
      const thinkingMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Analyzing your inventory data...',
        timestamp: new Date().toLocaleTimeString(),
        isThinking: true
      }
      setMessages(prev => [...prev, thinkingMessage])
      
      let aiResponse = ''
      
      // Handle different suggestion types
      if (suggestion.title === "Summarize my Inventory") {
        // Generate comprehensive inventory summary
        const queries = [
          'SELECT COUNT(*) as total_items FROM Inventory',
          'SELECT COUNT(*) as low_stock_items FROM Inventory WHERE quantity < threshold',
          'SELECT COUNT(*) as out_of_stock FROM Inventory WHERE quantity = 0',
          'SELECT AVG(quantity) as avg_stock_level FROM Inventory',
          'SELECT SUM(total_stock_value) as total_value FROM Inventory',
          'SELECT * FROM Inventory ORDER BY sales_velocity DESC LIMIT 3',
          'SELECT * FROM Inventory WHERE quantity < threshold LIMIT 5'
        ]
        
        const results = await Promise.all(queries.map(query => databaseService.executeQuery(query)))
        
        const totalItems = results[0][0].count || results[0][0].total_items
        const lowStockItems = results[1][0].low_stock_items || results[1][0].count
        const outOfStock = results[2][0].out_of_stock || results[2][0].count
        const avgStockLevel = parseFloat(results[3][0].avg_stock_level || 0).toFixed(1)
        const totalValue = parseFloat(results[4][0].total_value || 0).toFixed(2)
        const topSellers = results[5]
        const lowStockProducts = results[6]
        
        aiResponse = `# 📊 Inventory Summary\n\n## Overall Stats\n- **Total Items**: ${totalItems} products in inventory\n- **Average Stock Level**: ${avgStockLevel} units per item\n- **Total Inventory Value**: $${totalValue}\n\n## Stock Health\n- **✅ Good Stock**: ${totalItems - lowStockItems - outOfStock} items well-stocked\n- **⚠️ Low Stock**: ${lowStockItems} items need reordering\n- **❌ Out of Stock**: ${outOfStock} items completely depleted\n\n## Top Performers\n${topSellers.map((item, i) => `${i + 1}. **${item.item_name}** - ${item.sales_velocity} velocity`).join('\n')}\n\n## Items Needing Attention\n${lowStockProducts.map(item => `• **${item.item_name}** - Only ${item.quantity} left (threshold: ${item.threshold})`).join('\n')}\n\n**Recommendation**: Focus on restocking the ${lowStockItems} low-stock items to avoid stockouts.`
        
      } else {
        // For other suggestions, use the normal Gemini flow
        const sqlQuery = await geminiService.generateSQL(suggestion.title)
        databaseService.validateQuery(sqlQuery)
        const queryResults = await databaseService.executeQuery(sqlQuery)
        aiResponse = await geminiService.generateInsight(queryResults, suggestion.title)
      }
      
      // Remove thinking message and add real response
      setMessages(prev => {
        const withoutThinking = prev.filter(msg => !msg.isThinking)
        return [...withoutThinking, {
          id: Date.now() + 2,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString()
        }]
      })
      
    } catch (error) {
      console.error('Error processing suggestion:', error)
      
      // Remove thinking message and add error response
      setMessages(prev => {
        const withoutThinking = prev.filter(msg => !msg.isThinking)
        return [...withoutThinking, {
          id: Date.now() + 2,
          type: 'ai',
          content: `I apologize, but I encountered an error while processing your request: ${error.message}. Please try again.`,
          timestamp: new Date().toLocaleTimeString()
        }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="insights-container">
      <div className="chat-container">
        {messages.length === 0 && (
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
          {messages.length > 0 && messages.map((message) => (
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
        
        {voiceResult && <VoiceResultsDisplay result={voiceResult} />}
        
        <div className="chat-input-container">
          <VoiceChat 
            onVoiceMessage={handleVoiceMessage}
            className="voice-chat-component"
          />
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your inventory data... or use voice 🎤"
            className="chat-input"
            rows="1"
          />
            <button 
              onClick={handleSendMessage}
              className="send-button"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
