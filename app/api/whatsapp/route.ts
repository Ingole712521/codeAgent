import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// TypeScript types for WhatsApp messages
interface TwilioWhatsAppMessage {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  ProfileName?: string;
  WaId?: string;
}

// Initialize Twilio client with environment variables
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming webhook data from Twilio
    const formData = await request.formData();
    const messageData: TwilioWhatsAppMessage = {
      MessageSid: formData.get('MessageSid') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string,
      NumMedia: formData.get('NumMedia') as string,
      ProfileName: formData.get('ProfileName') as string,
      WaId: formData.get('WaId') as string,
    };

    // Log the incoming message
    console.log('📱 WhatsApp Message Received:');
    console.log(`From: ${messageData.From}`);
    console.log(`To: ${messageData.To}`);
    console.log(`Message: ${messageData.Body}`);
    console.log(`Message SID: ${messageData.MessageSid}`);
    console.log(`Profile Name: ${messageData.ProfileName || 'N/A'}`);
    console.log(`WhatsApp ID: ${messageData.WaId || 'N/A'}`);

    // Validate required environment variables
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH || !process.env.TWILIO_WHATSAPP_FROM) {
      console.error('❌ Missing required Twilio environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create the reply message
    const replyMessage = `👋 Hello! You said: "${messageData.Body}"`;

    // Send reply back to the user
    const message = await client.messages.create({
      body: replyMessage,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: messageData.From,
    });

    console.log(`✅ Reply sent successfully. Message SID: ${message.sid}`);

    // Return TwiML response (required by Twilio)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyMessage}</Message>
</Response>`,
      {
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error processing WhatsApp message:', error);
    
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'WhatsApp webhook endpoint is active' },
    { status: 200 }
  );
}
