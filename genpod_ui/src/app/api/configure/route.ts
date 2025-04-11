import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    project: 'genpod-ui',
    framework: 'Next.js 15',
    llm: 'Gemini 1.5 Flash',
    vectorDB: 'Chroma',
    environment: 'Node 20.x',
    generatedAt: new Date().toLocaleString(),
  })
}