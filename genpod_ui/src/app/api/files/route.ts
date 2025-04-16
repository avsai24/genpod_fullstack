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
const grpcClient = new grpcPackage.agent.AgentService(
  'localhost:50052',
  grpc.credentials.createInsecure()
)

export async function GET(req: NextRequest) {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  let closed = false
  const safeClose = async () => {
    if (!closed) {
      closed = true
      try {
        await writer.close()
      } catch (err) {
        console.warn('[SSE] Writer already closed.')
      }
    }
  }

  try {
    const call = grpcClient.StreamData(
      { user_id: 'genpod', tab: 'code' },
      (err: any) => {
        if (err) {
          console.error('gRPC error:', err)
        }
      }
    )

    call.on('data', (message: any) => {
      const eventType = message.type
      const payload = message.json_payload

      try {
        const event = `event: ${eventType}\ndata: ${JSON.stringify(JSON.parse(payload))}\n\n`
        writer.write(encoder.encode(event))
      } catch (err) {
        console.error('[SSE] Failed to stringify payload:', err)
      }
    })

    call.on('end', () => {
      safeClose()
    })

    call.on('error', async (err: any) => {
      console.error('❌ gRPC error:', err)
      writer.write(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`))
      await safeClose()
    })
  } catch (err: any) {
    console.error('Server route error:', err)
    writer.write(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`))
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