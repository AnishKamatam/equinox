import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-gemini-api-key')

// Database schema for context
const DATABASE_SCHEMA = `
You are an expert SQL query generator for an inventory management system. 
Generate ONLY SELECT queries for data retrieval - no INSERT, UPDATE, DELETE, DROP, or other modification operations.
Return only the SQL query without any explanation or markdown formatting.

Database Table: Inventory

Columns and their descriptions:
- item_id: Unique identifier for each item
- sku: Stock Keeping Unit code
- item_name: Name of the product
- brand: Brand name
- description: Product description
- category: Main product category
- subcategory: Product subcategory
- tags: Product tags for search
- status: Item status (active, discontinued, etc.)
- quantity: Current stock quantity
- threshold: Minimum stock level before reorder
- initial_quantity: Starting stock quantity
- sold_today: Items sold today
- sales_velocity: Rate of sales
- stock_health: Overall stock condition
- days_out_of_stock: Days item has been out of stock
- stock_turnover_rate: How quickly stock turns over
- storage_type: Type of storage required
- location_in_store: Physical location in store
- unit_cost: Cost per unit
- selling_price: Price sold to customers
- margin_percent: Profit margin percentage
- markup_percent: Markup percentage
- potential_revenue: Potential revenue from current stock
- total_stock_value: Total value of stock on hand
- discount_active: Whether discount is currently active
- discount_percent: Discount percentage if active
- loyalty_points: Points earned per purchase
- supplier_name: Name of supplier
- supplier_contact: Supplier contact number
- supplier_email: Supplier email address
- supplier_address: Supplier address
- supplier_rating: Rating of supplier
- restock_lead_days: Days needed for restocking
- last_restock_date: Date of last restock
- next_expected_restock: Expected next restock date
- last_restock_qty: Quantity of last restock
- auto_reorder_enabled: Whether auto-reorder is enabled
- predicted_demand_next_7d: Predicted demand for next 7 days
- days_until_stockout: Predicted days until stock runs out
- expiry_days: Days until expiry
- expiry_date: Expiration date
- days_until_expiry: Days until item expires
- expired: Whether item is expired
- sales_history: Historical sales data
- weekly_sales_volume: Weekly sales volume
- sales_trend: Current sales trend
- country_of_origin: Country where item originates
- organic: Whether item is organic
- rating: Customer rating
- barcode: Product barcode
- created_at: When item was created
- last_updated: When item was last updated

Rules:
1. ONLY generate SELECT queries - never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE
2. Always use the table name 'Inventory'
3. Use proper SQL syntax
4. For date comparisons, use appropriate date functions
5. Limit results to reasonable amounts (use LIMIT when appropriate)
6. Use ORDER BY for sorted results
7. Return only the SQL query, no explanations
8. Start every query with SELECT
`

export class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })
  }

  async generateSQL(userQuery) {
    try {
      const prompt = `${DATABASE_SCHEMA}

User Query: "${userQuery}"

Generate the SQL query:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      let sqlQuery = response.text().trim()
      
      // Clean up the response - remove any markdown formatting
      sqlQuery = sqlQuery.replace(/```sql/g, '').replace(/```/g, '').trim()
      
      return sqlQuery
    } catch (error) {
      console.error('Error generating SQL:', error)
      throw new Error('Failed to generate SQL query')
    }
  }

  async generateInsight(sqlResult, originalQuery) {
    try {
      const prompt = `
You are an AI inventory analyst. Based on the user's question and the SQL query results, provide a helpful, conversational response.

User's Question: "${originalQuery}"

Query Results: ${JSON.stringify(sqlResult)}

Provide a clear, helpful response that:
1. Answers the user's question directly
2. Highlights key insights from the data
3. Uses a conversational tone
4. Formats numbers appropriately
5. Suggests actionable next steps if relevant

Response:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text().trim()
    } catch (error) {
      console.error('Error generating insight:', error)
      return 'I found the data you requested, but had trouble analyzing it. Please try rephrasing your question.'
    }
  }

  async analyzeDataAndGenerateCharts(fullTableData, userQuery) {
    try {
      // Sample the data if it's too large (take first 50 items for analysis)
      const sampleData = fullTableData.slice(0, 50)
      
      const prompt = `
You are an expert data visualization analyst. Analyze the provided inventory data and generate appropriate chart configurations based on the user's query.

User Query: "${userQuery}"

Sample Inventory Data (first 50 items): ${JSON.stringify(sampleData, null, 2)}

Full Dataset Size: ${fullTableData.length} items

Based on the user's query and the data structure, determine the most appropriate visualizations and return a JSON response with the following structure:

{
  "insights": "A brief analysis of what the data shows relevant to the user's query",
  "charts": [
    {
      "type": "pie|bar|line|doughnut",
      "title": "Chart Title",
      "description": "What this chart shows",
      "dataProcessing": {
        "groupBy": "column_name_to_group_by",
        "aggregateBy": "count|sum|avg",
        "aggregateColumn": "column_name_to_aggregate (if not count)",
        "sortBy": "asc|desc",
        "limit": 10
      }
    }
  ]
}

IMPORTANT: Ensure the column names in "groupBy" and "aggregateColumn" exactly match the column names in the sample data. Common columns include:
- item_name, brand, category, supplier_name for grouping
- quantity, sales_velocity, total_stock_value, selling_price, margin_percent for aggregation
- For supply chain optimization, focus on: supplier_name, restock_lead_days, stock_health, days_until_stockout, auto_reorder_enabled

Guidelines:
1. Choose chart types that best represent the data:
   - Pie/Doughnut: For categorical distributions, percentages
   - Bar: For comparisons, rankings, top items
   - Line: For trends over time, sequential data
2. Suggest 1-3 relevant charts maximum
3. Focus on insights that directly answer the user's query
4. Use column names that exist in the data
5. Return valid JSON only, no markdown formatting

Response:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      let analysisResult = response.text().trim()
      
      // Clean up any markdown formatting
      analysisResult = analysisResult.replace(/```json/g, '').replace(/```/g, '').trim()
      
      // Parse the JSON response
      const analysis = JSON.parse(analysisResult)
      
      return analysis
    } catch (error) {
      console.error('Error analyzing data for charts:', error)
      return {
        insights: "I analyzed your inventory data but encountered an issue generating visualizations.",
        charts: []
      }
    }
  }

  async generateChartData(fullTableData, chartConfig) {
    try {
      const { dataProcessing } = chartConfig
      let processedData = [...fullTableData]
      
      console.log('Processing chart data with config:', dataProcessing)
      console.log('Sample data item:', processedData[0])
      
      // Validate that the groupBy column exists
      if (!processedData[0] || !processedData[0].hasOwnProperty(dataProcessing.groupBy)) {
        console.error(`Column '${dataProcessing.groupBy}' not found in data`)
        return []
      }
      
      // Group the data
      const grouped = {}
      processedData.forEach(item => {
        let groupKey = item[dataProcessing.groupBy]
        
        // Handle different data types
        if (groupKey === null || groupKey === undefined) {
          groupKey = 'Unknown'
        } else if (typeof groupKey === 'boolean') {
          groupKey = groupKey ? 'Yes' : 'No'
        } else {
          groupKey = String(groupKey)
        }
        
        if (!grouped[groupKey]) {
          grouped[groupKey] = []
        }
        grouped[groupKey].push(item)
      })
      
      console.log('Grouped data keys:', Object.keys(grouped))
      
      // Aggregate the data
      const aggregatedData = Object.keys(grouped).map(key => {
        const group = grouped[key]
        let value
        
        switch (dataProcessing.aggregateBy) {
          case 'count':
            value = group.length
            break
          case 'sum':
            if (!dataProcessing.aggregateColumn) {
              console.error('Sum aggregation requires aggregateColumn')
              value = group.length
            } else {
              value = group.reduce((sum, item) => {
                const val = parseFloat(item[dataProcessing.aggregateColumn]) || 0
                return sum + val
              }, 0)
            }
            break
          case 'avg':
            if (!dataProcessing.aggregateColumn) {
              console.error('Average aggregation requires aggregateColumn')
              value = group.length
            } else {
              const total = group.reduce((sum, item) => {
                const val = parseFloat(item[dataProcessing.aggregateColumn]) || 0
                return sum + val
              }, 0)
              value = group.length > 0 ? total / group.length : 0
            }
            break
          default:
            value = group.length
        }
        
        return {
          label: key,
          value: Math.round(value * 100) / 100 // Round to 2 decimal places
        }
      })
      
      console.log('Aggregated data:', aggregatedData)
      
      // Filter out zero values for better visualization
      const nonZeroData = aggregatedData.filter(item => item.value > 0)
      
      // Sort the data
      if (dataProcessing.sortBy === 'desc') {
        nonZeroData.sort((a, b) => b.value - a.value)
      } else if (dataProcessing.sortBy === 'asc') {
        nonZeroData.sort((a, b) => a.value - b.value)
      }
      
      // Limit the results
      const limitedData = nonZeroData.slice(0, dataProcessing.limit || 10)
      
      console.log('Final chart data:', limitedData)
      return limitedData
    } catch (error) {
      console.error('Error generating chart data:', error)
      return []
    }
  }
}

export const geminiService = new GeminiService()
