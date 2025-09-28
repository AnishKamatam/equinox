import { supabase, supabaseAdmin } from '../lib/supabase'

// Database service to execute SQL queries using Supabase
export class DatabaseService {
  constructor() {
    this.tableName = 'Inventory'
    // Use admin client if available (bypasses RLS), otherwise use regular client
    this.client = supabaseAdmin || supabase
    this.testConnection()
  }
  
  async testConnection() {
    try {
      console.log('🔍 Testing Supabase connection...')
      console.log('Supabase URL:', supabase.supabaseUrl)
      console.log('Testing table:', this.tableName)
      console.log('Using client:', supabaseAdmin ? 'Admin (bypasses RLS)' : 'Anonymous')
      
      // Test with count first to check permissions
      const { count, error: countError } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('❌ Count query failed:', countError)
        console.log('Error details:', {
          message: countError.message,
          code: countError.code,
          details: countError.details,
          hint: countError.hint
        })
        
        // Try alternative table names
        console.log('🔄 Trying alternative table names...')
        
        const alternatives = ['inventory', 'inventory_items', 'Inventory_rows']
        for (const tableName of alternatives) {
          console.log(`Testing table: ${tableName}`)
          const { count: altCount, error: altError } = await this.client
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          if (!altError && altCount !== null) {
            console.log(`✅ Found working table: ${tableName} with ${altCount} rows`)
            this.tableName = tableName
            this.hasRealData = altCount > 0
            if (!this.hasRealData) {
              this.mockData = this.generateMockData()
            }
            return
          } else if (altError) {
            console.log(`❌ ${tableName} failed:`, altError.message)
          }
        }
        
        console.error('❌ No accessible tables found. Using mock data.')
        this.hasRealData = false
        this.mockData = this.generateMockData()
        
      } else {
        console.log(`✅ Successfully connected to table: ${this.tableName}`)
        console.log(`📊 Row count: ${count}`)
        
        if (count > 0) {
          // Get sample data to check structure
          const { data: sampleData, error: sampleError } = await this.client
            .from(this.tableName)
            .select('*')
            .limit(1)
          
          if (sampleError) {
            console.error('❌ Sample data fetch failed:', sampleError)
            this.hasRealData = false
            this.mockData = this.generateMockData()
          } else {
            console.log('📋 Sample data structure:', sampleData?.[0] ? Object.keys(sampleData[0]) : 'No structure')
            this.hasRealData = true
          }
        } else {
          console.log('⚠️ Table exists but is empty - using mock data')
          this.hasRealData = false
          this.mockData = this.generateMockData()
        }
      }
    } catch (err) {
      console.error('💥 Connection test error:', err)
      this.hasRealData = false
      this.mockData = this.generateMockData()
    }
  }

  generateMockData() {
    // Generate realistic mock data based on your schema
    const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden']
    const brands = ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'Dell', 'HP']
    const suppliers = ['TechCorp', 'FashionHub', 'FoodDist', 'BookWorld', 'GardenPlus']
    
    const items = []
    for (let i = 1; i <= 370; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const brand = brands[Math.floor(Math.random() * brands.length)]
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
      
      items.push({
        item_id: i,
        sku: `SKU-${String(i).padStart(4, '0')}`,
        item_name: `${brand} Product ${i}`,
        brand: brand,
        description: `High quality ${category.toLowerCase()} product`,
        category: category,
        subcategory: `${category} Sub`,
        tags: `${brand.toLowerCase()},${category.toLowerCase()}`,
        status: Math.random() > 0.1 ? 'active' : 'low_stock',
        quantity: Math.floor(Math.random() * 100) + 1,
        threshold: Math.floor(Math.random() * 20) + 5,
        initial_quantity: Math.floor(Math.random() * 200) + 50,
        sold_today: Math.floor(Math.random() * 10),
        sales_velocity: (Math.random() * 5).toFixed(2),
        stock_health: Math.random() > 0.3 ? 'good' : 'critical',
        days_out_of_stock: Math.floor(Math.random() * 5),
        stock_turnover_rate: (Math.random() * 10).toFixed(2),
        storage_type: Math.random() > 0.5 ? 'ambient' : 'refrigerated',
        location_in_store: `Aisle ${Math.floor(Math.random() * 10) + 1}`,
        unit_cost: (Math.random() * 50 + 10).toFixed(2),
        selling_price: (Math.random() * 100 + 20).toFixed(2),
        margin_percent: (Math.random() * 40 + 10).toFixed(2),
        markup_percent: (Math.random() * 60 + 20).toFixed(2),
        potential_revenue: (Math.random() * 1000 + 100).toFixed(2),
        total_stock_value: (Math.random() * 5000 + 500).toFixed(2),
        discount_active: Math.random() > 0.7,
        discount_percent: Math.random() > 0.7 ? (Math.random() * 20 + 5).toFixed(0) : 0,
        loyalty_points: Math.floor(Math.random() * 100) + 10,
        supplier_name: supplier,
        supplier_contact: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        supplier_email: `contact@${supplier.toLowerCase()}.com`,
        supplier_address: `${Math.floor(Math.random() * 999) + 1} Business St`,
        supplier_rating: (Math.random() * 2 + 3).toFixed(1),
        restock_lead_days: Math.floor(Math.random() * 14) + 1,
        last_restock_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        next_expected_restock: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        last_restock_qty: Math.floor(Math.random() * 100) + 20,
        auto_reorder_enabled: Math.random() > 0.5,
        predicted_demand_next_7d: Math.floor(Math.random() * 50) + 5,
        days_until_stockout: Math.floor(Math.random() * 30) + 1,
        expiry_days: Math.floor(Math.random() * 365) + 30,
        expiry_date: new Date(Date.now() + (Math.random() * 365 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days_until_expiry: Math.floor(Math.random() * 365) + 30,
        expired: Math.random() > 0.95,
        sales_history: JSON.stringify([Math.floor(Math.random() * 20), Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)]),
        weekly_sales_volume: Math.floor(Math.random() * 100) + 10,
        sales_trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        country_of_origin: ['USA', 'China', 'Germany', 'Japan', 'Italy'][Math.floor(Math.random() * 5)],
        organic: Math.random() > 0.7,
        rating: (Math.random() * 2 + 3).toFixed(1),
        barcode: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    
    return items
  }

  async executeQuery(sqlQuery) {
    try {
      console.log('Executing SQL Query:', sqlQuery)
      
      // If no real data, use mock data
      if (!this.hasRealData) {
        console.log('📊 Using mock data (table is empty)')
        return this.executeMockQuery(sqlQuery)
      }
      
      // Convert SQL to Supabase query
      const lowerQuery = sqlQuery.toLowerCase().trim()
      
      // Handle COUNT queries
      if (lowerQuery.includes('count(*)')) {
        // Add WHERE conditions for count queries
        if (lowerQuery.includes('where quantity < threshold')) {
          // For low stock items, we need to use a custom filter
          console.log('Fetching all items for low stock comparison...')
          const { data: allItems, error } = await this.client.from(this.tableName).select('quantity, threshold')
          
          if (error) {
            console.error('Supabase error fetching items:', error)
            throw new Error(`Database error: ${error.message}`)
          }
          
          console.log('Fetched items for low stock check:', allItems?.length || 0)
          const lowStockCount = allItems?.filter(item => item.quantity < item.threshold).length || 0
          return [{ count: lowStockCount, low_stock_items: lowStockCount, total_items: lowStockCount }]
        }
        
        let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true })
        
        if (lowerQuery.includes('where quantity = 0')) {
          query = query.eq('quantity', 0)
        }
        
        console.log('Executing count query...')
        const { count, error } = await query
        
        if (error) {
          console.error('Supabase count error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('Count result:', count)
        return [{ count: count || 0, total_items: count || 0, low_stock_items: count || 0, out_of_stock: count || 0 }]
      }
      
      // Handle SUM queries
      if (lowerQuery.includes('sum(total_stock_value)')) {
        console.log('Fetching data for SUM query...')
        const { data, error } = await this.client.from(this.tableName).select('total_stock_value')
        
        if (error) {
          console.error('Supabase SUM error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('SUM query data length:', data?.length || 0)
        const sum = data?.reduce((acc, item) => acc + (parseFloat(item.total_stock_value) || 0), 0) || 0
        return [{ sum_total_stock_value: sum, total_value: sum }]
      }
      
      // Handle AVG queries
      if (lowerQuery.includes('avg(quantity)')) {
        console.log('Fetching data for AVG query...')
        const { data, error } = await this.client.from(this.tableName).select('quantity')
        
        if (error) {
          console.error('Supabase AVG error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('AVG query data length:', data?.length || 0)
        const avg = data?.reduce((acc, item) => acc + (item.quantity || 0), 0) / (data?.length || 1) || 0
        return [{ avg_quantity: avg, avg_stock_level: avg }]
      }
      
      // Handle SELECT queries
      let query = this.client.from(this.tableName).select('*')
      
      // Handle WHERE conditions
      if (lowerQuery.includes('where')) {
        if (lowerQuery.includes('quantity < threshold')) {
          // Get all items and filter in JavaScript since Supabase doesn't support column comparisons directly
          const { data: allItems } = await this.client.from(this.tableName).select('*')
          const filteredItems = allItems?.filter(item => item.quantity < item.threshold) || []
          
          // Apply LIMIT if present
          const limitMatch = lowerQuery.match(/limit (\d+)/)
          if (limitMatch) {
            const limit = parseInt(limitMatch[1])
            return filteredItems.slice(0, limit)
          }
          return filteredItems
        }
        
        if (lowerQuery.includes('quantity = 0')) {
          query = query.eq('quantity', 0)
        }
        
        if (lowerQuery.includes('status = \'active\'')) {
          query = query.eq('status', 'active')
        }
        
        if (lowerQuery.includes('expired = true')) {
          query = query.eq('expired', true)
        }
      }
      
      // Handle ORDER BY
      if (lowerQuery.includes('order by')) {
        if (lowerQuery.includes('sales_velocity desc')) {
          query = query.order('sales_velocity', { ascending: false })
        }
        if (lowerQuery.includes('quantity desc')) {
          query = query.order('quantity', { ascending: false })
        }
        if (lowerQuery.includes('selling_price desc')) {
          query = query.order('selling_price', { ascending: false })
        }
      }
      
      // Handle LIMIT
      const limitMatch = lowerQuery.match(/limit (\d+)/)
      if (limitMatch) {
        const limit = parseInt(limitMatch[1])
        query = query.limit(limit)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Supabase query error:', error)
        throw new Error(`Database query failed: ${error.message}`)
      }
      
      return data || []
      
    } catch (error) {
      console.error('Database query error:', error)
      throw new Error('Failed to execute database query')
    }
  }

  // Execute query against mock data when real table is empty
  executeMockQuery(sqlQuery) {
    const lowerQuery = sqlQuery.toLowerCase()
    
    let results = [...this.mockData]
    
    // Handle basic WHERE conditions
    if (lowerQuery.includes('where')) {
      if (lowerQuery.includes('quantity <') || lowerQuery.includes('low stock')) {
        results = results.filter(item => item.quantity < item.threshold)
      }
      if (lowerQuery.includes('status = \'active\'')) {
        results = results.filter(item => item.status === 'active')
      }
      if (lowerQuery.includes('expired = true')) {
        results = results.filter(item => item.expired === true)
      }
      if (lowerQuery.includes('quantity = 0')) {
        results = results.filter(item => item.quantity === 0)
      }
    }
    
    // Handle ORDER BY
    if (lowerQuery.includes('order by')) {
      if (lowerQuery.includes('quantity desc')) {
        results.sort((a, b) => b.quantity - a.quantity)
      }
      if (lowerQuery.includes('selling_price desc')) {
        results.sort((a, b) => b.selling_price - a.selling_price)
      }
      if (lowerQuery.includes('sales_velocity desc')) {
        results.sort((a, b) => b.sales_velocity - a.sales_velocity)
      }
    }
    
    // Handle LIMIT
    const limitMatch = lowerQuery.match(/limit (\d+)/)
    if (limitMatch) {
      const limit = parseInt(limitMatch[1])
      results = results.slice(0, limit)
    }
    
    // Handle basic aggregations
    if (lowerQuery.includes('count(*)')) {
      return [{ count: results.length, total_items: results.length, low_stock_items: results.length, out_of_stock: results.length }]
    }
    
    if (lowerQuery.includes('sum(total_stock_value)')) {
      const sum = results.reduce((acc, item) => acc + parseFloat(item.total_stock_value), 0)
      return [{ sum_total_stock_value: sum, total_value: sum }]
    }
    
    if (lowerQuery.includes('avg(quantity)')) {
      const avg = results.reduce((acc, item) => acc + item.quantity, 0) / results.length
      return [{ avg_quantity: avg, avg_stock_level: avg }]
    }
    
    return results
  }

  // Helper method to validate SQL queries (basic security)
  validateQuery(sqlQuery) {
    const dangerousKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate']
    const lowerQuery = sqlQuery.toLowerCase()
    
    for (const keyword of dangerousKeywords) {
      if (lowerQuery.includes(keyword)) {
        throw new Error(`Query contains dangerous keyword: ${keyword}`)
      }
    }
    
    return true
  }
}

export const databaseService = new DatabaseService()
