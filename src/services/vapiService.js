import Vapi from '@vapi-ai/web';
import { directDatabaseService } from './directDatabaseService.js';

class VapiService {
  constructor() {
    this.vapi = null;
    this.isCallActive = false;
    this.onMessageCallback = null;
    this.onCallStartCallback = null;
    this.onCallEndCallback = null;
  }

  // Initialize Vapi with your API key
  initialize(apiKey) {
    console.log('Initializing Vapi with API key:', apiKey ? `Present (${apiKey.substring(0, 8)}...)` : 'Missing');
    
    if (!apiKey || apiKey === 'your_vapi_api_key_here') {
      throw new Error('Vapi API key is required. Please add VITE_VAPI_API_KEY to your .env file.');
    }
    
    // Note: Vapi may use UUID format for both public and private keys
    console.log('Using API key format:', apiKey.length > 20 ? 'Long format' : 'Short format');
    
    this.vapi = new Vapi(apiKey);
    
    // Set up event listeners
    this.vapi.on('call-start', () => {
      console.log('Vapi call started');
      this.isCallActive = true;
      if (this.onCallStartCallback) {
        this.onCallStartCallback();
      }
    });

    this.vapi.on('call-end', () => {
      console.log('Vapi call ended');
      this.isCallActive = false;
      if (this.onCallEndCallback) {
        this.onCallEndCallback();
      }
    });

    this.vapi.on('speech-start', () => {
      console.log('User started speaking');
    });

    this.vapi.on('speech-end', () => {
      console.log('User stopped speaking');
    });

    // Handle voice messages and process through database
    this.vapi.on('message', async (message) => {
      console.log('Received Vapi message:', JSON.stringify(message, null, 2));
      
      if (message.type === 'function-call' && message.functionCall?.name === 'queryDatabase') {
        console.log('Processing function call for queryDatabase');
        
        try {
          const userQuery = message.functionCall.parameters.query;
          console.log('Processing voice query:', userQuery);
          
          // Process voice query through direct database service
          const queryResult = await directDatabaseService.processQuery(userQuery);
          console.log('Query result:', queryResult);
          
          // Generate conversational response
          let responseText = `${queryResult.summary}. `;
          
          if (queryResult.type === 'low_stock' && queryResult.data.length > 0) {
            responseText += `The items that need reordering are: ${queryResult.data.slice(0, 3).map(item => 
              `${item.item_name} by ${item.brand} with only ${item.quantity} left`).join(', ')}.`;
          } else if (queryResult.type === 'summary' && queryResult.data) {
            const data = queryResult.data;
            responseText += `You have ${data.totalItems} items worth $${data.totalValue.toFixed(0)}. ${data.lowStockCount} items are low on stock and ${data.outOfStockCount} are completely out of stock.`;
          } else if (queryResult.type === 'expensive' && queryResult.data.length > 0) {
            responseText += `Your most expensive items are: ${queryResult.data.slice(0, 3).map(item => 
              `${item.item_name} at $${item.selling_price}`).join(', ')}.`;
          } else if (queryResult.type === 'suppliers' && queryResult.data.length > 0) {
            responseText += `Your suppliers include: ${queryResult.data.slice(0, 3).map(supplier => 
              `${supplier.name} with ${supplier.avgRating} rating`).join(', ')}.`;
          }
          
          const response = {
            type: 'function-call-result',
            functionCallId: message.functionCall.id,
            result: responseText
          };
          
          console.log('Sending response to Vapi:', response);
          this.vapi.send(response);
          
          // Trigger callback for UI update
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query',
              query: userQuery,
              result: queryResult, // Pass the full structured result
              analysis: responseText
            });
          }
          
          return; // Exit early if we handled a function call
        } catch (error) {
          console.error('Error processing voice query:', error);
          
          const errorResponse = {
            type: 'function-call-result',
            functionCallId: message.functionCall.id,
            result: 'Sorry, I encountered an error processing your query. Please try again.'
          };
          
          this.vapi.send(errorResponse);
          return;
        }
      }
      
      // Handle other message types if needed
      if (message.type === 'transcript' && message.role === 'user' && message.transcriptType === 'final') {
        console.log('User said:', message.transcript);
        // Manually trigger database query if function calling isn't working
        try {
          const queryResult = await directDatabaseService.processQuery(message.transcript);
          console.log('Manual query result:', queryResult);
          
          // Trigger callback for UI update
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query',
              query: message.transcript,
              result: queryResult,
              analysis: queryResult.summary
            });
          }
        } catch (error) {
          console.error('Error in manual query processing:', error);
        }
      }
      
    });

    this.vapi.on('error', (error) => {
      console.error('Vapi error:', error);
    });
  }

  // Start voice call with database querying capabilities
  async startCall() {
    if (!this.vapi) {
      throw new Error('Vapi not initialized. Call initialize() first.');
    }

    // Assistant configuration with database querying functions
    const assistant = {
      name: "Inventory Assistant",
      firstMessage: "Hello! I can help you with your inventory. Ask me about low stock, sales data, or any inventory questions.",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        messages: [{
          role: "system",
          content: `You are an inventory management assistant with access to a Supabase database table called 'Inventory' containing 380+ items.

The database has these key fields:
- item_name, brand, category, subcategory, description
- quantity (current stock), threshold (reorder level), initial_quantity  
- unit_cost, selling_price, margin_percent, total_stock_value
- sales_velocity, sold_today, weekly_sales_volume
- supplier_name, supplier_contact, supplier_rating
- status (active/discontinued), stock_health, days_out_of_stock
- expiry_date, expired, organic
- location_in_store, storage_type

When users ask inventory questions, ALWAYS use the queryDatabase function. Examples:
- "low stock items" → query for items where quantity < threshold
- "inventory summary" → query for totals, averages, counts
- "expensive products" → query ordered by selling_price
- "by category" → group by category
- "supplier info" → query supplier fields

Be conversational and explain the data clearly.`
        }]
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM"
      },
      functions: [
        {
          name: "queryDatabase",
          description: "Query the inventory database with natural language requests",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The user's natural language query about their inventory data"
              }
            },
            required: ["query"]
          }
        }
      ]
    };

    try {
      console.log('Starting Vapi call with assistant config:', assistant);
      await this.vapi.start(assistant);
    } catch (error) {
      console.error('Error starting Vapi call:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      // If 400 Bad Request, try an even simpler config
      if (error.message && error.message.includes('400')) {
        console.log('Trying minimal assistant configuration...');
        try {
          const minimalAssistant = {
            model: { provider: "openai", model: "gpt-3.5-turbo" },
            voice: { provider: "11labs", voiceId: "burt" }
          };
          await this.vapi.start(minimalAssistant);
          return;
        } catch (retryError) {
          console.error('Retry with minimal config also failed:', retryError);
        }
      }
      
      throw error;
    }
  }

  // End the voice call
  async endCall() {
    if (this.vapi && this.isCallActive) {
      await this.vapi.stop();
    }
  }

  // Set callback for when voice messages are processed
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  // Set callback for when call starts
  onCallStart(callback) {
    this.onCallStartCallback = callback;
  }

  // Set callback for when call ends  
  onCallEnd(callback) {
    this.onCallEndCallback = callback;
  }

  // Check if call is currently active
  isActive() {
    return this.isCallActive;
  }

  // Get current volume level (for visual feedback)
  getVolume() {
    // The Vapi SDK doesn't have getVolume method, return mock data
    return this.isCallActive ? Math.random() * 0.3 : 0;
  }
}

// Export singleton instance
export const vapiService = new VapiService();
export default vapiService;