import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { user_id, project_name } = await req.json()

    if (!user_id || !project_name) {
      return NextResponse.json({ ok: false, message: 'Missing fields' }, { status: 400 })
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, project_name }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('❌ Internal server error in create route:', err)
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 })
  }
}