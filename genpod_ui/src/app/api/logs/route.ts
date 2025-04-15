// src/app/api/logs/route.ts
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

// Load proto definition
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
  console.log('📡 [SSE] /api/logs connected')

  let controllerRef: ReadableStreamDefaultController | null = null
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      console.log('🔌 [SSE] Connecting to gRPC StreamData...')

      // gRPC streaming call for logs
      const call = client.StreamData({ user_id: 'admin@genpod.ai', tab: 'logs' })

      call.on('data', (chunk: any) => {
        if (isClosed || !controllerRef) return

        try {
          // console.log('[gRPC] Received chunk:', chunk)
          const parsed = JSON.parse(chunk.json_payload)
          const payload = JSON.stringify({ logs: parsed })
          controllerRef.enqueue(`data: ${payload}\n\n`)
        } catch (err) {
          console.error('[SSE] Failed to parse gRPC log payload:', err)
        }
      })

      call.on('end', () => {
        console.log('[SSE] gRPC stream ended')
        isClosed = true
        controllerRef?.close()
      })

      call.on('error', (err: any) => {
        console.error('❌ [SSE] gRPC stream error:', err)
        isClosed = true
        controllerRef?.close()
      })
    },

    cancel() {
      console.log('⚠️ [SSE] Stream cancelled by client')
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