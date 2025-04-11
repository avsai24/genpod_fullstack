// app/api/files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function readFolder(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  return entries.map((entry) => {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      return {
        type: 'folder',
        name: entry.name,
        path: fullPath,
        children: readFolder(fullPath),
      }
    }

    return {
      type: 'file',
      name: entry.name,
      path: fullPath,
    }
  })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const folderPath = url.searchParams.get('path')

  if (!folderPath) {
    return NextResponse.json({ error: 'Missing path param' }, { status: 400 })
  }

  try {
    const tree = readFolder(folderPath)
    return NextResponse.json(tree)
  } catch (err) {
    console.error('File read error:', err)
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 })
  }
}