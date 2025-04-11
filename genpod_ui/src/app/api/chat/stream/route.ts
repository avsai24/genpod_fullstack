import { NextRequest } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

// 1. Load proto
const PROTO_PATH = path.join(process.cwd(), 'protos', 'chat.proto')

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

// 2. Load gRPC object
const grpcObj = grpc.loadPackageDefinition(packageDef) as any
const chatPackage = grpcObj.chat

// ❗️ Correct this line (was grpcObject.chat)
const client = new chatPackage.ChatService(
  'localhost:50051',
  grpc.credentials.createInsecure()
) as any

// 3. Streaming Endpoint (SSE)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const message = searchParams.get('message') || ''

  const stream = new ReadableStream({
    start(controller) {
      const call = client.SendMessageStream({ user: 'user1', message })

      call.on('data', (chunk: any) => {
        const payload = JSON.stringify({ reply: chunk.reply })
        controller.enqueue(`data: ${payload}\n\n`)
      })

      call.on('end', () => {
        controller.close()
      })

      call.on('error', (err: any) => {
        console.error('gRPC error:', err)
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