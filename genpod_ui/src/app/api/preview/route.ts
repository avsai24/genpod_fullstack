import { NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import path from 'path'
import { constants } from 'fs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectPath = searchParams.get('path')
  if (!projectPath) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  try {
    const filePath = path.join(projectPath, 'index.html')

  
    await access(filePath, constants.F_OK)

    const content = await readFile(filePath, 'utf-8')
    return NextResponse.json({ content })
  } catch (err: any) {
    console.warn('[Preview API] index.html not found or failed to read')
    return NextResponse.json({ error: 'index.html not available' }, { status: 200 }) // ✅ Not a 500 anymore
  }
}