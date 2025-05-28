// /src/app/api/codeview/codeview-query/route.ts

import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt } = body

    if (!prompt) {
      return Response.json({ error: 'Missing prompt in request body' }, { status: 400 })
    }

    // 🔁 Send prompt to Python backend
    const response = await fetch('http://localhost:8000/api/codeview-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return Response.json({ error: `Backend error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("🧩 Graph data from backend:", data);
    
    return Response.json(data)
  } catch (err: any) {
    console.error('Error in /api/codeview-query:', err)
    return Response.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}