import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: Request) {
    try {
        const { phone, price, product, url } = await req.json()

        // Validate request
        if (!phone || !price || !product) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        // Initialize Twilio client using environment variables
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN
        const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

        if (!accountSid || !authToken) {
            console.warn("Twilio credentials not configured. Skipping actual sending.")
            return NextResponse.json({ success: true, message: 'Mock sent successfully' })
        }

        const client = twilio(accountSid, authToken)

        const message = await client.messages.create({
            body: `🚨 Price Drop Alert!\n\nThe ${product} is now available at AED ${price}!\n\nGrab it here: ${url}`,
            from: twilioWhatsAppNumber, // Your Twilio sandbox or registered WhatsApp number
            to: `whatsapp:${phone}`      // The user's phone number prefixed with 'whatsapp:'
        })

        return NextResponse.json({ success: true, messageId: message.sid })
    } catch (error: any) {
        console.error('WhatsApp API Error:', error)
        return NextResponse.json({ error: 'Failed to send WhatsApp message', details: error.message }, { status: 500 })
    }
}
