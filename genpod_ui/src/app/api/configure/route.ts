// src/app/api/configure/route.ts
import { NextResponse } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const PROTO_PATH = path.resolve(process.cwd(), 'protos/agent.proto')

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const grpcObj = grpc.loadPackageDefinition(packageDef) as any
const AgentService = grpcObj.agent.AgentService

const client = new AgentService(
  'localhost:50052',
  grpc.credentials.createInsecure()
)

export async function GET() {
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      const call = client.StreamData({ user_id: 'user1', tab: 'configure' })

      call.on('data', (chunk: any) => {
        if (isClosed) return

        try {
          const payload = JSON.stringify({
            configure: JSON.parse(chunk.json_payload),
          })

          controller.enqueue(`data: ${payload}\n\n`)
        } catch (e) {
          console.error('❌ Failed to parse configure payload:', e)
        }
      })

      call.on('end', () => {
        if (!isClosed) {
          isClosed = true
          controller.close()
        }
      })

      call.on('error', (err: any) => {
        console.error('Configure stream error:', err)
        if (!isClosed) {
          isClosed = true
          controller.close()
        }
      })
    },
    cancel() {
      isClosed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}