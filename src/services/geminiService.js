import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-gemini-api-key')

// Database schema for context
const DATABASE_SCHEMA = `
You are an expert SQL query generator for an inventory management system. 
Generate ONLY the SQL query without any explanation or markdown formatting.

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
1. Always use the table name 'Inventory'
2. Use proper SQL syntax
3. For date comparisons, use appropriate date functions
4. Limit results to reasonable amounts (use LIMIT when appropriate)
5. Use ORDER BY for sorted results
6. Return only the SQL query, no explanations
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
}

export const geminiService = new GeminiService()
