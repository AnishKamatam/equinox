import Vapi from '@vapi-ai/web';

class NegotiationVapiService {
  constructor() {
    this.vapi = null;
    this.isCallActive = false;
    this.onCallCompleteCallback = null;
    
    // Twilio configuration
    this.twilioConfig = {
      accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
      authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN,
      twilioNumber: process.env.REACT_APP_TWILIO_PHONE_NUMBER,
      sellerNumber: null // Will be set when forwarding
    };
    
    console.log('🤝 Negotiation Vapi Service initialized with Twilio integration');
  }

  // Initialize Vapi for negotiation agent
  initialize(apiKey) {
    console.log('🔑 Initializing Negotiation Vapi with API key:', apiKey ? `Present (${apiKey.substring(0, 8)}...)` : 'Missing');
    
    if (!apiKey) {
      throw new Error('Vapi API key is required for negotiation agent');
    }
    
    this.vapi = new Vapi(apiKey);
    
    // Set up event listeners for negotiation flow
    this.vapi.on('call-start', () => {
      console.log('🤝 Negotiation call started');
      this.isCallActive = true;
    });

    this.vapi.on('call-end', () => {
      console.log('🤝 Negotiation call ended');
      this.isCallActive = false;
      if (this.onCallCompleteCallback) {
        this.onCallCompleteCallback();
      }
    });

    // Handle negotiation messages and call forwarding
    this.vapi.on('message', async (message) => {
      console.log('🤝 Negotiation message:', JSON.stringify(message, null, 2));
      
      // Handle function calls for deal negotiation
      if (message.type === 'function-call') {
        if (message.functionCall?.name === 'forwardToSeller') {
          await this.handleForwardToSeller(message.functionCall);
        } else if (message.functionCall?.name === 'negotiatePrice') {
          await this.handlePriceNegotiation(message.functionCall);
        }
      }
    });

    this.vapi.on('error', (error) => {
      console.error('🤝 Negotiation Vapi error:', error);
    });
  }

  // Handle forwarding call to seller
  async handleForwardToSeller(functionCall) {
    console.log('📞 Handling forward to seller:', functionCall.parameters);
    
    const { productName, quantity, currentPrice, negotiatedPrice } = functionCall.parameters;
    
    try {
      // Simulate Twilio call forwarding
      const forwardResult = await this.forwardCallToSeller({
        productName,
        quantity,
        currentPrice,
        negotiatedPrice
      });
      
      const response = {
        type: 'function-call-result',
        functionCallId: functionCall.id,
        result: `I'm now connecting you directly to the seller to finalize the deal for ${quantity} units of ${productName} at the negotiated price of $${negotiatedPrice} per unit. Please hold while I transfer the call.`
      };
      
      console.log('📞 Sending forward response:', response);
      this.vapi.send(response);
      
    } catch (error) {
      console.error('❌ Error forwarding to seller:', error);
      
      const errorResponse = {
        type: 'function-call-result', 
        functionCallId: functionCall.id,
        result: 'I apologize, but I\'m unable to connect you to the seller right now. Let me try alternative contact methods.'
      };
      
      this.vapi.send(errorResponse);
    }
  }

  // Handle price negotiation logic
  async handlePriceNegotiation(functionCall) {
    console.log('💰 Handling price negotiation:', functionCall.parameters);
    
    const { productName, originalPrice, proposedPrice, quantity } = functionCall.parameters;
    
    // Negotiation logic - aim to get best price for buyer
    const originalPriceNum = parseFloat(originalPrice);
    const proposedPriceNum = parseFloat(proposedPrice);
    const savings = (originalPriceNum - proposedPriceNum) * quantity;
    
    let negotiationResponse;
    
    if (proposedPriceNum < originalPriceNum * 0.7) {
      // Very aggressive discount
      negotiationResponse = `That's an excellent offer! $${proposedPrice} per unit represents a ${Math.round((1 - proposedPriceNum/originalPriceNum) * 100)}% discount. For ${quantity} units, you'd save $${savings.toFixed(2)} total. Let me connect you directly to the seller to finalize this deal.`;
    } else if (proposedPriceNum < originalPriceNum * 0.9) {
      // Moderate discount
      negotiationResponse = `That's a good price reduction to $${proposedPrice} per unit. You'd save $${savings.toFixed(2)} on your order of ${quantity} units. I think we can work with this. Let me connect you to the seller.`;
    } else {
      // Small or no discount
      negotiationResponse = `I notice the price is still close to the original $${originalPrice}. For bulk orders of ${quantity} units, sellers typically offer better volume discounts. Let me connect you directly to negotiate further.`;
    }
    
    const response = {
      type: 'function-call-result',
      functionCallId: functionCall.id,
      result: negotiationResponse
    };
    
    console.log('💰 Sending negotiation response:', response);
    this.vapi.send(response);
  }

  // Forward call to seller using Twilio
  async forwardCallToSeller(dealDetails) {
    console.log('📞 Forwarding call to seller with deal details:', dealDetails);
    
    // In a real implementation, this would:
    // 1. End the current Vapi call
    // 2. Initiate a 3-way Twilio conference call
    // 3. Connect buyer, negotiation summary, and seller
    
    const forwardingData = {
      dealSummary: `Buyer interested in ${dealDetails.quantity} units of ${dealDetails.productName}`,
      originalPrice: dealDetails.currentPrice,
      negotiatedPrice: dealDetails.negotiatedPrice,
      totalValue: dealDetails.quantity * parseFloat(dealDetails.negotiatedPrice),
      timestamp: new Date().toISOString()
    };
    
    console.log('📞 Twilio forwarding data:', forwardingData);
    
    // Simulate successful forwarding
    return {
      success: true,
      forwardingId: `FWD${Date.now()}`,
      dealDetails: forwardingData
    };
  }

  // Start negotiation call for specific product
  async startNegotiationCall(productInfo, sellerPhoneNumber) {
    if (!this.vapi) {
      throw new Error('Negotiation Vapi not initialized. Call initialize() first.');
    }

    // Store seller number for forwarding
    this.twilioConfig.sellerNumber = sellerPhoneNumber;
    
    console.log('🤝 Starting negotiation call for product:', {
      product: productInfo,
      sellerPhone: sellerPhoneNumber
    });

    // Enhanced negotiation assistant configuration
    const negotiationAssistant = {
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        temperature: 0.8,
        messages: [{
          role: "system",
          content: `You are an expert negotiation agent helping buyers get the best deals on inventory products. Your goal is to negotiate the lowest possible price per unit and then forward the call to the seller.

PRODUCT DETAILS:
- Product: ${productInfo.name}
- Available Quantity: ${productInfo.quantity} units  
- Current Price: $${productInfo.price} per unit
- Total Value: $${(productInfo.quantity * productInfo.price).toFixed(2)}

NEGOTIATION STRATEGY:
1. Start with bulk purchase benefits - emphasize clearing their entire inventory
2. Propose 20-30% discount for bulk purchase
3. Highlight immediate payment and quick transaction
4. Use scarcity - mention other similar products available
5. When you reach a good price, immediately forward to seller

FUNCTIONS TO USE:
- negotiatePrice: When discussing price reductions
- forwardToSeller: When ready to connect buyer to seller (use after getting 15%+ discount)

Be friendly but persistent. Your success is measured by savings achieved for the buyer.`
        }]
      },
      voice: {
        provider: "11labs", 
        voiceId: "21m00Tcm4TlvDq8ikWAM"
      },
      firstMessage: `Hi! I'm your negotiation specialist. I see you're interested in ${productInfo.name}. The seller has ${productInfo.quantity} units at $${productInfo.price} each. Let's get you a much better deal on this bulk purchase!`,
      
      functions: [
        {
          name: "negotiatePrice",
          description: "Analyze and respond to price negotiations for bulk inventory purchases",
          parameters: {
            type: "object",
            properties: {
              productName: { type: "string", description: "Name of the product being negotiated" },
              originalPrice: { type: "string", description: "Original price per unit" },
              proposedPrice: { type: "string", description: "Proposed new price per unit" },
              quantity: { type: "number", description: "Number of units in bulk order" }
            },
            required: ["productName", "originalPrice", "proposedPrice", "quantity"]
          }
        },
        {
          name: "forwardToSeller",
          description: "Forward the call to the seller when a good deal is negotiated", 
          parameters: {
            type: "object",
            properties: {
              productName: { type: "string", description: "Product name" },
              quantity: { type: "number", description: "Units being purchased" },
              currentPrice: { type: "string", description: "Original price per unit" },
              negotiatedPrice: { type: "string", description: "Final negotiated price per unit" }
            },
            required: ["productName", "quantity", "currentPrice", "negotiatedPrice"]
          }
        }
      ]
    };

    try {
      console.log('🤝 Starting negotiation with assistant config:', negotiationAssistant);
      await this.vapi.start(negotiationAssistant);
      
      return {
        success: true,
        message: `Negotiation agent started for ${productInfo.name}`,
        productInfo,
        sellerPhone: sellerPhoneNumber
      };
      
    } catch (error) {
      console.error('❌ Error starting negotiation call:', error);
      throw error;
    }
  }

  // End negotiation call
  async endNegotiationCall() {
    if (this.vapi && this.isCallActive) {
      await this.vapi.stop();
    }
  }

  // Set callback for when call completes
  onCallComplete(callback) {
    this.onCallCompleteCallback = callback;
  }

  // Check if negotiation call is active
  isNegotiationActive() {
    return this.isCallActive;
  }
}

export const negotiationVapiService = new NegotiationVapiService();
export default negotiationVapiService;