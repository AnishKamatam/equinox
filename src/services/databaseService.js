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
        
        console.error('❌ No accessible tables found.')
        this.hasRealData = false
        
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
          } else {
            console.log('📋 Sample data structure:', sampleData?.[0] ? Object.keys(sampleData[0]) : 'No structure')
            this.hasRealData = true
          }
        } else {
          console.log('⚠️ Table exists but appears empty - will still try real queries')
          this.hasRealData = false
        }
      }
    } catch (err) {
      console.error('💥 Connection test error:', err)
      this.hasRealData = false
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
      
      // Always use real data since we have 380 items connected
      if (!this.hasRealData) {
        console.log('⚠️ No real data detected, but continuing with real database queries')
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
        return [{ sum_total_stock_value: sum, total_value: sum, total_inventory_value: sum }]
      }
      
      if (lowerQuery.includes('sum(potential_revenue)')) {
        console.log('Fetching data for potential revenue SUM query...')
        const { data, error } = await this.client.from(this.tableName).select('potential_revenue')
        
        if (error) {
          console.error('Supabase potential revenue SUM error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('Potential revenue SUM query data length:', data?.length || 0)
        const sum = data?.reduce((acc, item) => acc + (parseFloat(item.potential_revenue) || 0), 0) || 0
        return [{ sum_potential_revenue: sum, total_potential_revenue: sum }]
      }
      
      if (lowerQuery.includes('sum(days_out_of_stock * selling_price)')) {
        console.log('Fetching data for out-of-stock loss calculation...')
        const { data, error } = await this.client.from(this.tableName).select('days_out_of_stock, selling_price')
        
        if (error) {
          console.error('Supabase out-of-stock loss error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('Out-of-stock loss query data length:', data?.length || 0)
        const sum = data?.reduce((acc, item) => {
          const days = parseFloat(item.days_out_of_stock) || 0
          const price = parseFloat(item.selling_price) || 0
          return acc + (days * price)
        }, 0) || 0
        return [{ out_of_stock_loss: sum, sum_loss: sum }]
      }
      
      // Handle AVG queries
      if (lowerQuery.includes('avg(quantity)')) {
        console.log('Fetching data for AVG quantity query...')
        const { data, error } = await this.client.from(this.tableName).select('quantity')
        
        if (error) {
          console.error('Supabase AVG quantity error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('AVG quantity query data length:', data?.length || 0)
        const avg = data?.reduce((acc, item) => acc + (item.quantity || 0), 0) / (data?.length || 1) || 0
        return [{ avg_quantity: avg, avg_stock_level: avg }]
      }
      
      if (lowerQuery.includes('avg(margin_percent)')) {
        console.log('Fetching data for AVG margin percent query...')
        const { data, error } = await this.client.from(this.tableName).select('margin_percent')
        
        if (error) {
          console.error('Supabase AVG margin error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('AVG margin query data length:', data?.length || 0)
        const avg = data?.reduce((acc, item) => acc + (parseFloat(item.margin_percent) || 0), 0) / (data?.length || 1) || 0
        return [{ avg_margin_percent: avg, avg_margin: avg }]
      }
      
      if (lowerQuery.includes('avg(stock_turnover_rate)')) {
        console.log('Fetching data for AVG stock turnover rate query...')
        const { data, error } = await this.client.from(this.tableName).select('stock_turnover_rate')
        
        if (error) {
          console.error('Supabase AVG turnover error:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        
        console.log('AVG turnover query data length:', data?.length || 0)
        const avg = data?.reduce((acc, item) => acc + (parseFloat(item.stock_turnover_rate) || 0), 0) / (data?.length || 1) || 0
        return [{ avg_turnover_rate: avg, avg_stock_turnover_rate: avg }]
      }
      
      // Handle GROUP BY queries
      if (lowerQuery.includes('group by')) {
        if (lowerQuery.includes('group by category')) {
          console.log('Fetching data for GROUP BY category query...')
          const { data, error } = await this.client.from(this.tableName).select('category, margin_percent')
          
          if (error) {
            console.error('Supabase GROUP BY error:', error)
            throw new Error(`Database error: ${error.message}`)
          }
          
          // Group by category and calculate averages
          const grouped = {}
          data?.forEach(item => {
            const category = item.category || 'Unknown'
            if (!grouped[category]) {
              grouped[category] = { total: 0, count: 0 }
            }
            grouped[category].total += parseFloat(item.margin_percent) || 0
            grouped[category].count += 1
          })
          
          const result = Object.keys(grouped).map(category => ({
            category,
            avg_margin: grouped[category].total / grouped[category].count
          }))
          
          return result.slice(0, 10) // Limit to 10 categories
        }
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
