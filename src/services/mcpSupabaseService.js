// MCP Supabase Service for Voice Agent
// This service interfaces with the Supabase MCP server to provide 
// direct database access for the voice agent

class MCPSupabaseService {
  constructor() {
    this.projectRef = 'mblgpbuvsykauaybypdf';
    this.tableName = 'Inventory';
    this.supabaseUrl = `https://supabase.com/dashboard/project/${this.projectRef}/editor/17293`;
    console.log(`🔗 MCP Supabase Service initialized`);
    console.log(`📊 Project: ${this.projectRef}`);
    console.log(`📋 Table: ${this.tableName}`);
    console.log(`🌐 Dashboard: ${this.supabaseUrl}`);
  }

  // Execute MCP tool calls (simulated for now since we can't directly call MCP tools from frontend)
  async executeMCPQuery(queryType, parameters = {}) {
    console.log(`🔍 MCP Query Request:`, {
      queryType,
      parameters,
      source: 'MCP Supabase Service',
      project: this.projectRef,
      table: this.tableName,
      dashboardUrl: this.supabaseUrl
    });
    
    // For now, we'll use the existing directDatabaseService as a proxy
    // In a production setup, this would interface with an MCP-enabled backend
    const { directDatabaseService } = await import('./directDatabaseService.js');
    
    console.log(`📡 Executing query via DirectDatabaseService proxy for table: ${this.tableName}`);
    
    let result;
    const startTime = Date.now();
    
    try {
      switch (queryType) {
        case 'inventory_summary':
          console.log(`📊 Fetching inventory summary from ${this.tableName} table`);
          result = await directDatabaseService.getInventorySummary();
          break;
        
        case 'low_stock':
          console.log(`⚠️ Fetching low stock items (limit: ${parameters.limit || 10}) from ${this.tableName} table`);
          result = await directDatabaseService.getLowStockItems(parameters.limit || 10);
          break;
        
        case 'top_selling':
          console.log(`🏆 Fetching top selling items (limit: ${parameters.limit || 5}) from ${this.tableName} table`);
          result = await directDatabaseService.getTopSellingItems(parameters.limit || 5);
          break;
        
        case 'expensive_items':
          console.log(`💰 Fetching most expensive items (limit: ${parameters.limit || 5}) from ${this.tableName} table`);
          result = await directDatabaseService.getExpensiveItems(parameters.limit || 5);
          break;
        
        case 'suppliers':
          console.log(`🏭 Fetching suppliers info from ${this.tableName} table`);
          result = await directDatabaseService.getSuppliersInfo();
          break;
        
        case 'out_of_stock':
          console.log(`❌ Fetching out of stock items (limit: ${parameters.limit || 10}) from ${this.tableName} table`);
          result = await directDatabaseService.getOutOfStockItems(parameters.limit || 10);
          break;
        
        case 'categories':
          console.log(`📂 Fetching items by category from ${this.tableName} table`);
          result = await directDatabaseService.getItemsByCategory(
            parameters.category, 
            parameters.limit || 10
          );
          break;
        
        case 'custom_query':
          console.log(`🔧 Executing custom SQL query on ${this.tableName} table`);
          result = await this.executeCustomMCPQuery(parameters.query);
          break;
        
        default:
          console.log(`📊 Default fallback: fetching inventory summary from ${this.tableName} table`);
          result = await directDatabaseService.getInventorySummary();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ MCP Query Complete:`, {
        queryType,
        duration: `${duration}ms`,
        resultType: Array.isArray(result) ? `array[${result.length}]` : typeof result,
        dataSource: `Supabase ${this.tableName} table`,
        project: this.projectRef,
        dashboardUrl: this.supabaseUrl
      });
      
      // Log sample of actual data retrieved
      if (Array.isArray(result) && result.length > 0) {
        console.log(`📋 Sample data from ${this.tableName}:`, result.slice(0, 2));
      } else if (result && typeof result === 'object') {
        console.log(`📋 Data from ${this.tableName}:`, result);
      }
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`❌ MCP Query Failed:`, {
        queryType,
        duration: `${duration}ms`,
        error: error.message,
        dataSource: `Supabase ${this.tableName} table`,
        project: this.projectRef,
        dashboardUrl: this.supabaseUrl
      });
      
      throw error;
    }
  }

  // Execute custom SQL queries through MCP
  async executeCustomMCPQuery(sqlQuery) {
    console.log(`🔧 Executing custom MCP SQL query on ${this.tableName} table:`, {
      query: sqlQuery,
      project: this.projectRef,
      table: this.tableName,
      dashboardUrl: this.supabaseUrl
    });
    
    // In a real MCP integration, this would call:
    // mcpClient.callTool('supabase', 'execute_sql', { query: sqlQuery })
    
    // For now, proxy through existing service
    const { databaseService } = await import('./databaseService.js');
    try {
      console.log(`✅ Validating SQL query for ${this.tableName} table`);
      databaseService.validateQuery(sqlQuery);
      
      console.log(`📡 Executing validated SQL query on Supabase ${this.tableName} table`);
      const result = await databaseService.executeQuery(sqlQuery);
      
      console.log(`✅ Custom SQL query completed:`, {
        resultType: Array.isArray(result) ? `array[${result.length}]` : typeof result,
        dataSource: `Supabase ${this.tableName} table`,
        project: this.projectRef
      });
      
      return result;
    } catch (error) {
      console.error(`❌ MCP custom SQL query failed:`, {
        error: error.message,
        query: sqlQuery,
        table: this.tableName,
        project: this.projectRef
      });
      return null;
    }
  }

  // Generate natural language responses with MCP data
  async generateMCPResponse(queryResult, originalQuery) {
    if (!queryResult) {
      return "I don't have that information available right now.";
    }

    // Generate direct, confident responses as if data is already known
    if (Array.isArray(queryResult)) {
      if (queryResult.length === 0) {
        return `There aren't any items matching that criteria in your inventory.`;
      }
      
      // Handle array results (items, suppliers, etc.)
      if (originalQuery.toLowerCase().includes('low stock')) {
        const itemNames = queryResult.slice(0, 3).map(item => `${item.item_name} with ${item.quantity} remaining`);
        return `${queryResult.length} items are running low. Your most critical are ${itemNames.join(', ')}.`;
      }
      
      if (originalQuery.toLowerCase().includes('expensive')) {
        const expensiveItems = queryResult.slice(0, 3).map(item => `${item.item_name} at $${parseFloat(item.selling_price).toFixed(2)}`);
        return `Your most expensive items are ${expensiveItems.join(', ')}.`;
      }
      
      if (originalQuery.toLowerCase().includes('selling') || originalQuery.toLowerCase().includes('popular')) {
        console.log('🏆 Generating top selling response from actual data:', queryResult.slice(0, 3));
        const topItems = queryResult.slice(0, 3).map(item => `${item.item_name} with ${item.sales_velocity} sales velocity`);
        const response = `Your top performers are ${topItems.join(', ')}.`;
        console.log('📢 Generated response:', response);
        return response;
      }
      
      if (originalQuery.toLowerCase().includes('supplier')) {
        const suppliers = queryResult.slice(0, 3).map(supplier => `${supplier.name} rated ${supplier.avgRating}`);
        return `Your key suppliers are ${suppliers.join(', ')}.`;
      }
      
      // Generic array response
      return `You have ${queryResult.length} items matching that. Top ones include ${queryResult.slice(0, 2).map(item => item.item_name || item.name).join(' and ')}.`;
    }
    
    // Handle object results (summaries, stats)
    if (typeof queryResult === 'object' && queryResult.totalItems) {
      return `Your inventory has ${queryResult.totalItems} items valued at $${queryResult.totalValue?.toFixed(0)}. ${queryResult.lowStockCount} need reordering and ${queryResult.outOfStockCount} are out of stock.`;
    }
    
    // Fallback response
    return `Your inventory data shows various metrics. What specific aspect would you like to know more about?`;
  }

  // Process voice queries through MCP
  async processVoiceQuery(query) {
    console.log(`🎤 Processing voice query through MCP:`, {
      query,
      source: 'Voice Agent',
      targetTable: this.tableName,
      project: this.projectRef,
      dashboardUrl: this.supabaseUrl
    });
    
    const lowerQuery = query.toLowerCase();
    let queryResult;
    let queryType;
    
    try {
      // Determine query type and execute MCP query
      if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
        queryType = 'inventory_summary';
        queryResult = await this.executeMCPQuery(queryType);
      } else if (lowerQuery.includes('low stock') || lowerQuery.includes('running low')) {
        queryType = 'low_stock';
        queryResult = await this.executeMCPQuery(queryType, { limit: 10 });
      } else if (lowerQuery.includes('best sell') || lowerQuery.includes('top sell') || lowerQuery.includes('popular')) {
        queryType = 'top_selling';
        queryResult = await this.executeMCPQuery(queryType, { limit: 5 });
      } else if (lowerQuery.includes('expensive') || lowerQuery.includes('costly') || lowerQuery.includes('highest price')) {
        queryType = 'expensive_items';
        queryResult = await this.executeMCPQuery(queryType, { limit: 5 });
      } else if (lowerQuery.includes('supplier') || lowerQuery.includes('vendor')) {
        queryType = 'suppliers';
        queryResult = await this.executeMCPQuery(queryType);
      } else if (lowerQuery.includes('out of stock') || lowerQuery.includes('zero stock')) {
        queryType = 'out_of_stock';
        queryResult = await this.executeMCPQuery(queryType, { limit: 10 });
      } else {
        // Default to inventory summary
        queryType = 'inventory_summary';
        queryResult = await this.executeMCPQuery(queryType);
      }
      
      // Generate natural language response
      const response = await this.generateMCPResponse(queryResult, query);
      
      console.log(`🎯 Voice query processing complete:`, {
        originalQuery: query,
        queryType,
        responseLength: response.length,
        dataSource: `Supabase ${this.tableName} table`,
        project: this.projectRef,
        success: true
      });
      
      return {
        queryType,
        data: queryResult,
        response,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ MCP voice query processing failed:`, {
        query,
        error: error.message,
        table: this.tableName,
        project: this.projectRef,
        dashboardUrl: this.supabaseUrl
      });
      
      return {
        queryType: 'error',
        data: null,
        response: "I'm having trouble accessing your inventory data right now. Please try again.",
        success: false
      };
    }
  }

  // Get MCP connection status
  getMCPStatus() {
    return {
      connected: true, // Simulated for now
      projectRef: this.projectRef,
      tableName: this.tableName,
      mcpEnabled: true
    };
  }

  // Test connection and data retrieval
  async testConnection() {
    console.log('🧪 Testing MCP Supabase Connection...');
    
    try {
      const testResult = await this.processVoiceQuery('show me my inventory summary');
      console.log('✅ MCP Connection Test Result:', testResult);
      return testResult;
    } catch (error) {
      console.error('❌ MCP Connection Test Failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const mcpSupabaseService = new MCPSupabaseService();
export default mcpSupabaseService;