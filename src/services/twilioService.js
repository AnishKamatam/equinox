// Twilio Service for Call Forwarding and Deal Negotiation
class TwilioService {
  constructor() {
    this.accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID;
    this.authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN; 
    this.twilioNumber = process.env.REACT_APP_TWILIO_PHONE_NUMBER;
    this.sellerNumber = '+1'; // Your number - to be set
    
    console.log('📞 Twilio Service initialized:', {
      accountSid: this.accountSid,
      twilioNumber: this.twilioNumber
    });
  }

  // Set the seller's phone number
  setSellerNumber(phoneNumber) {
    this.sellerNumber = phoneNumber;
    console.log('📱 Seller number set:', phoneNumber);
  }

  // Generate TwiML for call forwarding with negotiation agent
  generateNegotiationTwiML(productInfo) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">
        Hi! I'm calling about the ${productInfo.name} you have listed. 
        I'd like to negotiate a bulk purchase deal. Let me connect you with our negotiation agent.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna">
        Our agent will discuss pricing for ${productInfo.quantity} units currently priced at $${productInfo.price} each.
        We're looking to negotiate volume discounts. Please hold while I transfer you.
    </Say>
    <Dial timeout="30" record="record-from-answer">
        <Number>${this.sellerNumber}</Number>
    </Dial>
    <Say voice="Polly.Joanna">
        I'm sorry, the seller is not available right now. Please try again later or leave a message.
    </Say>
    <Record maxLength="60" transcribe="true" transcribeCallback="/twilio/transcription"/>
</Response>`;
    
    return twiml;
  }

  // Initiate a negotiation call for a specific product
  async initiateNegotiationCall(productInfo, buyerNumber) {
    console.log('📞 Initiating negotiation call:', {
      product: productInfo.name,
      quantity: productInfo.quantity, 
      price: productInfo.price,
      buyer: buyerNumber,
      seller: this.sellerNumber
    });

    try {
      // In a real implementation, this would make an actual Twilio API call
      // For now, we'll simulate the call setup
      
      const callData = {
        to: this.sellerNumber,
        from: this.twilioNumber,
        url: `/twilio/negotiate/${productInfo.id}`,
        method: 'POST',
        statusCallback: '/twilio/status',
        record: true
      };

      console.log('🔄 Setting up Twilio call with data:', callData);
      
      // Simulate API response
      const callSid = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        callSid: callSid,
        status: 'initiated',
        product: productInfo,
        buyerNumber: buyerNumber,
        sellerNumber: this.sellerNumber,
        message: `Negotiation call initiated for ${productInfo.name}. Call SID: ${callSid}`
      };
      
    } catch (error) {
      console.error('❌ Error initiating negotiation call:', error);
      return {
        success: false,
        error: error.message,
        product: productInfo
      };
    }
  }

  // Handle incoming negotiation webhooks
  handleNegotiationWebhook(callSid, productId, status) {
    console.log('📞 Negotiation webhook received:', {
      callSid,
      productId, 
      status
    });

    // Log call progress
    switch (status) {
      case 'ringing':
        console.log('📱 Call is ringing...');
        break;
      case 'answered':
        console.log('✅ Call answered - negotiation starting');
        break;
      case 'completed':
        console.log('✅ Negotiation call completed');
        break;
      case 'failed':
        console.log('❌ Negotiation call failed');
        break;
      case 'busy':
        console.log('📞 Seller line busy');
        break;
      default:
        console.log(`📞 Call status: ${status}`);
    }

    return {
      status: 'webhook_processed',
      callSid,
      productId,
      timestamp: new Date().toISOString()
    };
  }

  // Get negotiation script for specific product
  getNegotiationScript(productInfo) {
    return {
      opening: `Hi! I'm interested in bulk purchasing your ${productInfo.name}. You have ${productInfo.quantity} units at $${productInfo.price} each.`,
      
      negotiationPoints: [
        `Can you offer a volume discount for purchasing all ${productInfo.quantity} units?`,
        `What's your best price per unit for a bulk order?`,
        `Are you flexible on the $${productInfo.price} per unit price?`,
        `Would you consider ${Math.round(productInfo.price * 0.8)} per unit for the entire inventory?`
      ],
      
      closing: `I'm ready to make a deal today if we can agree on pricing. What's your lowest price per unit?`,
      
      fallback: `Thank you for your time. I'll follow up via email with our offer.`
    };
  }

  // Generate webhook URL for TwiML
  generateWebhookUrl(productId) {
    return `/api/twilio/negotiate/${productId}`;
  }

  // Log negotiation attempt
  logNegotiation(productInfo, result) {
    console.log('📊 Negotiation Log:', {
      timestamp: new Date().toISOString(),
      product: {
        id: productInfo.id,
        name: productInfo.name,
        quantity: productInfo.quantity,
        originalPrice: productInfo.price
      },
      result: {
        success: result.success,
        callSid: result.callSid,
        status: result.status
      },
      twilioConfig: {
        accountSid: this.accountSid,
        twilioNumber: this.twilioNumber,
        sellerNumber: this.sellerNumber
      }
    });
  }
}

export const twilioService = new TwilioService();
export default twilioService;