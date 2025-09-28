import Vapi from '@vapi-ai/web';
import { directDatabaseService } from './directDatabaseService.js';

class SupplierNegotiationService {
  constructor() {
    this.vapi = null;
    this.isCallActive = false;
    this.sellerNumber = '+19255480122'; // Your number for all call routing
    
    // Twilio configuration
    this.twilioConfig = {
      accountSid: import.meta.env.REACT_APP_TWILIO_ACCOUNT_SID,
      authToken: import.meta.env.REACT_APP_TWILIO_AUTH_TOKEN,
      twilioNumber: import.meta.env.REACT_APP_TWILIO_PHONE_NUMBER
    };
    
    console.log('📞 Supplier Negotiation Service initialized:', {
      sellerNumber: this.sellerNumber,
      twilioNumber: this.twilioConfig.twilioNumber
    });
  }

  // Initialize Vapi for supplier negotiation
  initialize(publicKey) {
    console.log('🔑 Initializing Supplier Negotiation Vapi with public key:', publicKey ? `Present (${publicKey.substring(0, 8)}...)` : 'Missing');
    
    if (!publicKey) {
      throw new Error('Vapi public API key is required for supplier negotiation');
    }
    
    this.vapi = new Vapi(publicKey);
    
    // Set up event listeners
    this.vapi.on('call-start', () => {
      console.log('📞 Supplier negotiation call started');
      this.isCallActive = true;
    });

    this.vapi.on('call-end', () => {
      console.log('📞 Supplier negotiation call ended');
      this.isCallActive = false;
    });

    // Handle supplier negotiation messages
    this.vapi.on('message', async (message) => {
      console.log('📞 Supplier negotiation message:', JSON.stringify(message, null, 2));
      
      if (message.type === 'function-call') {
        if (message.functionCall?.name === 'querySupplierInfo') {
          await this.handleSupplierInfoQuery(message.functionCall);
        } else if (message.functionCall?.name === 'forwardToYou') {
          await this.handleForwardToYou(message.functionCall);
        } else if (message.functionCall?.name === 'negotiateRestock') {
          await this.handleRestockNegotiation(message.functionCall);
        }
      }
    });

    this.vapi.on('error', (error) => {
      console.error('📞 Supplier negotiation Vapi error:', error);
    });
  }

  // Query supplier information from database
  async getSupplierInfo(itemName) {
    try {
      console.log('🔍 Querying supplier info for item:', itemName);
      
      // Query database for supplier details
      const { databaseService } = await import('./databaseService.js');
      const { geminiService } = await import('./geminiService.js');
      
      const sqlQuery = `
        SELECT supplier_name, supplier_contact, supplier_rating, unit_cost, selling_price, quantity, threshold
        FROM Inventory 
        WHERE item_name ILIKE '%${itemName}%' 
        LIMIT 1
      `;
      
      console.log('📝 Generated supplier query SQL:', sqlQuery);
      
      databaseService.validateQuery(sqlQuery);
      const results = await databaseService.executeQuery(sqlQuery);
      
      console.log('📊 Supplier query results:', results);
      
      if (results && results.length > 0) {
        const supplierData = results[0];
        
        return {
          success: true,
          supplier: {
            name: supplierData.supplier_name,
            phone: supplierData.supplier_contact,
            rating: supplierData.supplier_rating,
            currentStock: supplierData.quantity,
            reorderThreshold: supplierData.threshold,
            unitCost: supplierData.unit_cost,
            sellingPrice: supplierData.selling_price,
            item: itemName
          }
        };
      } else {
        return {
          success: false,
          error: `No supplier found for item: ${itemName}`
        };
      }
      
    } catch (error) {
      console.error('❌ Error querying supplier info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle supplier information query function call
  async handleSupplierInfoQuery(functionCall) {
    console.log('📋 Handling supplier info query:', functionCall.parameters);
    
    const { itemName } = functionCall.parameters;
    const supplierInfo = await this.getSupplierInfo(itemName);
    
    let responseText;
    if (supplierInfo.success) {
      const supplier = supplierInfo.supplier;
      responseText = `I found the supplier information for ${itemName}. The supplier is ${supplier.name} with contact ${supplier.phone}. You currently have ${supplier.currentStock} units and reorder threshold is ${supplier.reorderThreshold}. Unit cost is $${supplier.unitCost}. I'll now negotiate with them for restocking.`;
    } else {
      responseText = `I couldn't find supplier information for ${itemName}. Let me connect you directly to handle this manually.`;
    }
    
    const response = {
      type: 'function-call-result',
      functionCallId: functionCall.id,
      result: responseText
    };
    
    console.log('📋 Sending supplier info response:', response);
    this.vapi.send(response);
  }

  // Handle restock negotiation function call
  async handleRestockNegotiation(functionCall) {
    console.log('💰 Handling restock negotiation:', functionCall.parameters);
    
    const { itemName, currentQuantity, reorderQuantity, currentPrice, targetPrice } = functionCall.parameters;
    
    const savings = (parseFloat(currentPrice) - parseFloat(targetPrice)) * parseInt(reorderQuantity);
    const discountPercent = ((parseFloat(currentPrice) - parseFloat(targetPrice)) / parseFloat(currentPrice) * 100).toFixed(1);
    
    let negotiationResponse;
    
    if (parseFloat(targetPrice) < parseFloat(currentPrice) * 0.8) {
      // Great deal - over 20% discount
      negotiationResponse = `Excellent! Getting ${reorderQuantity} units of ${itemName} for $${targetPrice} per unit is a fantastic deal. That's a ${discountPercent}% discount, saving you $${savings.toFixed(2)} total. Let me connect you directly to the supplier to finalize this order.`;
    } else if (parseFloat(targetPrice) < parseFloat(currentPrice) * 0.9) {
      // Good deal - 10-20% discount  
      negotiationResponse = `Good negotiation! $${targetPrice} per unit for ${reorderQuantity} units of ${itemName} represents ${discountPercent}% savings. You'll save $${savings.toFixed(2)} on this restock order. I'll connect you to complete the purchase.`;
    } else {
      // Small discount or same price
      negotiationResponse = `The price of $${targetPrice} per unit is close to your current cost of $${currentPrice}. For bulk orders like ${reorderQuantity} units, we might be able to negotiate better pricing. Let me connect you directly to the supplier.`;
    }
    
    const response = {
      type: 'function-call-result',
      functionCallId: functionCall.id,
      result: negotiationResponse
    };
    
    console.log('💰 Sending negotiation response:', response);
    this.vapi.send(response);
  }

  // Handle forwarding call to you (the seller)
  async handleForwardToYou(functionCall) {
    console.log('📞 Handling forward to seller:', functionCall.parameters);
    
    const { supplierName, itemName, quantity, agreedPrice } = functionCall.parameters;
    
    // Log the call forwarding details
    console.log('📞 Call forwarding details:', {
      supplier: supplierName,
      item: itemName,
      quantity: quantity,
      agreedPrice: agreedPrice,
      forwardingTo: this.sellerNumber,
      timestamp: new Date().toISOString()
    });
    
    const response = {
      type: 'function-call-result',
      functionCallId: functionCall.id,
      result: `Perfect! I'm now connecting you directly to complete the restock order for ${quantity} units of ${itemName} with ${supplierName} at $${agreedPrice} per unit. Please hold while I transfer the call.`
    };
    
    console.log('📞 Sending forward response:', response);
    this.vapi.send(response);
  }

  // Start supplier negotiation call for approved transaction
  async startSupplierNegotiation(transactionData) {
    if (!this.vapi) {
      await this.initialize(import.meta.env.VITE_VAPI_PUBLIC_KEY);
    }

    console.log('📞 Starting supplier negotiation for transaction:', transactionData);

    // Get supplier information first
    const supplierInfo = await this.getSupplierInfo(transactionData.itemName);
    
    if (!supplierInfo.success) {
      throw new Error(`Unable to find supplier for ${transactionData.itemName}`);
    }

    const supplier = supplierInfo.supplier;
    const reorderQuantity = Math.max(supplier.reorderThreshold - supplier.currentStock, 50); // Minimum 50 units

    // Create supplier negotiation assistant
    const supplierAssistant = {
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        temperature: 0.8,
        messages: [{
          role: "system",
          content: `You are a procurement specialist helping to restock inventory by negotiating with suppliers. 

CURRENT SITUATION:
- Item: ${supplier.item}
- Supplier: ${supplier.name} (Contact: ${supplier.phone})
- Current Stock: ${supplier.currentStock} units
- Reorder Threshold: ${supplier.reorderThreshold} units  
- Current Unit Cost: $${supplier.unitCost}
- Selling Price: $${supplier.sellingPrice}
- Supplier Rating: ${supplier.rating}/5

RESTOCK NEEDED: ${reorderQuantity} units

NEGOTIATION GOALS:
1. Secure immediate restock of ${reorderQuantity} units
2. Negotiate 10-20% discount from current $${supplier.unitCost} unit cost
3. Establish better pricing for future bulk orders
4. Ensure quick delivery (2-3 business days)

FUNCTIONS TO USE:
- querySupplierInfo: Get supplier details from database
- negotiateRestock: When discussing pricing and quantities  
- forwardToYou: When ready to finalize the deal (connect to ${this.sellerNumber})

Be professional but assertive. Emphasize volume purchases and long-term partnership.`
        }]
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM"
      },
      firstMessage: `Hi! I'm calling regarding restocking ${supplier.item}. I see you're our supplier ${supplier.name}. We need to replenish our inventory - currently at ${supplier.currentStock} units, below our ${supplier.reorderThreshold} unit threshold. Let's discuss pricing for ${reorderQuantity} units.`,
      
      functions: [
        {
          name: "querySupplierInfo",
          description: "Query database for supplier information and current stock levels",
          parameters: {
            type: "object",
            properties: {
              itemName: { type: "string", description: "Name of the item to query supplier info for" }
            },
            required: ["itemName"]
          }
        },
        {
          name: "negotiateRestock",
          description: "Negotiate pricing and quantities for restocking inventory",
          parameters: {
            type: "object", 
            properties: {
              itemName: { type: "string", description: "Item being restocked" },
              currentQuantity: { type: "string", description: "Current inventory level" },
              reorderQuantity: { type: "string", description: "Quantity needed for restock" },
              currentPrice: { type: "string", description: "Current unit price" },
              targetPrice: { type: "string", description: "Negotiated target price per unit" }
            },
            required: ["itemName", "currentQuantity", "reorderQuantity", "currentPrice", "targetPrice"]
          }
        },
        {
          name: "forwardToYou",
          description: "Forward the call to the business owner to finalize the supplier deal",
          parameters: {
            type: "object",
            properties: {
              supplierName: { type: "string", description: "Name of the supplier" },
              itemName: { type: "string", description: "Item being ordered" },
              quantity: { type: "string", description: "Quantity agreed upon" },
              agreedPrice: { type: "string", description: "Final agreed price per unit" }
            },
            required: ["supplierName", "itemName", "quantity", "agreedPrice"]
          }
        }
      ]
    };

    try {
      console.log('📞 Starting outbound phone call for supplier negotiation');
      
      // First, get available phone numbers from Vapi
      const privateKey = import.meta.env.VITE_VAPI_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('VITE_VAPI_PRIVATE_KEY is required for outbound calls. Please add it to your .env file.');
      }
      
      console.log('📞 Fetching available phone numbers from Vapi...');
      const phoneNumbersResponse = await fetch('https://api.vapi.ai/phone-number', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${privateKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!phoneNumbersResponse.ok) {
        throw new Error(`Failed to fetch phone numbers: ${phoneNumbersResponse.status}`);
      }
      
      const phoneNumbers = await phoneNumbersResponse.json();
      console.log('📞 Available phone numbers:', phoneNumbers);
      
      if (!phoneNumbers || phoneNumbers.length === 0) {
        throw new Error('No phone numbers available in Vapi. Please add a phone number to your Vapi account first.');
      }
      
      // Use the first available phone number
      const phoneNumberId = phoneNumbers[0].id;
      console.log('📞 Using phone number ID:', phoneNumberId);
      
      // Create outbound phone call to your number (9255480122)
      const callConfig = {
        assistant: supplierAssistant,
        phoneNumberId: phoneNumberId, // UUID from Vapi
        customer: {
          number: this.sellerNumber // Call your number directly
        }
      };
      
      console.log('📞 Creating outbound call with config:', callConfig);
      
      // Create the outbound call using Vapi's API
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${privateKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callConfig)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Provide helpful error message for Twilio authentication issues
        if (errorText.includes('Twilio Error: Authenticate')) {
          throw new Error(`Twilio authentication failed. Please check your Twilio credentials in Vapi dashboard:
          
1. Go to https://dashboard.vapi.ai/accounts
2. Add your Twilio Account SID: ${this.twilioConfig.accountSid}
3. Add your Twilio Auth Token: ${this.twilioConfig.authToken}
4. Make sure the phone number is properly configured

Current error: ${errorText}`);
        }
        
        throw new Error(`Vapi call creation failed: ${response.status} - ${errorText}`);
      }
      
      const callResult = await response.json();
      console.log('📞 Outbound call created successfully:', callResult);
      
      return {
        success: true,
        message: `Supplier negotiation call started - calling your number ${this.sellerNumber}`,
        supplier: supplier,
        reorderQuantity: reorderQuantity,
        callId: callResult.id
      };
      
    } catch (error) {
      console.error('❌ Error starting supplier negotiation call:', error);
      throw error;
    }
  }

  // End supplier negotiation call
  async endSupplierNegotiation() {
    if (this.vapi && this.isCallActive) {
      await this.vapi.stop();
    }
  }

  // Check if supplier negotiation call is active
  isNegotiationActive() {
    return this.isCallActive;
  }
}

export const supplierNegotiationService = new SupplierNegotiationService();
export default supplierNegotiationService;