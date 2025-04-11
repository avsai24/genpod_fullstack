import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    summary: 'Your project is progressing well. Genpod generated 8 files and used 2,458 tokens so far.',
    healthScore: 92,
    timeSaved: '6h 20m',
    frameworksDetected: ['Next.js', 'Tailwind CSS', 'Monaco Editor'],
  })
}