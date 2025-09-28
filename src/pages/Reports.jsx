import React, { useState } from 'react'
import { ArrowUp, Package, BarChart3, Truck } from 'lucide-react'
import { geminiService } from '../services/geminiService'
import { databaseService } from '../services/databaseService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const Reports = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Function to generate charts using Gemini AI analysis
  const generateChartsWithGemini = async (fullTableData, userQuery) => {
    try {
      console.log('Using Gemini to analyze data and generate charts...')
      
      // Get Gemini's analysis of what charts to create
      const analysis = await geminiService.analyzeDataAndGenerateCharts(fullTableData, userQuery)
      console.log('Gemini analysis:', analysis)
      
      if (!analysis.charts || analysis.charts.length === 0) {
        return { insights: analysis.insights, charts: [] }
      }
      
      // Generate chart data for each suggested chart
      const chartConfigs = []
      for (const chartConfig of analysis.charts) {
        const chartData = await geminiService.generateChartData(fullTableData, chartConfig)
        
        if (chartData && chartData.length > 0) {
          const chartJsConfig = convertToChartJsFormat(chartData, chartConfig)
          if (chartJsConfig) {
            chartConfigs.push(chartJsConfig)
          }
        }
      }
      
      return { insights: analysis.insights, charts: chartConfigs }
    } catch (error) {
      console.error('Error generating charts with Gemini:', error)
      return { insights: 'I analyzed your data but had trouble creating visualizations.', charts: [] }
    }
  }

  // Convert Gemini's chart data to Chart.js format
  const convertToChartJsFormat = (chartData, chartConfig) => {
    if (!chartData || chartData.length === 0) return null
    
    const labels = chartData.map(item => {
      let label = item.label
      // Truncate long labels
      if (label && label.length > 20) {
        label = label.substring(0, 17) + '...'
      }
      return label || 'Unknown'
    })
    
    const values = chartData.map(item => item.value || 0)
    
    // Generate colors based on chart type
    const colors = generateColors(chartData.length, chartConfig.type)
    
    const chartJsData = {
      labels,
      datasets: [{
        label: chartConfig.title,
        data: values,
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: chartConfig.type === 'pie' || chartConfig.type === 'doughnut' ? 3 : 2,
        hoverBorderWidth: chartConfig.type === 'pie' || chartConfig.type === 'doughnut' ? 4 : 3
      }]
    }
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 15,
          bottom: 25,
          left: 15,
          right: 15
        }
      },
      plugins: {
        title: {
          display: true,
          text: chartConfig.title,
          font: {
            size: 16,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#1f2937',
          padding: {
            top: 5,
            bottom: 15
          }
        },
        legend: {
          display: chartConfig.type === 'pie' || chartConfig.type === 'doughnut',
          position: 'bottom',
          labels: {
            padding: 12,
            usePointStyle: true,
            font: {
              size: 11,
              family: 'Inter, system-ui, sans-serif'
            },
            color: '#4b5563',
            boxWidth: 12,
            boxHeight: 12
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: function(context) {
              if (chartConfig.type === 'pie' || chartConfig.type === 'doughnut') {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} (${percentage}%)`
              }
              return `${context.label}: ${context.parsed}`
            }
          }
        }
      }
    }
    
    // Add scales for bar and line charts
    if (chartConfig.type === 'bar' || chartConfig.type === 'line') {
      options.scales = {
        x: {
          ticks: {
            maxRotation: 35,
            minRotation: 0,
            font: {
              size: 10,
              family: 'Inter, system-ui, sans-serif'
            },
            color: '#6b7280',
            maxTicksLimit: 10
          },
          grid: {
            display: false
          },
          border: {
            color: '#e5e7eb'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10,
              family: 'Inter, system-ui, sans-serif'
            },
            color: '#6b7280',
            callback: function(value) {
              // Format large numbers
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M'
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K'
              }
              return value
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            lineWidth: 1
          },
          border: {
            color: '#e5e7eb'
          }
        }
      }
    }
    
    // Add line-specific styling
    if (chartConfig.type === 'line') {
      chartJsData.datasets[0].tension = 0.4
      chartJsData.datasets[0].fill = true
    }
    
    return {
      type: chartConfig.type,
      data: chartJsData,
      options: options,
      description: chartConfig.description
    }
  }
  
  // Generate colors for charts
  const generateColors = (count, chartType) => {
    const baseColors = [
      '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
      '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1',
      '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#eab308'
    ]
    
    const background = []
    const border = []
    
    for (let i = 0; i < count; i++) {
      const color = baseColors[i % baseColors.length]
      
      if (chartType === 'pie' || chartType === 'doughnut') {
        background.push(color)
        border.push('#ffffff')
      } else {
        // For bar and line charts, use semi-transparent background
        const rgb = hexToRgb(color)
        background.push(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`)
        border.push(color)
      }
    }
    
    return { background, border }
  }
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Create fallback charts when Gemini analysis fails
  const createFallbackCharts = async (fullTableData, suggestionTitle) => {
    const charts = []
    
    try {
      if (suggestionTitle.toLowerCase().includes('supply chain') || suggestionTitle.toLowerCase().includes('optimize')) {
        // Supply chain optimization charts
        
        // Chart 1: Stock Health Distribution
        const stockHealthData = {}
        fullTableData.forEach(item => {
          const health = item.stock_health || 'unknown'
          stockHealthData[health] = (stockHealthData[health] || 0) + 1
        })
        
        const stockHealthChartData = Object.keys(stockHealthData).map(key => ({
          label: key,
          value: stockHealthData[key]
        }))
        
        if (stockHealthChartData.length > 0) {
          charts.push(convertToChartJsFormat(stockHealthChartData, {
            type: 'pie',
            title: 'Stock Health Distribution',
            description: 'Shows the distribution of stock health across your inventory'
          }))
        }
        
        // Chart 2: Top Suppliers by Item Count
        const supplierData = {}
        fullTableData.forEach(item => {
          const supplier = item.supplier_name || 'Unknown'
          supplierData[supplier] = (supplierData[supplier] || 0) + 1
        })
        
        const supplierChartData = Object.keys(supplierData)
          .map(key => ({ label: key, value: supplierData[key] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
        
        if (supplierChartData.length > 0) {
          charts.push(convertToChartJsFormat(supplierChartData, {
            type: 'bar',
            title: 'Top Suppliers by Item Count',
            description: 'Shows which suppliers provide the most items in your inventory'
          }))
        }
        
      } else if (suggestionTitle.toLowerCase().includes('performance') || suggestionTitle.toLowerCase().includes('visualize')) {
        // Performance visualization charts
        
        // Chart 1: Category Distribution
        const categoryData = {}
        fullTableData.forEach(item => {
          const category = item.category || 'Unknown'
          categoryData[category] = (categoryData[category] || 0) + 1
        })
        
        const categoryChartData = Object.keys(categoryData).map(key => ({
          label: key,
          value: categoryData[key]
        }))
        
        if (categoryChartData.length > 0) {
          charts.push(convertToChartJsFormat(categoryChartData, {
            type: 'pie',
            title: 'Inventory by Category',
            description: 'Distribution of items across different categories'
          }))
        }
        
        // Chart 2: Top Items by Sales Velocity
        const topItems = fullTableData
          .filter(item => item.sales_velocity && parseFloat(item.sales_velocity) > 0)
          .sort((a, b) => parseFloat(b.sales_velocity) - parseFloat(a.sales_velocity))
          .slice(0, 10)
          .map(item => ({
            label: item.item_name || 'Unknown Item',
            value: parseFloat(item.sales_velocity) || 0
          }))
        
        if (topItems.length > 0) {
          charts.push(convertToChartJsFormat(topItems, {
            type: 'bar',
            title: 'Top Items by Sales Velocity',
            description: 'Items with the highest sales velocity'
          }))
        }
      }
      
    } catch (error) {
      console.error('Error creating fallback charts:', error)
    }
    
    return charts
  }

  // Legacy function for backward compatibility (keeping existing chart generation)
  const generateChartFromQuery = (query, queryResults) => {
    const lowerQuery = query.toLowerCase()
    
    // Pie/Doughnut charts for percentages, categories, distribution
    if (lowerQuery.includes('percentage') || lowerQuery.includes('distribution') || 
        lowerQuery.includes('category') || lowerQuery.includes('breakdown') ||
        lowerQuery.includes('proportion') || lowerQuery.includes('share')) {
      return generatePieChart(queryResults, query)
    }
    
    // Bar charts for comparisons, top items, rankings
    if (lowerQuery.includes('top') || lowerQuery.includes('best') || 
        lowerQuery.includes('worst') || lowerQuery.includes('compare') ||
        lowerQuery.includes('ranking') || lowerQuery.includes('most') ||
        lowerQuery.includes('least')) {
      return generateBarChart(queryResults, query)
    }
    
    // Line charts for trends, over time, historical
    if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || 
        lowerQuery.includes('historical') || lowerQuery.includes('monthly') ||
        lowerQuery.includes('weekly') || lowerQuery.includes('daily')) {
      return generateLineChart(queryResults, query)
    }
    
    // Default to bar chart for general data
    if (queryResults && queryResults.length > 0) {
      return generateBarChart(queryResults, query)
    }
    
    return null
  }

  // Generate pie chart for categorical data
  const generatePieChart = (data, query) => {
    if (!data || data.length === 0) return null
    
    // Try to find category and value columns
    const firstRow = data[0]
    const columns = Object.keys(firstRow)
    
    // Look for common category column names - prioritize readable names
    const categoryCol = columns.find(col => 
      col.toLowerCase() === 'category' ||
      col.toLowerCase() === 'brand' ||
      col.toLowerCase() === 'type'
    ) || columns.find(col => 
      col.toLowerCase().includes('category') || 
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('type') ||
      col.toLowerCase().includes('brand')
    ) || columns[0]
    
    // Look for common value column names - prioritize 'count' for category distributions
    const valueCol = columns.find(col => 
      col.toLowerCase() === 'count' ||
      col.toLowerCase() === 'total' ||
      col.toLowerCase() === 'sum'
    ) || columns.find(col => 
      col.toLowerCase().includes('count') ||
      col.toLowerCase().includes('total') ||
      col.toLowerCase().includes('sum') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('value')
    ) || columns[1]
    
    // Sort by value and take top 8 for readability
    const sortedData = [...data]
      .sort((a, b) => (parseFloat(b[valueCol]) || 0) - (parseFloat(a[valueCol]) || 0))
      .slice(0, 8)
    
    const labels = sortedData.map(row => {
      let label = row[categoryCol] || 'Unknown'
      // Truncate long labels
      if (label.length > 20) {
        label = label.substring(0, 17) + '...'
      }
      return label
    })
    
    const values = sortedData.map(row => parseFloat(row[valueCol]) || 0)
    
    const chartData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
        ],
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderWidth: 4,
        hoverBorderColor: '#333'
      }]
    }
    
    return {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: query,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} (${percentage}%)`
              }
            }
          }
        }
      }
    }
  }

  // Generate bar chart for comparisons
  const generateBarChart = (data, query) => {
    if (!data || data.length === 0) return null
    
    const firstRow = data[0]
    const columns = Object.keys(firstRow)
    
    // Find the best label column - prioritize item_name, then other readable names
    const labelCol = columns.find(col => 
      col.toLowerCase() === 'item_name' ||
      col.toLowerCase() === 'product_name' ||
      col.toLowerCase() === 'name'
    ) || columns.find(col => 
      col.toLowerCase().includes('name') || 
      col.toLowerCase().includes('item') ||
      col.toLowerCase().includes('category') ||
      col.toLowerCase().includes('brand')
    ) || columns[0]
    
    // Find the best value column
    const valueCol = columns.find(col => 
      col.toLowerCase().includes('sales_velocity') ||
      col.toLowerCase().includes('velocity') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('price') ||
      col.toLowerCase().includes('value') ||
      col.toLowerCase().includes('count') ||
      col.toLowerCase().includes('total') ||
      col.toLowerCase().includes('revenue')
    ) || columns[1]
    
    // Sort data by value and take top 10
    const sortedData = [...data]
      .sort((a, b) => (parseFloat(b[valueCol]) || 0) - (parseFloat(a[valueCol]) || 0))
      .slice(0, 10)
    
    const labels = sortedData.map(row => {
      let label = row[labelCol] || 'Unknown'
      // Truncate long labels
      if (label.length > 25) {
        label = label.substring(0, 22) + '...'
      }
      return label
    })
    
    const values = sortedData.map(row => parseFloat(row[valueCol]) || 0)
    
    const chartData = {
      labels,
      datasets: [{
        label: valueCol.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data: values,
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(255, 99, 255, 0.8)',
          'rgba(99, 255, 132, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)'
        ],
        borderWidth: 2
      }]
    }
    
    return {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: query,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: false // Hide legend for cleaner look
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                // Format large numbers
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M'
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(1) + 'K'
                }
                return value
              }
            }
          }
        }
      }
    }
  }

  // Generate line chart for trends
  const generateLineChart = (data, query) => {
    if (!data || data.length === 0) return null
    
    const firstRow = data[0]
    const columns = Object.keys(firstRow)
    
    // Find date/time and value columns
    const dateCol = columns.find(col => 
      col.toLowerCase().includes('date') ||
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('month') ||
      col.toLowerCase().includes('week')
    ) || columns[0]
    
    const valueCol = columns.find(col => 
      col.toLowerCase().includes('value') ||
      col.toLowerCase().includes('amount') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('count')
    ) || columns[1]
    
    const labels = data.map(row => row[dateCol])
    const values = data.map(row => parseFloat(row[valueCol]) || 0)
    
    const chartData = {
      labels,
      datasets: [{
        label: valueCol.replace(/_/g, ' ').toUpperCase(),
        data: values,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }]
    }
    
    return {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: query
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    }
  }

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
        
        // Fetch full table data for Gemini analysis
        const fullTableData = await databaseService.getFullTableData()
        console.log('Fetched full table data:', fullTableData.length, 'rows')
        
        // Use Gemini to analyze data and generate charts
        const geminiAnalysis = await generateChartsWithGemini(fullTableData, currentQuery)
        console.log('Gemini chart analysis:', geminiAnalysis)
        
        // Also generate SQL query and execute it for additional context
        let queryResults = []
        let sqlQuery = ''
        
        try {
          sqlQuery = await geminiService.generateSQL(currentQuery)
        console.log('Generated SQL:', sqlQuery)
        
        databaseService.validateQuery(sqlQuery)
          queryResults = await databaseService.executeQuery(sqlQuery)
        } catch (sqlError) {
          console.warn('SQL generation/execution failed:', sqlError.message)
          // Continue with just Gemini analysis if SQL fails
          sqlQuery = 'SQL generation failed - using data analysis only'
          queryResults = []
        }
        
        // Generate AI insight combining SQL results and Gemini analysis
        let aiInsight = await geminiService.generateInsight(queryResults, currentQuery)
        
        // Append Gemini's insights if available
        if (geminiAnalysis.insights) {
          aiInsight += '\n\n**Data Analysis Insights:**\n' + geminiAnalysis.insights
        }
        
        // Remove thinking message and add real response
        setMessages(prev => {
          const withoutThinking = prev.filter(msg => !msg.isThinking)
          return [...withoutThinking, {
            id: Date.now() + 2,
            type: 'ai',
            content: aiInsight,
            timestamp: new Date().toLocaleTimeString(),
            sqlQuery: sqlQuery,
            queryResults: queryResults,
            chartConfigs: geminiAnalysis.charts, // Multiple charts from Gemini
            chartConfig: geminiAnalysis.charts?.[0] // Backward compatibility
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
      description: "Recommendations for efficiency",
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
        
        aiResponse = `# Inventory Summary\n\n## Overall Stats\n- Total Items: ${totalItems} products in inventory\n- Average Stock Level: ${avgStockLevel} units per item\n- Total Inventory Value: $${totalValue}\n\n## Stock Health\n- Good Stock: ${totalItems - lowStockItems - outOfStock} items well-stocked\n- Low Stock: ${lowStockItems} items need reordering\n- Out of Stock: ${outOfStock} items completely depleted\n\n## Top Performers\n${topSellers.map((item, i) => `${i + 1}. ${item.item_name} - ${item.sales_velocity} velocity`).join('\n')}\n\n## Items Needing Attention\n${lowStockProducts.map(item => `• ${item.item_name} - Only ${item.quantity} left (threshold: ${item.threshold})`).join('\n')}\n\nRecommendation: Focus on restocking the ${lowStockItems} low-stock items to avoid stockouts.`
        
      } else {
        // For other suggestions, use the normal Gemini flow
        try {
        const sqlQuery = await geminiService.generateSQL(suggestion.title)
        databaseService.validateQuery(sqlQuery)
        const queryResults = await databaseService.executeQuery(sqlQuery)
        aiResponse = await geminiService.generateInsight(queryResults, suggestion.title)
        } catch (sqlError) {
          console.warn('SQL generation failed for suggestion, using data analysis only:', sqlError.message)
          // Fallback to just using the full table data analysis
          aiResponse = `I've analyzed your inventory data for "${suggestion.title}". Let me provide insights based on your current inventory.`
        }
      }
      
      // Generate charts using Gemini for suggestions
      let chartConfigs = []
      try {
        const fullTableData = await databaseService.getFullTableData()
        const geminiAnalysis = await generateChartsWithGemini(fullTableData, suggestion.title)
        chartConfigs = geminiAnalysis.charts || []
        
        // Append Gemini insights to the response
        if (geminiAnalysis.insights) {
          aiResponse += '\n\n**Data Analysis Insights:**\n' + geminiAnalysis.insights
        }
        
        // If no charts were generated, create some default ones based on suggestion type
        if (chartConfigs.length === 0) {
          console.log('No charts generated by Gemini, creating fallback charts')
          chartConfigs = await createFallbackCharts(fullTableData, suggestion.title)
          }
        } catch (err) {
        console.log('Could not generate Gemini charts for suggestion:', err)
        // Create fallback charts
        try {
          const fullTableData = await databaseService.getFullTableData()
          chartConfigs = await createFallbackCharts(fullTableData, suggestion.title)
        } catch (fallbackErr) {
          console.log('Fallback chart generation also failed:', fallbackErr)
        }
      }
      
      // Remove thinking message and add real response
      setMessages(prev => {
        const withoutThinking = prev.filter(msg => !msg.isThinking)
        return [...withoutThinking, {
          id: Date.now() + 2,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString(),
          chartConfigs: chartConfigs, // Multiple charts from Gemini
          chartConfig: chartConfigs?.[0] // Backward compatibility
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
                  {message.content.split('\n').map((line, index) => {
                    // Handle different markdown elements
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="message-h1">{line.substring(2)}</h1>
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="message-h2">{line.substring(3)}</h2>
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={index} className="message-h3">{line.substring(4)}</h3>
                    }
                    if (line.startsWith('- ')) {
                      const content = line.substring(2)
                      return (
                        <div key={index} className="message-bullet" 
                             dangerouslySetInnerHTML={{
                               __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             }} 
                        />
                      )
                    }
                    if (line.match(/^\d+\./)) {
                      return (
                        <div key={index} className="message-numbered" 
                             dangerouslySetInnerHTML={{
                               __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             }} 
                        />
                      )
                    }
                    if (line.startsWith('• ')) {
                      const content = line.substring(2)
                      return (
                        <div key={index} className="message-attention-item" 
                             dangerouslySetInnerHTML={{
                               __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             }} 
                        />
                      )
                    }
                    if (line.trim() === '') {
                      return <div key={index} className="message-spacer"></div>
                    }
                    // Handle bold text for all other lines
                    if (line.includes('**')) {
                      return (
                        <div key={index} dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }} />
                      )
                    }
                    return <div key={index}>{line}</div>
                  })}
                </div>
                
                {/* Render charts if available */}
                {message.chartConfigs && message.chartConfigs.length > 0 && (
                  <div className="message-charts">
                    {message.chartConfigs.map((chartConfig, index) => (
                      <div key={index} className="message-chart">
                        <div className="chart-container">
                          {chartConfig.description && (
                            <p className="chart-description">{chartConfig.description}</p>
                          )}
                          {chartConfig.type === 'pie' && (
                            <Pie data={chartConfig.data} options={chartConfig.options} />
                          )}
                          {chartConfig.type === 'doughnut' && (
                            <Doughnut data={chartConfig.data} options={chartConfig.options} />
                          )}
                          {chartConfig.type === 'bar' && (
                            <Bar data={chartConfig.data} options={chartConfig.options} />
                          )}
                          {chartConfig.type === 'line' && (
                            <Line data={chartConfig.data} options={chartConfig.options} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Fallback: Render single chart for backward compatibility */}
                {!message.chartConfigs && message.chartConfig && (
                  <div className="message-chart">
                    <div className="chart-container">
                      {message.chartConfig.type === 'pie' && (
                        <Pie data={message.chartConfig.data} options={message.chartConfig.options} />
                      )}
                      {message.chartConfig.type === 'bar' && (
                        <Bar data={message.chartConfig.data} options={message.chartConfig.options} />
                      )}
                      {message.chartConfig.type === 'line' && (
                        <Line data={message.chartConfig.data} options={message.chartConfig.options} />
                      )}
                    </div>
                </div>
                )}
                
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
              disabled={!inputValue.trim() || isLoading}
            >
              <ArrowUp size={18} />
            </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
