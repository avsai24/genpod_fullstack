import { NextRequest } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

// Load proto definition
const PROTO_PATH = path.resolve(process.cwd(), 'protos/agent.proto')
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const agentProto = grpc.loadPackageDefinition(packageDefinition).agent as any

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const prompt = searchParams.get('prompt') || 'default prompt'
  const user_id = searchParams.get('user_id') || 'guest'

  const client = new agentProto.AgentService(
    'localhost:50052',
    grpc.credentials.createInsecure()
  )

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      console.log('🟢 [SSE] Started gRPC call to RunAgentWorkflow with prompt:', prompt)

      const call = client.RunAgentWorkflow({ prompt, user_id })

      // DATA event
      call.on('data', (message: any) => {
        if (closed) {
          console.warn('[SSE] Skipped enqueue after stream ended')
          return
        }

        let type = ''
        let payload = ''

        if (message.log) {
          type = 'log'
          payload = JSON.stringify(message.log)
        } else if (message.event) {
          type = 'event'
          payload = JSON.stringify(message.event)
        } else if (message.answer) {
          type = 'answer'
          payload = JSON.stringify(message.answer)
        }

        if (type && payload) {
          controller.enqueue(
            encoder.encode(`event: ${type}\ndata: ${payload}\n\n`)
          )
        }
      })

      // END event
      call.on('end', () => {
        if (!closed) {
          closed = true
          console.log('✅ [SSE] gRPC stream ended')
          controller.close()
        }
      })

      // ERROR event
      call.on('error', (err: any) => {
        console.error('[SSE] gRPC error:', err.message)
        if (!closed) {
          closed = true
          controller.close()
        }
      })
    },
    cancel() {
      if (!closed) {
        closed = true
        console.log('🛑 [SSE] Client cancelled stream')
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}