import { directDatabaseService } from './directDatabaseService.js';
import { geminiService } from './geminiService.js';
import { databaseService } from './databaseService.js';

class IntelligentQueryService {
  constructor() {
    this.queryTypes = {
      INVENTORY_SUMMARY: 'inventory_summary',
      LOW_STOCK: 'low_stock',
      TOP_SELLING: 'top_selling',
      EXPENSIVE_ITEMS: 'expensive_items',
      SUPPLIERS: 'suppliers',
      OUT_OF_STOCK: 'out_of_stock',
      CATEGORIES: 'categories',
      SPECIFIC_ITEM: 'specific_item',
      FINANCIAL: 'financial',
      ANALYTICS: 'analytics'
    };
  }

  // Analyze query intent using Gemini AI
  async analyzeQueryIntent(query) {
    const analysisPrompt = `
    Analyze this inventory management query and determine the user's intent:
    Query: "${query}"
    
    Available query types:
    - inventory_summary: Overall inventory statistics and health
    - low_stock: Items that need reordering (quantity < threshold)
    - top_selling: Best performing items by sales velocity
    - expensive_items: Highest priced items
    - suppliers: Supplier information and ratings
    - out_of_stock: Items with zero quantity
    - categories: Items grouped by category
    - specific_item: Looking for specific products by name
    - financial: Revenue, costs, margins analysis
    - analytics: Trends, performance metrics
    
    Respond with ONLY a JSON object like this:
    {
      "intent": "query_type_here",
      "confidence": 0.9,
      "parameters": {
        "item_name": "optional specific item",
        "category": "optional category filter",
        "limit": 5,
        "threshold": "optional number"
      },
      "reasoning": "Brief explanation of why this intent was chosen"
    }
    `;

    try {
      const response = await geminiService.generateResponse(analysisPrompt);
      const analysis = JSON.parse(response);
      console.log('Gemini intent analysis:', analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing query intent:', error);
      // Fallback to simple pattern matching
      return this.fallbackIntentAnalysis(query);
    }
  }

  // Fallback intent analysis using pattern matching
  fallbackIntentAnalysis(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('total')) {
      return {
        intent: this.queryTypes.INVENTORY_SUMMARY,
        confidence: 0.8,
        parameters: {},
        reasoning: 'Query contains summary/overview keywords'
      };
    }
    
    if (lowerQuery.includes('low stock') || lowerQuery.includes('need reorder') || lowerQuery.includes('running low')) {
      return {
        intent: this.queryTypes.LOW_STOCK,
        confidence: 0.9,
        parameters: { limit: 10 },
        reasoning: 'Query mentions low stock or reordering'
      };
    }
    
    if (lowerQuery.includes('best sell') || lowerQuery.includes('top sell') || lowerQuery.includes('popular')) {
      return {
        intent: this.queryTypes.TOP_SELLING,
        confidence: 0.9,
        parameters: { limit: 5 },
        reasoning: 'Query asks about best/top selling items'
      };
    }
    
    if (lowerQuery.includes('expensive') || lowerQuery.includes('costly') || lowerQuery.includes('highest price')) {
      return {
        intent: this.queryTypes.EXPENSIVE_ITEMS,
        confidence: 0.9,
        parameters: { limit: 5 },
        reasoning: 'Query asks about expensive items'
      };
    }
    
    if (lowerQuery.includes('supplier') || lowerQuery.includes('vendor')) {
      return {
        intent: this.queryTypes.SUPPLIERS,
        confidence: 0.9,
        parameters: {},
        reasoning: 'Query mentions suppliers or vendors'
      };
    }
    
    if (lowerQuery.includes('out of stock') || lowerQuery.includes('zero stock') || lowerQuery.includes('empty')) {
      return {
        intent: this.queryTypes.OUT_OF_STOCK,
        confidence: 0.9,
        parameters: { limit: 10 },
        reasoning: 'Query asks about out of stock items'
      };
    }
    
    // Default to inventory summary
    return {
      intent: this.queryTypes.INVENTORY_SUMMARY,
      confidence: 0.3,
      parameters: {},
      reasoning: 'Default fallback to inventory summary'
    };
  }

  // Process query with intelligent routing
  async processIntelligentQuery(query) {
    console.log('Processing intelligent query:', query);
    
    // Step 1: Analyze intent
    const analysis = await this.analyzeQueryIntent(query);
    console.log('Query analysis result:', analysis);
    
    // Step 2: Execute appropriate query based on intent
    let queryResult;
    
    try {
      switch (analysis.intent) {
        case this.queryTypes.INVENTORY_SUMMARY:
          queryResult = await directDatabaseService.getInventorySummary();
          break;
          
        case this.queryTypes.LOW_STOCK:
          queryResult = await directDatabaseService.getLowStockItems(analysis.parameters.limit || 10);
          break;
          
        case this.queryTypes.TOP_SELLING:
          queryResult = await directDatabaseService.getTopSellingItems(analysis.parameters.limit || 5);
          break;
          
        case this.queryTypes.EXPENSIVE_ITEMS:
          queryResult = await directDatabaseService.getExpensiveItems(analysis.parameters.limit || 5);
          break;
          
        case this.queryTypes.SUPPLIERS:
          queryResult = await directDatabaseService.getSuppliersInfo();
          break;
          
        case this.queryTypes.OUT_OF_STOCK:
          queryResult = await directDatabaseService.getOutOfStockItems(analysis.parameters.limit || 10);
          break;
          
        case this.queryTypes.CATEGORIES:
          queryResult = await directDatabaseService.getItemsByCategory(
            analysis.parameters.category, 
            analysis.parameters.limit || 10
          );
          break;
          
        case this.queryTypes.SPECIFIC_ITEM:
          // For specific item queries, use SQL generation
          queryResult = await this.processSpecificItemQuery(query, analysis.parameters);
          break;
          
        case this.queryTypes.FINANCIAL:
        case this.queryTypes.ANALYTICS:
          // For complex queries, use SQL generation
          queryResult = await this.processComplexQuery(query);
          break;
          
        default:
          queryResult = await directDatabaseService.getInventorySummary();
      }
    } catch (error) {
      console.error('Error executing query:', error);
      throw new Error(`Failed to process query: ${error.message}`);
    }
    
    // Step 3: Generate intelligent response
    const response = await this.generateIntelligentResponse(query, analysis, queryResult);
    
    return {
      type: analysis.intent,
      data: queryResult,
      summary: response.summary,
      analysis: response.fullAnalysis,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning
    };
  }

  // Process specific item queries using SQL
  async processSpecificItemQuery(query, parameters) {
    try {
      const sqlQuery = await geminiService.generateSQL(query);
      console.log('Generated SQL for specific item query:', sqlQuery);
      databaseService.validateQuery(sqlQuery);
      return await databaseService.executeQuery(sqlQuery);
    } catch (error) {
      console.error('Error processing specific item query:', error);
      // Fallback to general search
      return await directDatabaseService.getItemsByCategory();
    }
  }

  // Process complex queries using SQL generation
  async processComplexQuery(query) {
    try {
      const sqlQuery = await geminiService.generateSQL(query);
      console.log('Generated SQL for complex query:', sqlQuery);
      databaseService.validateQuery(sqlQuery);
      return await databaseService.executeQuery(sqlQuery);
    } catch (error) {
      console.error('Error processing complex query:', error);
      // Fallback to inventory summary
      return await directDatabaseService.getInventorySummary();
    }
  }

  // Generate intelligent conversational response
  async generateIntelligentResponse(originalQuery, analysis, queryResult) {
    const responsePrompt = `
    Generate a conversational response for this inventory query:
    
    Original Query: "${originalQuery}"
    Query Intent: ${analysis.intent}
    Confidence: ${analysis.confidence}
    
    Query Results: ${JSON.stringify(queryResult, null, 2)}
    
    Create a natural, conversational response that:
    1. Acknowledges what the user asked
    2. Summarizes the key findings
    3. Provides actionable insights
    4. Uses a friendly, professional tone
    
    Return JSON with:
    {
      "summary": "Brief 1-2 sentence summary",
      "fullAnalysis": "Detailed conversational response with insights"
    }
    `;

    try {
      const response = await geminiService.generateResponse(responsePrompt);
      const analysis_result = JSON.parse(response);
      console.log('Generated intelligent response:', analysis_result);
      return analysis_result;
    } catch (error) {
      console.error('Error generating intelligent response:', error);
      return {
        summary: `Found results for your query: ${originalQuery}`,
        fullAnalysis: `I found the information you requested. The results show ${Array.isArray(queryResult) ? queryResult.length + ' items' : 'summary data'} from your inventory.`
      };
    }
  }

  // Get query suggestions based on current data
  async getQuerySuggestions() {
    try {
      const summary = await directDatabaseService.getInventorySummary();
      const lowStock = await directDatabaseService.getLowStockItems(3);
      
      const suggestions = [];
      
      if (summary.lowStockCount > 0) {
        suggestions.push(`You have ${summary.lowStockCount} items running low - want to see which ones?`);
      }
      
      if (summary.outOfStockCount > 0) {
        suggestions.push(`${summary.outOfStockCount} items are completely out of stock`);
      }
      
      suggestions.push(`View your top selling products`);
      suggestions.push(`Show me my most expensive inventory`);
      suggestions.push(`What's my total inventory value?`);
      
      return suggestions;
    } catch (error) {
      console.error('Error getting query suggestions:', error);
      return [
        'Show me my inventory summary',
        'What items are running low?',
        'Which products sell the best?'
      ];
    }
  }
}

export const intelligentQueryService = new IntelligentQueryService();
export default intelligentQueryService;