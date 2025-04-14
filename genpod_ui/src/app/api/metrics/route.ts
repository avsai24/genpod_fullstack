// src/app/api/metrics/route.ts
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
  let isControllerOpen = true

  const stream = new ReadableStream({
    start(controller) {
      const call = client.StreamData({ user_id: '123', tab: 'metrics' })

      call.on('data', (chunk: any) => {
        if (!isControllerOpen) return

        try {
          const parsed = JSON.parse(chunk.json_payload)
          const payload = JSON.stringify({ metrics: parsed })
          controller.enqueue(`data: ${payload}\n\n`)
        } catch (e) {
          console.error('❌ Failed to parse payload:', e)
        }
      })

      call.on('end', () => {
        if (isControllerOpen) {
          isControllerOpen = false
          controller.close()
        }
      })

      call.on('error', (err: any) => {
        console.error('❌ gRPC stream error:', err)
        if (isControllerOpen) {
          isControllerOpen = false
          controller.close()
        }
      })
    },
    cancel() {
      isControllerOpen = false
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