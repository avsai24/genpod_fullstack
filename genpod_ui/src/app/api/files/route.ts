// src/app/api/files/route.ts

import { NextRequest } from 'next/server'
import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'

// Load proto
const PROTO_PATH = path.resolve(process.cwd(), 'protos/agent.proto')
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const grpcPackage = grpc.loadPackageDefinition(packageDef) as any
const AgentService = grpcPackage.agent.AgentService

const client = new AgentService('localhost:50052', grpc.credentials.createInsecure())

export async function GET(_req: NextRequest) {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  let closed = false
  const safeClose = async () => {
    if (!closed) {
      closed = true
      try {
        await writer.close()
      } catch {
        console.warn('[SSE] Writer already closed.')
      }
    }
  }

  try {
    const call = client.StreamData({ user_id: 'genpod', tab: 'code' })

    call.on('data', (message: any) => {
      const eventType = message.type
      const payload = message.json_payload

      try {
        const data = JSON.stringify(JSON.parse(payload)) // ensure valid JSON
        const sseEvent = `event: ${eventType}\ndata: ${data}\n\n`
        writer.write(encoder.encode(sseEvent))
      } catch (err) {
        console.error('[SSE] Failed to stringify payload:', err)
      }
    })

    call.on('end', () => {
      console.log('[gRPC] Stream ended')
      safeClose()
    })

    call.on('error', async (err: any) => {
      console.error('❌ gRPC error:', err)
      await writer.write(
        encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
      )
      await safeClose()
    })
  } catch (err: any) {
    console.error('❌ Server route error:', err)
    await writer.write(
      encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
    )
    await safeClose()
  }

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}