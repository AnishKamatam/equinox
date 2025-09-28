import { supabase, supabaseAdmin } from '../lib/supabase'

class DirectDatabaseService {
  constructor() {
    this.tableName = 'Inventory'
    this.client = supabaseAdmin || supabase
    this.projectRef = 'mblgpbuvsykauaybypdf'
    this.dashboardUrl = 'https://supabase.com/dashboard/project/mblgpbuvsykauaybypdf/editor/17293'
    
    console.log('📡 DirectDatabaseService initialized:', {
      client: this.client ? 'Connected' : 'Not connected',
      table: this.tableName,
      project: this.projectRef,
      dashboardUrl: this.dashboardUrl
    })
    this.testConnection()
  }

  async testConnection() {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error('DirectDatabaseService connection error:', error)
        return false
      }
      
      console.log(`✅ DirectDatabaseService successfully connected to ${this.tableName} table:`, {
        rowCount: count,
        project: this.projectRef,
        table: this.tableName,
        dashboardUrl: this.dashboardUrl
      })
      return true
    } catch (err) {
      console.error(`❌ DirectDatabaseService connection test failed for ${this.tableName} table:`, {
        error: err,
        project: this.projectRef,
        dashboardUrl: this.dashboardUrl
      })
      return false
    }
  }

  // Get low stock items
  async getLowStockItems(limit = 10) {
    try {
      // Since Supabase doesn't support column comparisons directly, get all items and filter
      const { data, error } = await this.client
        .from(this.tableName)
        .select('item_name, quantity, threshold, brand, category')

      if (error) throw error
      
      // Filter items where quantity < threshold
      const lowStockItems = data.filter(item => 
        item.quantity < item.threshold
      ).sort((a, b) => a.quantity - b.quantity).slice(0, limit);

      console.log(`Found ${lowStockItems.length} low stock items from ${data.length} total items`);
      return lowStockItems
    } catch (error) {
      console.error('Error getting low stock items:', error)
      return []
    }
  }

  // Get inventory summary
  async getInventorySummary() {
    try {
      const { data: allItems, error } = await this.client
        .from(this.tableName)
        .select('quantity, threshold, total_stock_value, status, expired')

      if (error) throw error

      console.log(`Processing ${allItems.length} items for inventory summary`);

      const summary = {
        totalItems: allItems.length,
        totalValue: allItems.reduce((sum, item) => sum + (parseFloat(item.total_stock_value) || 0), 0),
        lowStockCount: allItems.filter(item => item.quantity < item.threshold).length,
        outOfStockCount: allItems.filter(item => item.quantity === 0).length,
        expiredCount: allItems.filter(item => item.expired).length,
        activeCount: allItems.filter(item => item.status === 'active').length
      }

      console.log('Inventory summary computed:', summary);
      return summary
    } catch (error) {
      console.error('Error getting inventory summary:', error)
      return null
    }
  }

  // Get top selling items
  async getTopSellingItems(limit = 5) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('item_name, brand, sales_velocity, sold_today, weekly_sales_volume')
        .order('sales_velocity', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting top selling items:', error)
      return []
    }
  }

  // Get items by category
  async getItemsByCategory(category = null, limit = 10) {
    try {
      let query = this.client
        .from(this.tableName)
        .select('item_name, brand, category, quantity, selling_price')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
        .order('item_name')
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting items by category:', error)
      return []
    }
  }

  // Get expensive items
  async getExpensiveItems(limit = 5) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('item_name, brand, selling_price, margin_percent, category')
        .order('selling_price', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting expensive items:', error)
      return []
    }
  }

  // Get suppliers info
  async getSuppliersInfo() {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('supplier_name, supplier_rating, supplier_contact')
        .not('supplier_name', 'is', null)

      if (error) throw error

      // Group by supplier and get averages
      const suppliers = {}
      data.forEach(item => {
        if (!suppliers[item.supplier_name]) {
          suppliers[item.supplier_name] = {
            name: item.supplier_name,
            contact: item.supplier_contact,
            ratings: []
          }
        }
        if (item.supplier_rating) {
          suppliers[item.supplier_name].ratings.push(parseFloat(item.supplier_rating))
        }
      })

      return Object.values(suppliers).map(supplier => ({
        name: supplier.name,
        contact: supplier.contact,
        avgRating: supplier.ratings.length > 0 
          ? (supplier.ratings.reduce((a, b) => a + b, 0) / supplier.ratings.length).toFixed(1)
          : 'N/A'
      }))
    } catch (error) {
      console.error('Error getting suppliers info:', error)
      return []
    }
  }

  // Get out of stock items
  async getOutOfStockItems(limit = 10) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('item_name, brand, category, days_out_of_stock')
        .eq('quantity', 0)
        .order('days_out_of_stock', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting out of stock items:', error)
      return []
    }
  }

  // Process natural language query and route to appropriate method
  async processQuery(query) {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('low stock') || lowerQuery.includes('need reorder')) {
      const items = await this.getLowStockItems()
      return {
        type: 'low_stock',
        data: items,
        summary: `Found ${items.length} items that are low in stock`
      }
    }

    if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
      const summary = await this.getInventorySummary()
      return {
        type: 'summary',
        data: summary,
        summary: `Inventory overview: ${summary.totalItems} total items worth $${summary.totalValue.toFixed(2)}`
      }
    }

    if (lowerQuery.includes('top selling') || lowerQuery.includes('best seller') || lowerQuery.includes('best selling')) {
      const items = await this.getTopSellingItems()
      return {
        type: 'top_selling',
        data: items,
        summary: `Top ${items.length} selling items by sales velocity`
      }
    }

    if (lowerQuery.includes('expensive') || lowerQuery.includes('costly') || lowerQuery.includes('price')) {
      const items = await this.getExpensiveItems()
      return {
        type: 'expensive',
        data: items,
        summary: `Most expensive items in inventory`
      }
    }

    if (lowerQuery.includes('supplier')) {
      const suppliers = await this.getSuppliersInfo()
      return {
        type: 'suppliers',
        data: suppliers,
        summary: `Information about ${suppliers.length} suppliers`
      }
    }

    if (lowerQuery.includes('out of stock') || lowerQuery.includes('zero stock')) {
      const items = await this.getOutOfStockItems()
      return {
        type: 'out_of_stock',
        data: items,
        summary: `Found ${items.length} items that are completely out of stock`
      }
    }

    if (lowerQuery.includes('category') || lowerQuery.includes('categories')) {
      const items = await this.getItemsByCategory()
      return {
        type: 'by_category',
        data: items,
        summary: `Items grouped by category`
      }
    }

    // Default: get inventory summary
    const summary = await this.getInventorySummary()
    return {
      type: 'default',
      data: summary,
      summary: `General inventory information: ${summary.totalItems} total items`
    }
  }
}

export const directDatabaseService = new DirectDatabaseService()
export default directDatabaseService