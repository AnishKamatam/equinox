import Vapi from '@vapi-ai/web';
import { intelligentQueryService } from './intelligentQueryService.js';

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
          console.log('Processing intelligent voice query:', userQuery);
          
          // Trigger loading state
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query-start',
              query: userQuery
            });
          }
          
          // Process voice query through intelligent query service
          const queryResult = await intelligentQueryService.processIntelligentQuery(userQuery);
          console.log('Intelligent query result:', queryResult);
          
          // Use the AI-generated conversational response
          const responseText = queryResult.analysis || queryResult.summary;
          
          const response = {
            type: 'function-call-result',
            functionCallId: message.functionCall.id,
            result: responseText
          };
          
          console.log('Sending intelligent response to Vapi:', response);
          this.vapi.send(response);
          
          // Trigger callback for UI update with results
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query',
              query: userQuery,
              result: queryResult, // Pass the full structured result
              analysis: responseText,
              confidence: queryResult.confidence,
              reasoning: queryResult.reasoning
            });
          }
          
          return; // Exit early if we handled a function call
        } catch (error) {
          console.error('Error processing intelligent voice query:', error);
          
          const errorResponse = {
            type: 'function-call-result',
            functionCallId: message.functionCall.id,
            result: 'Sorry, I encountered an error processing your query. Please try again.'
          };
          
          this.vapi.send(errorResponse);
          
          // Clear loading state on error
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query',
              query: message.functionCall.parameters.query,
              result: null,
              analysis: 'Error processing query'
            });
          }
          
          return;
        }
      }
      
      // Handle other message types if needed
      if (message.type === 'transcript' && message.role === 'user' && message.transcriptType === 'final') {
        console.log('User said:', message.transcript);
        // Manually trigger intelligent query if function calling isn't working
        try {
          // Trigger loading state
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query-start',
              query: message.transcript
            });
          }
          
          const queryResult = await intelligentQueryService.processIntelligentQuery(message.transcript);
          console.log('Manual intelligent query result:', queryResult);
          
          // Trigger callback for UI update
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query',
              query: message.transcript,
              result: queryResult,
              analysis: queryResult.analysis || queryResult.summary,
              confidence: queryResult.confidence,
              reasoning: queryResult.reasoning
            });
          }
        } catch (error) {
          console.error('Error in manual intelligent query processing:', error);
          
          // Clear loading state on error
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: 'voice-query',
              query: message.transcript,
              result: null,
              analysis: 'Error processing query'
            });
          }
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
      firstMessage: "Hi! I'm your inventory assistant. What would you like to know?",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo", 
        temperature: 0.8,
        maxTokens: 150,
        messages: [{
          role: "system",
          content: `You are a friendly, efficient inventory management assistant with access to a comprehensive database of 380+ inventory items.

KEY BEHAVIORS:
- Keep responses concise and conversational
- Always use the queryDatabase function for inventory questions
- Be proactive in suggesting related insights
- Use natural language, avoid technical jargon
- Allow interruptions gracefully

AVAILABLE DATA:
- Complete inventory with items, brands, categories
- Stock levels, thresholds, and reorder points
- Sales data, velocities, and performance metrics  
- Financial data: costs, prices, margins, values
- Supplier information and ratings
- Storage locations and product details

RESPONSE STYLE:
- Brief but informative
- Natural conversation flow
- Actionable insights
- Professional yet friendly tone

When users ask anything inventory-related, immediately use queryDatabase function.`
        }]
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        stability: 0.7,
        similarityBoost: 0.8,
        style: 0.2
      },
      // Make assistant more interruptible
      backgroundSound: "none",
      backchannelingEnabled: false,
      endCallOnSilence: false,
      responseDelaySeconds: 0.3,
      llmRequestDelaySeconds: 0.1,
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