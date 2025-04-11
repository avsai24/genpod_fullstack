// app/api/file/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path param' }, { status: 400 })
  }

  try {
    const content = await fs.readFile(path, 'utf-8')
    return NextResponse.json({ content })
  } catch (err) {
    console.error('File read error:', err)
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}