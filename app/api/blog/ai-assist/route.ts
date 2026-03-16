import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/utils/supabase/server'

// Initialize Anthropic client (requires ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const SYSTEM_PROMPT = `You are a senior content strategist for UAEDiscountHub, a leading coupon and deals platform in the United Arab Emirates. 
Your goal is to help write engaging, SEO-optimized, and helpful blog posts for UAE shoppers.
Tone: Expert, helpful, trustworthy, and locally relevant. 
Audience: Residents and tourists in the UAE looking for the best deals, shopping tips, and retail news.
Context: Retailers often mentioned include Amazon.ae, Noon.com, Carrefour, Jarir Bookstore, Sharaf DG, etc.
Currencies: Always use AED (Arab Emirates Dirham) for prices.
Language: English (primary) or Arabic if specifically requested.

Output format: ALWAYS return HTML strings that are compatible with a Tiptap editor. Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, and <blockquote> as needed. 
Do NOT include <html>, <body>, or markdown code blocks (unless the action specifically asks for code). Just the inner content.`

const PROMPTS: Record<string, (text: string, title: string, keywords: string[]) => string> = {
  improve: (text) => `Improve this paragraph for better engagement and SEO while maintaining the original meaning. Original text: "${text}"`,
  introduction: (_, title, keywords) => `Write a compelling 2-paragraph introduction for a blog post titled "${title}". Focus on these keywords: ${keywords.join(', ')}.`,
  faq: (_, title) => `Generate 5 frequently asked questions and answers for a post titled "${title}". Return as <h3> questions and <p> answers.`,
  expand: (text) => `Expand on this point with more detail, specific UAE-relevant examples, and practical tips: "${text}"`,
  grammar: (text) => `Fix spelling, grammar, and punctuation in this text without changing the tone or core message: "${text}"`,
  keywords: (_, title) => `Suggest 8 long-tail SEO keywords targeting UAE shoppers for a blog post titled "${title}". Return as a comma-separated list.`,
}

/**
 * POST /api/blog/ai-assist
 * Handles AI-powered content generation and refinement via Anthropic.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth (only admins should use AI assist)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      // In development, you might want to bypass this
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key is not configured' }, { status: 500 })
    }

    const { action, text, title, keywords = [] } = await req.json()
    const promptFn = PROMPTS[action]

    if (!promptFn) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const userPrompt = promptFn(text || '', title || '', keywords)

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    })

    // Safely extract the text response
    let result = ''
    if (response.content[0].type === 'text') {
      result = response.content[0].text
    }

    return NextResponse.json({ result })

  } catch (error: any) {
    console.error('AI Assist error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
