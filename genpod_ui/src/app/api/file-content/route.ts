import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filePath = searchParams.get('file')
  const rootPath = '/Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui'

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  if (!filePath) {
    writer.write(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Missing file param' })}\n\n`))
    writer.close()
    return new Response(readable, { status: 400 })
  }

  try {
    const absolutePath = path.join(rootPath, filePath)
    const content = fs.readFileSync(absolutePath, 'utf-8')

    writer.write(
      encoder.encode(`event: file_content\ndata: ${JSON.stringify({ path: filePath, content })}\n\n`)
    )
  } catch (err: any) {
    writer.write(
      encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
    )
  } finally {
    writer.close()
  }

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}