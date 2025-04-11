import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Set your Gemini API key here
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
  }

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ reply: text })
  } catch (error: any) {
    console.error('Gemini error:', error.message)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}