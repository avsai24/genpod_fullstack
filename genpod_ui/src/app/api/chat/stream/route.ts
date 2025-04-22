import { NextRequest } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

// Load proto
const PROTO_PATH = path.resolve(process.cwd(), 'protos/agent.proto')
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const proto = grpc.loadPackageDefinition(packageDef) as any

const client = new proto.agent.AgentService(
  'localhost:50052',
  grpc.credentials.createInsecure()
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const message = searchParams.get('message') || ''
  const user_id = 'test_user'
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const call = client.RunAgentWorkflow({ user_id, prompt: message })

      call.on('data', (update: any) => {
        if (update?.log) {
          controller.enqueue(
            encoder.encode(`event: log\ndata: ${JSON.stringify(update.log)}\n\n`)
          )
        }

        if (update?.event) {
          controller.enqueue(
            encoder.encode(`event: event\ndata: ${JSON.stringify(update.event)}\n\n`)
          )
        }

        if (update?.answer) {
          controller.enqueue(
            encoder.encode(`event: final_answer\ndata: ${JSON.stringify(update.answer)}\n\n`)
          )
        }

        // ✅ NEW: handle workflow[]
        if (update?.workflow && Array.isArray(update.workflow.subtasks)) {
          controller.enqueue(
            encoder.encode(`event: workflow\ndata: ${JSON.stringify(update.workflow)}\n\n`)
          )
        }
      })

      call.on('end', () => {
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`))
        controller.close()
      })

      call.on('error', (err: any) => {
        console.error('[gRPC stream error]:', err.message)
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
        )
        controller.close()
      })
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