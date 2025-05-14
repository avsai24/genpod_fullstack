import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Missing user ID' }, { status: 400 })
  }

  try {
    const res = await fetch(`${url}/api/projects/list?user_id=${userId}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Error fetching projects:', err)
    return NextResponse.json({ ok: false, message: 'Failed to fetch projects' }, { status: 500 })
  }
}