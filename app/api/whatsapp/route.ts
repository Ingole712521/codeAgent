import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

interface TwilioWhatsAppMessage {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  ProfileName?: string;
  WaId?: string;
}

interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

export async function POST(request: NextRequest) {
  try {
    console.log(' Starting WhatsApp webhook processing...');
    const formData = await request.formData();
    console.log('📋 Form data parsed successfully');
    const messageData: TwilioWhatsAppMessage = {
      MessageSid: formData.get('MessageSid') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string,
      NumMedia: formData.get('NumMedia') as string,
      ProfileName: formData.get('ProfileName') as string,
      WaId: formData.get('WaId') as string,
    };

    console.log('📱 WhatsApp Message Received:');
    console.log(`From: ${messageData.From}`);
    console.log(`To: ${messageData.To}`);
    console.log(`Message: ${messageData.Body}`);
    console.log(`Message SID: ${messageData.MessageSid}`);
    console.log(`Profile Name: ${messageData.ProfileName || 'N/A'}`);
    console.log(`WhatsApp ID: ${messageData.WaId || 'N/A'}`);
    console.log('🔍 Checking environment variables...');
    console.log('TWILIO_SID:', process.env.TWILIO_SID ? '✅ Set' : '❌ Missing');
    console.log('TWILIO_AUTH:', process.env.TWILIO_AUTH ? '✅ Set' : '❌ Missing');
    console.log('TWILIO_WHATSAPP_FROM:', process.env.TWILIO_WHATSAPP_FROM ? '✅ Set' : '❌ Missing');
    console.log('OLLAMA_API_URL:', process.env.OLLAMA_API_URL ? '✅ Set' : '❌ Missing');
    
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH || !process.env.TWILIO_WHATSAPP_FROM || !process.env.OLLAMA_API_URL) {
      console.error(' Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    console.log(' Sending message to Ollama...');
    console.log(' Ollama URL:', `${process.env.OLLAMA_API_URL}/api/generate`);
    
    // Try different model names in case the exact name differs
    const possibleModels = ['llama3.2:3b', 'llama3.2', 'llama3.1', 'llama3', 'llama'];
    let aiResponse = 'No response from AI';
    
    for (const modelName of possibleModels) {
      try {
        console.log(` Trying model: ${modelName}`);
        
        const ollamaRequest: OllamaRequest = {
          model: modelName,
          prompt: messageData.Body,
          stream: false
        };

        console.log(' Ollama request:', JSON.stringify(ollamaRequest, null, 2));

        const ollamaResponse = await fetch(`${process.env.OLLAMA_API_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ollamaRequest),
        });

        console.log(' Ollama response status:', ollamaResponse.status);

        if (!ollamaResponse.ok) {
          const errorText = await ollamaResponse.text();
          console.error(` Model ${modelName} failed:`, ollamaResponse.status, errorText);
          continue; // Try next model
        }

        const ollamaData: OllamaResponse = await ollamaResponse.json();
        console.log(' Ollama response data:', JSON.stringify(ollamaData, null, 2));
        
        aiResponse = ollamaData.response || ' No response from AI';
        console.log(` Success with model: ${modelName}`);
        break; // Success, exit the loop
        
      } catch (modelError) {
        console.error(` Error with model ${modelName}:`, modelError);
        continue; // Try next model
      }
    }

    console.log('🤖 AI Response:', aiResponse);

    // Send AI response back to the user
    const message = await client.messages.create({
      body: aiResponse,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: messageData.From,
    });

    console.log(` AI Reply sent successfully. Message SID: ${message.sid}`);

    // Return TwiML response (required by Twilio)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${aiResponse}</Message>
</Response>`,
      {
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );

  } catch (error) {
    console.error(' Error processing WhatsApp message:', error);
    console.error(' Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
